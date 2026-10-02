import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncRefundToSchoolExpenses } from "@/lib/student-refund-sync";

export const dynamic = "force-dynamic";

const TR_MONTHS = [
  "",
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

function formatDateStr(day: number, month: number, year: number): string {
  return `${day} ${TR_MONTHS[month] || month} ${year}`;
}

export async function GET() {
  try {
    const refunds = await prisma.studentRefund.findMany({
      include: {
        installments: {
          orderBy: { installmentNo: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let totalCommitment = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let activeFiles = 0;
    let completedFiles = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingInstallments: any[] = [];

    for (const r of refunds) {
      if (r.status !== "CANCELLED") {
        totalCommitment += r.totalAmount;
      }

      let filePaid = 0;
      let fileRemaining = 0;

      for (const inst of r.installments) {
        filePaid += inst.paidAmount;
        fileRemaining += inst.remainingAmount;

        if (inst.status !== "PAID") {
          const d = new Date(inst.dueDate);
          d.setHours(0, 0, 0, 0);
          const diffDays = Math.round(
            (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          upcomingInstallments.push({
            ...inst,
            studentName: r.studentName,
            parentName: r.parentName,
            phone: r.phone,
            iban: r.iban,
            daysLeft: diffDays,
          });
        }
      }

      totalPaid += filePaid;
      totalRemaining += fileRemaining;

      if (r.status === "COMPLETED" || (r.installments.length > 0 && fileRemaining === 0)) {
        completedFiles++;
      } else if (r.status === "ACTIVE") {
        activeFiles++;
      }
    }

    // Yaklaşan taksitleri vade tarihine göre sırala
    upcomingInstallments.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    return NextResponse.json({
      refunds,
      upcomingInstallments: upcomingInstallments.slice(0, 10), // İlk 10 yaklaşan
      stats: {
        totalFiles: refunds.length,
        activeFiles,
        completedFiles,
        totalCommitment: Number(totalCommitment.toFixed(2)),
        totalPaid: Number(totalPaid.toFixed(2)),
        totalRemaining: Number(totalRemaining.toFixed(2)),
      },
    });
  } catch (error: any) {
    console.error("Kayıt silme iadeleri GET hatası:", error);
    return NextResponse.json(
      { error: error.message || "İadeler listelenirken hata oluştu" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      studentName,
      parentName,
      phone,
      iban,
      reason = "Kayıt Silme / Nakil İadesi",
      cancellationDate,
      startDate,
      totalAmount,
      installmentCount = 1,
      notes,
      customInstallments,
    } = body;

    if (!studentName || !studentName.trim()) {
      return NextResponse.json(
        { error: "Öğrenci Adı Soyadı zorunludur." },
        { status: 400 }
      );
    }

    const totAmt = Math.max(0, Number(totalAmount) || 0);
    const instCount = Math.max(1, parseInt(String(installmentCount), 10) || 1);
    const sDate = startDate ? new Date(startDate) : new Date();
    const cDate = cancellationDate ? new Date(cancellationDate) : new Date();

    const hasCustom = Array.isArray(customInstallments) && customInstallments.length > 0;
    const finalInstCount = hasCustom ? customInstallments.length : instCount;
    const finalTotalAmount = hasCustom
      ? Number(
          customInstallments
            .reduce((sum: number, ci: any) => sum + (Math.max(0, Number(ci.amount)) || 0), 0)
            .toFixed(2)
        )
      : totAmt;

    // 1. İade Dosyasını Oluştur
    const refund = await prisma.studentRefund.create({
      data: {
        studentName: studentName.trim(),
        parentName: parentName ? parentName.trim() : null,
        phone: phone ? phone.trim() : null,
        iban: iban ? iban.trim() : null,
        reason: reason ? reason.trim() : null,
        cancellationDate: cDate,
        startDate: sDate,
        totalAmount: finalTotalAmount,
        installmentCount: finalInstCount,
        notes: notes ? notes.trim() : null,
        status: "ACTIVE",
      },
    });

    // 2. Taksitleri Oluştur
    if (Array.isArray(customInstallments) && customInstallments.length > 0) {
      for (let i = 0; i < customInstallments.length; i++) {
        const ci = customInstallments[i];
        const instDueDate = ci.dueDate ? new Date(ci.dueDate) : sDate;
        const dStr = formatDateStr(
          instDueDate.getDate(),
          instDueDate.getMonth() + 1,
          instDueDate.getFullYear()
        );
        const instAmt = Math.max(0, Number(ci.amount) || 0);

        await prisma.refundInstallment.create({
          data: {
            refundId: refund.id,
            installmentNo: i + 1,
            dueDate: instDueDate,
            dueDateStr: dStr,
            amount: instAmt,
            paidAmount: 0,
            remainingAmount: instAmt,
            status: "PENDING",
            paymentMethod: ci.paymentMethod || "BANK_TRANSFER",
            notes: ci.notes || null,
          },
        });
      }
    } else {
      // Otomatik Taksitlendirme (Aylık)
      const basePerInst = Number((totAmt / instCount).toFixed(2));
      let currentRemainder = totAmt;

      const sYear = sDate.getFullYear();
      const sMonth = sDate.getMonth() + 1; // 1-12
      const targetDay = sDate.getDate();

      for (let i = 0; i < instCount; i++) {
        const isLast = i === instCount - 1;
        const instAmt = isLast ? Number(currentRemainder.toFixed(2)) : basePerInst;
        currentRemainder -= instAmt;

        const targetMonthOffset = sMonth - 1 + i;
        const rYear = sYear + Math.floor(targetMonthOffset / 12);
        const rMonth = (targetMonthOffset % 12) + 1;
        const lastDayOfMonth = new Date(rYear, rMonth, 0).getDate();
        const safeDay = Math.min(targetDay, lastDayOfMonth);

        const instDueDate = new Date(rYear, rMonth - 1, safeDay, 12, 0, 0);
        const dStr = formatDateStr(safeDay, rMonth, rYear);

        await prisma.refundInstallment.create({
          data: {
            refundId: refund.id,
            installmentNo: i + 1,
            dueDate: instDueDate,
            dueDateStr: dStr,
            amount: instAmt,
            paidAmount: 0,
            remainingAmount: instAmt,
            status: "PENDING",
            paymentMethod: "BANK_TRANSFER",
          },
        });
      }
    }

    const created = await prisma.studentRefund.findUnique({
      where: { id: refund.id },
      include: {
        installments: { orderBy: { installmentNo: "asc" } },
      },
    });

    await syncRefundToSchoolExpenses(refund.id);

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Kayıt silme iadesi oluşturma hatası:", error);
    return NextResponse.json(
      { error: error.message || "İade dosyası oluşturulamadı" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { action = "UPDATE_REFUND", refundId, installmentId } = body;

    // 1. Taksit Ödemesi Yap
    if (action === "PAY_INSTALLMENT" && installmentId) {
      const inst = await prisma.refundInstallment.findUnique({
        where: { id: installmentId },
        include: { refund: { include: { installments: true } } },
      });
      if (!inst) {
        return NextResponse.json({ error: "Taksit bulunamadı" }, { status: 404 });
      }

      const payAmt =
        body.paidAmount !== undefined
          ? Math.max(0, Number(body.paidAmount))
          : inst.remainingAmount;
      const newPaid = Number((inst.paidAmount + payAmt).toFixed(2));
      const newRemaining = Math.max(0, Number((inst.amount - newPaid).toFixed(2)));
      const newStatus = newRemaining === 0 ? "PAID" : "PARTIAL";

      const updated = await prisma.refundInstallment.update({
        where: { id: installmentId },
        data: {
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          status: newStatus,
          paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
          paymentMethod: body.paymentMethod || inst.paymentMethod || "BANK_TRANSFER",
          notes: body.notes !== undefined ? body.notes : inst.notes,
        },
      });

      // Dosya genel durumunu kontrol et
      const allInst = await prisma.refundInstallment.findMany({
        where: { refundId: inst.refundId },
      });
      const allDone = allInst.every((x) => x.remainingAmount === 0);
      if (allDone) {
        await prisma.studentRefund.update({
          where: { id: inst.refundId },
          data: { status: "COMPLETED" },
        });
      }

      await syncRefundToSchoolExpenses(inst.refundId);

      return NextResponse.json(updated);
    }

    // 2. Taksit Ödemesini Geri Al (Unpay)
    if (action === "UNPAY_INSTALLMENT" && installmentId) {
      const inst = await prisma.refundInstallment.findUnique({
        where: { id: installmentId },
      });
      if (!inst) {
        return NextResponse.json({ error: "Taksit bulunamadı" }, { status: 404 });
      }

      const updated = await prisma.refundInstallment.update({
        where: { id: installmentId },
        data: {
          paidAmount: 0,
          remainingAmount: inst.amount,
          status: "PENDING",
          paymentDate: null,
        },
      });

      await prisma.studentRefund.update({
        where: { id: inst.refundId },
        data: { status: "ACTIVE" },
      });

      await syncRefundToSchoolExpenses(inst.refundId);

      return NextResponse.json(updated);
    }

    // 3. Tek Bir Taksiti Düzenle (Vade, Tutar vb.)
    if (action === "UPDATE_INSTALLMENT" && installmentId) {
      const inst = await prisma.refundInstallment.findUnique({
        where: { id: installmentId },
      });
      if (!inst) {
        return NextResponse.json({ error: "Taksit bulunamadı" }, { status: 404 });
      }

      let newDueDate = inst.dueDate;
      let newDueDateStr = inst.dueDateStr;
      if (body.dueDate) {
        newDueDate = new Date(body.dueDate);
        newDueDateStr = formatDateStr(
          newDueDate.getDate(),
          newDueDate.getMonth() + 1,
          newDueDate.getFullYear()
        );
      }

      const newAmount =
        body.amount !== undefined ? Math.max(0, Number(body.amount)) : inst.amount;
      const newRemaining = Math.max(
        0,
        Number((newAmount - inst.paidAmount).toFixed(2))
      );
      const newStatus =
        inst.paidAmount === 0
          ? "PENDING"
          : newRemaining === 0
          ? "PAID"
          : "PARTIAL";

      const updated = await prisma.refundInstallment.update({
        where: { id: installmentId },
        data: {
          dueDate: newDueDate,
          dueDateStr: newDueDateStr,
          amount: newAmount,
          remainingAmount: newRemaining,
          status: newStatus,
          notes: body.notes !== undefined ? body.notes : inst.notes,
          paymentMethod: body.paymentMethod || inst.paymentMethod,
        },
      });

      // Ana dosya toplamını taksitlerin toplamına göre senkronize et
      const allInst = await prisma.refundInstallment.findMany({
        where: { refundId: inst.refundId },
      });
      const newTotal = allInst.reduce((sum, item) => sum + item.amount, 0);
      await prisma.studentRefund.update({
        where: { id: inst.refundId },
        data: {
          totalAmount: Number(newTotal.toFixed(2)),
          installmentCount: allInst.length,
        },
      });

      await syncRefundToSchoolExpenses(inst.refundId);

      return NextResponse.json(updated);
    }

    // 4. Tüm Taksitleri Toplu Düzenle (Bulk Edit)
    if (
      action === "BULK_UPDATE_INSTALLMENTS" &&
      refundId &&
      Array.isArray(body.installments)
    ) {
      const incomingList = body.installments;
      const existingList = await prisma.refundInstallment.findMany({
        where: { refundId },
        orderBy: { installmentNo: "asc" },
      });

      const incomingIds = new Set(
        incomingList
          .map((x: any) => x.id)
          .filter((id: any) => id && !String(id).startsWith("new_"))
      );

      // 1. Silinen taksitleri kontrol et ve kaldır
      for (const existing of existingList) {
        if (!incomingIds.has(existing.id)) {
          if (existing.paidAmount > 0) {
            return NextResponse.json(
              {
                error: `Taksit ${existing.installmentNo} üzerinde ödeme (${existing.paidAmount} TL) bulunduğu için silinemez. Önce ödemeyi geri alınız.`,
              },
              { status: 400 }
            );
          }
          await prisma.refundInstallment.delete({
            where: { id: existing.id },
          });
        }
      }

      // 2. Mevcutları güncelle veya yenileri ekle
      let index = 1;
      for (const item of incomingList) {
        let d = item.dueDate ? new Date(item.dueDate) : new Date();
        const dStr = formatDateStr(
          d.getDate(),
          d.getMonth() + 1,
          d.getFullYear()
        );
        const amt = Math.max(0, Number(item.amount) || 0);
        const notes = item.notes !== undefined ? item.notes : null;

        const isRealExisting = item.id && !String(item.id).startsWith("new_");
        if (isRealExisting) {
          const current = await prisma.refundInstallment.findUnique({
            where: { id: item.id },
          });
          const paid = current ? current.paidAmount : 0;
          const rem = Math.max(0, Number((amt - paid).toFixed(2)));
          const st = paid === 0 ? "PENDING" : rem === 0 ? "PAID" : "PARTIAL";

          await prisma.refundInstallment.update({
            where: { id: item.id },
            data: {
              installmentNo: index,
              dueDate: d,
              dueDateStr: dStr,
              amount: amt,
              remainingAmount: rem,
              status: st,
              notes,
            },
          });
        } else {
          // Yeni taksit oluştur
          await prisma.refundInstallment.create({
            data: {
              refundId,
              installmentNo: index,
              dueDate: d,
              dueDateStr: dStr,
              amount: amt,
              paidAmount: 0,
              remainingAmount: amt,
              status: "PENDING",
              paymentMethod: item.paymentMethod || "BANK_TRANSFER",
              notes,
            },
          });
        }
        index++;
      }

      // 3. Ana dosya toplamını ve taksit sayısını güncelle
      const allInst = await prisma.refundInstallment.findMany({
        where: { refundId },
        orderBy: { installmentNo: "asc" },
      });
      const newTotal = allInst.reduce((sum, item) => sum + item.amount, 0);
      await prisma.studentRefund.update({
        where: { id: refundId },
        data: {
          totalAmount: Number(newTotal.toFixed(2)),
          installmentCount: allInst.length,
        },
      });

      const refreshed = await prisma.studentRefund.findUnique({
        where: { id: refundId },
        include: {
          installments: { orderBy: { installmentNo: "asc" } },
        },
      });

      await syncRefundToSchoolExpenses(refundId);

      return NextResponse.json(refreshed);
    }

    // 5. İade Dosyasına Yeni Taksit Ekle
    if (action === "ADD_INSTALLMENT" && refundId) {
      const refund = await prisma.studentRefund.findUnique({
        where: { id: refundId },
        include: { installments: true },
      });
      if (!refund) return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });

      const nextNo = refund.installments.length + 1;
      const d = body.dueDate ? new Date(body.dueDate) : new Date();
      const dStr = formatDateStr(d.getDate(), d.getMonth() + 1, d.getFullYear());
      const amt = Math.max(0, Number(body.amount) || 0);

      await prisma.refundInstallment.create({
        data: {
          refundId,
          installmentNo: nextNo,
          dueDate: d,
          dueDateStr: dStr,
          amount: amt,
          paidAmount: 0,
          remainingAmount: amt,
          status: "PENDING",
          paymentMethod: body.paymentMethod || "BANK_TRANSFER",
          notes: body.notes || null,
        },
      });

      const all = await prisma.refundInstallment.findMany({ where: { refundId } });
      const newTotal = all.reduce((sum, x) => sum + x.amount, 0);
      await prisma.studentRefund.update({
        where: { id: refundId },
        data: { totalAmount: Number(newTotal.toFixed(2)), installmentCount: all.length },
      });

      const refreshed = await prisma.studentRefund.findUnique({
        where: { id: refundId },
        include: { installments: { orderBy: { installmentNo: "asc" } } },
      });

      await syncRefundToSchoolExpenses(refundId);

      return NextResponse.json(refreshed);
    }

    // 6. Ana Dosya Bilgilerini Güncelle (UPDATE_REFUND)
    if (action === "UPDATE_REFUND" && refundId) {
      const {
        studentName,
        parentName,
        phone,
        iban,
        reason,
        notes: refNotes,
        status: refStatus,
      } = body;

      const updated = await prisma.studentRefund.update({
        where: { id: refundId },
        data: {
          ...(studentName ? { studentName: studentName.trim() } : {}),
          ...(parentName !== undefined ? { parentName: parentName ? parentName.trim() : null } : {}),
          ...(phone !== undefined ? { phone: phone ? phone.trim() : null } : {}),
          ...(iban !== undefined ? { iban: iban ? iban.trim() : null } : {}),
          ...(reason !== undefined ? { reason: reason ? reason.trim() : null } : {}),
          ...(refNotes !== undefined ? { notes: refNotes ? refNotes.trim() : null } : {}),
          ...(refStatus ? { status: refStatus } : {}),
        },
        include: {
          installments: { orderBy: { installmentNo: "asc" } },
        },
      });

      await syncRefundToSchoolExpenses(refundId);

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  } catch (error: any) {
    console.error("Kayıt silme iadesi güncelleme hatası:", error);
    return NextResponse.json(
      { error: error.message || "Güncelleme yapılamadı" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const refundId = searchParams.get("refundId");
    const installmentId = searchParams.get("installmentId");

    if (installmentId) {
      const inst = await prisma.refundInstallment.findUnique({
        where: { id: installmentId },
      });
      if (inst) {
        if (inst.paidAmount > 0) {
          return NextResponse.json(
            { error: `Taksit üzerinde ödeme (${inst.paidAmount} TL) bulunduğu için silinemez. Önce ödemeyi geri alınız.` },
            { status: 400 }
          );
        }
        await prisma.refundInstallment.delete({ where: { id: installmentId } });
        const remainingInsts = await prisma.refundInstallment.findMany({
          where: { refundId: inst.refundId },
          orderBy: { installmentNo: "asc" },
        });

        // Taksit numaralarını yeniden sırala
        for (let i = 0; i < remainingInsts.length; i++) {
          if (remainingInsts[i].installmentNo !== i + 1) {
            await prisma.refundInstallment.update({
              where: { id: remainingInsts[i].id },
              data: { installmentNo: i + 1 },
            });
          }
        }

        const newTotal = remainingInsts.reduce((sum, item) => sum + item.amount, 0);
        await prisma.studentRefund.update({
          where: { id: inst.refundId },
          data: {
            totalAmount: Number(newTotal.toFixed(2)),
            installmentCount: remainingInsts.length,
          },
        });
        await syncRefundToSchoolExpenses(inst.refundId);
      }
      return NextResponse.json({ success: true, message: "Taksit silindi" });
    }

    if (refundId) {
      await prisma.studentRefund.delete({
        where: { id: refundId },
      });
      await syncRefundToSchoolExpenses(refundId);
      return NextResponse.json({
        success: true,
        message: "İade dosyası ve tüm taksitleri silindi",
      });
    }

    return NextResponse.json(
      { error: "refundId veya installmentId zorunludur" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Kayıt silme iadesi silme hatası:", error);
    return NextResponse.json(
      { error: error.message || "Silinemedi" },
      { status: 500 }
    );
  }
}
