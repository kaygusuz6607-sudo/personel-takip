import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateOfficialSplit } from "@/lib/payroll-calculator";
import { syncStaffPayrolls } from "@/lib/payroll-sync";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PaymentItem {
  id: string;
  amount: number;
  type: "CASH" | "BANK";
  date: string;
  notes?: string | null;
}

function computePayrollPaymentStats(p: {
  netTotal: number;
  officialAmount: number;
  unofficialAmount: number;
  isPaid: boolean;
  paymentItems?: string | null;
}) {
  let items: PaymentItem[] = [];
  if (p.paymentItems) {
    try {
      items = JSON.parse(p.paymentItems);
      if (!Array.isArray(items)) items = [];
    } catch {
      items = [];
    }
  }

  let paidBankAmount = 0;
  let paidCashAmount = 0;

  if (items.length > 0) {
    paidBankAmount = items
      .filter((it) => it.type === "BANK")
      .reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
    paidCashAmount = items
      .filter((it) => it.type === "CASH")
      .reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  } else if (p.isPaid) {
    paidBankAmount = p.officialAmount;
    paidCashAmount = p.unofficialAmount;
  }

  // Yuvarlamalar
  paidBankAmount = Math.round(paidBankAmount * 100) / 100;
  paidCashAmount = Math.round(paidCashAmount * 100) / 100;

  const totalPaidAmount = Math.round((paidBankAmount + paidCashAmount) * 100) / 100;
  const remainingBankAmount = Math.max(0, Math.round((p.officialAmount - paidBankAmount) * 100) / 100);
  const remainingCashAmount = Math.max(0, Math.round((p.unofficialAmount - paidCashAmount) * 100) / 100);
  const remainingTotalAmount = Math.max(0, Math.round((p.netTotal - totalPaidAmount) * 100) / 100);

  const isBankPaid = remainingBankAmount <= 0.01 || p.officialAmount <= 0;
  const isCashPaid = remainingCashAmount <= 0.01 || p.unofficialAmount <= 0;
  const isFullyPaid = remainingTotalAmount <= 0.01;
  const isPartiallyPaid = totalPaidAmount > 0.01 && !isFullyPaid;

  return {
    items,
    paidBankAmount,
    paidCashAmount,
    totalPaidAmount,
    remainingBankAmount,
    remainingCashAmount,
    remainingTotalAmount,
    isBankPaid,
    isCashPaid,
    isFullyPaid,
    isPartiallyPaid,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");

    // Personel maaş veya sözleşme güncellemelerini açık bordrolarla ve cari hareketlerle otomatik eşleştir
    await syncStaffPayrolls(staffId || undefined, { createCurrentIfMissing: true });

    // 1. Tüm personellerin temel listesi ve cari özetleri (Sol/Üst seçim listesi için)
    const allStaff = await prisma.staff.findMany({
      include: {
        departments: { include: { department: true } },
        salaryConfig: true,
        payrolls: {
          select: {
            id: true,
            year: true,
            month: true,
            netTotal: true,
            grossTotal: true,
            officialAmount: true,
            unofficialAmount: true,
            bonusAmount: true,
            deductionAmount: true,
            isPaid: true,
            paymentItems: true,
          },
        },
      },
      orderBy: { fullName: "asc" },
    });

    const staffSummaries = allStaff.map((s) => {
      let totalNet = 0;
      let totalPaid = 0;
      let totalPending = 0;
      let totalBank = 0;
      let totalCash = 0;
      let totalBankPaid = 0;
      let totalCashPaid = 0;

      s.payrolls.forEach((p) => {
        totalNet += p.netTotal;
        totalBank += p.officialAmount;
        totalCash += p.unofficialAmount;

        const stats = computePayrollPaymentStats(p);
        totalPaid += stats.totalPaidAmount;
        totalPending += stats.remainingTotalAmount;
        totalBankPaid += stats.paidBankAmount;
        totalCashPaid += stats.paidCashAmount;
      });

      return {
        id: s.id,
        fullName: s.fullName,
        tcNo: s.tcNo,
        title: s.title || s.departments[0]?.department?.name || "Personel",
        status: s.status,
        hireDate: s.hireDate,
        terminationDate: s.terminationDate,
        totalNet,
        totalPaid,
        totalPending,
        totalBank,
        totalCash,
        totalBankPaid,
        totalCashPaid,
        payrollCount: s.payrolls.length,
      };
    });

    // Eğer staffId belirtilmemişse ilk aktif personeli seç (yoksa ilk personeli)
    const activeFirst = staffSummaries.find(
      (s) => s.status !== "PASSIVE" && s.status !== "TERMINATED" && !s.terminationDate
    );
    const targetStaffId = staffId || activeFirst?.id || (staffSummaries.length > 0 ? staffSummaries[0].id : null);

    if (!targetStaffId) {
      return NextResponse.json({
        staffSummaries: [],
        selectedStaff: null,
        payrolls: [],
        allTimeTotals: null,
      });
    }

    // 2. Seçilen personelin işe başladığı günden bugüne TÜM detaylı bordro ve cari hareketleri
    const staff = await prisma.staff.findUnique({
      where: { id: targetStaffId },
      include: {
        departments: { include: { department: true } },
        salaryConfig: true,
        payrolls: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Personel bulunamadı" }, { status: 404 });
    }

    // Her dönemin banka (resmî) ve elden (nakit) ayrımını atama tarihine ve kayıtlı ayarlara göre kesin hesapla
    const detailedPayrolls = staff.payrolls.map((p) => {
      const isManualElden = Boolean(p.notes && p.notes.includes("[MANUEL_ELDEN]"));
      const split = calculateOfficialSplit({
        netTotal: p.netTotal,
        monthlySalary: staff.salaryConfig?.monthlySalary || 0,
        salaryType: staff.salaryConfig?.salaryType,
        title: staff.title,
        year: p.year,
        month: p.month,
        hireDate: staff.hireDate,
        mebAssignmentDate: staff.mebAssignmentDate,
        sgkStartDate: staff.sgkStartDate,
        officialSalaryPart: staff.salaryConfig?.officialSalaryPart || 0,
        reportDays: p.reportDays,
        manualUnofficialAmount: isManualElden ? p.unofficialAmount : null,
      });

      const stats = computePayrollPaymentStats({
        netTotal: p.netTotal,
        officialAmount: split.officialAmount,
        unofficialAmount: split.unofficialAmount,
        isPaid: p.isPaid,
        paymentItems: p.paymentItems,
      });

      return {
        ...p,
        officialAmount: split.officialAmount,
        unofficialAmount: split.unofficialAmount,
        paidBankAmount: stats.paidBankAmount,
        paidCashAmount: stats.paidCashAmount,
        totalPaidAmount: stats.totalPaidAmount,
        remainingBankAmount: stats.remainingBankAmount,
        remainingCashAmount: stats.remainingCashAmount,
        remainingTotalAmount: stats.remainingTotalAmount,
        isBankPaid: stats.isBankPaid,
        isCashPaid: stats.isCashPaid,
        isFullyPaid: stats.isFullyPaid,
        isPartiallyPaid: stats.isPartiallyPaid,
        paymentItems: stats.items,
      };
    });

    // Tüm zamanlar kümülatif toplamları
    const allTimeTotals = {
      totalGross: detailedPayrolls.reduce((sum, p) => sum + p.grossTotal, 0),
      totalNet: detailedPayrolls.reduce((sum, p) => sum + p.netTotal, 0),
      totalBank: detailedPayrolls.reduce((sum, p) => sum + p.officialAmount, 0),
      totalCash: detailedPayrolls.reduce((sum, p) => sum + p.unofficialAmount, 0),
      totalBonus: detailedPayrolls.reduce((sum, p) => sum + p.bonusAmount, 0),
      totalDeduction: detailedPayrolls.reduce((sum, p) => sum + p.deductionAmount, 0),
      totalPaid: detailedPayrolls.reduce((sum, p) => sum + p.totalPaidAmount, 0),
      totalPending: detailedPayrolls.reduce((sum, p) => sum + p.remainingTotalAmount, 0),
      totalBankPaid: detailedPayrolls.reduce((sum, p) => sum + p.paidBankAmount, 0),
      totalCashPaid: detailedPayrolls.reduce((sum, p) => sum + p.paidCashAmount, 0),
      payrollCount: detailedPayrolls.length,
      paidCount: detailedPayrolls.filter((p) => p.isFullyPaid).length,
      partialCount: detailedPayrolls.filter((p) => p.isPartiallyPaid).length,
      pendingCount: detailedPayrolls.filter((p) => !p.isFullyPaid && !p.isPartiallyPaid).length,
    };

    return NextResponse.json({
      staffSummaries,
      selectedStaff: {
        id: staff.id,
        fullName: staff.fullName,
        tcNo: staff.tcNo,
        phone: staff.phone,
        email: staff.email,
        iban: staff.iban,
        accountNumber: staff.accountNumber,
        title: staff.title,
        status: staff.status,
        hireDate: staff.hireDate,
        terminationDate: staff.terminationDate,
        mebAssignmentDate: staff.mebAssignmentDate,
        mebAssignmentEndDate: staff.mebAssignmentEndDate,
        isMebPermanent: staff.isMebPermanent,
        sgkStartDate: staff.sgkStartDate,
        unofficialWorkPeriod: staff.unofficialWorkPeriod,
        departments: staff.departments.map((d) => d.department.name),
        salaryConfig: staff.salaryConfig,
      },
      payrolls: detailedPayrolls,
      allTimeTotals,
    });
  } catch (error: any) {
    console.error("Cari verisi alınırken hata:", error);
    return NextResponse.json(
      { error: "Cari verisi alınamadı: " + error.message },
      { status: 500 }
    );
  }
}

// Cari tablosundan parça ödeme, tam ödeme veya silme işlemleri
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { payrollId, action, amount, type, date, notes, paymentItemId, isPaid } = body;

    if (!payrollId) {
      return NextResponse.json({ error: "Bordro ID zorunludur" }, { status: 400 });
    }

    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: {
        staff: {
          include: { salaryConfig: true },
        },
      },
    });

    if (!payroll) {
      return NextResponse.json({ error: "Bordro kaydı bulunamadı" }, { status: 404 });
    }

    // Elden ve resmi tutarları kesin hesapla
    const isManualElden = Boolean(payroll.notes && payroll.notes.includes("[MANUEL_ELDEN]"));
    const split = calculateOfficialSplit({
      netTotal: payroll.netTotal,
      monthlySalary: payroll.staff.salaryConfig?.monthlySalary || 0,
      salaryType: payroll.staff.salaryConfig?.salaryType,
      title: payroll.staff.title,
      year: payroll.year,
      month: payroll.month,
      hireDate: payroll.staff.hireDate,
      mebAssignmentDate: payroll.staff.mebAssignmentDate,
      sgkStartDate: payroll.staff.sgkStartDate,
      officialSalaryPart: payroll.staff.salaryConfig?.officialSalaryPart || 0,
      reportDays: payroll.reportDays,
      manualUnofficialAmount: isManualElden ? payroll.unofficialAmount : null,
    });

    let currentItems: PaymentItem[] = [];
    if (payroll.paymentItems) {
      try {
        currentItems = JSON.parse(payroll.paymentItems);
        if (!Array.isArray(currentItems)) currentItems = [];
      } catch {
        currentItems = [];
      }
    } else if (payroll.isPaid) {
      // Eğer önceden tek tıkla ödendi yapılmış ve paymentItems boşsa
      if (split.officialAmount > 0) {
        currentItems.push({
          id: `legacy_bank_${payroll.id}`,
          amount: split.officialAmount,
          type: "BANK",
          date: payroll.paidDate ? new Date(payroll.paidDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          notes: "Resmî Banka Ödemesi",
        });
      }
      if (split.unofficialAmount > 0) {
        currentItems.push({
          id: `legacy_cash_${payroll.id}`,
          amount: split.unofficialAmount,
          type: "CASH",
          date: payroll.paidDate ? new Date(payroll.paidDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          notes: "Elden Nakit Ödeme",
        });
      }
    }

    const payDate = date || new Date().toISOString().slice(0, 10);

    // ================= 1. PARÇA ÖDEME EKLE =================
    if (action === "ADD_PAYMENT") {
      const parsedAmount = Math.round(Number(amount) * 100) / 100;
      if (!parsedAmount || parsedAmount <= 0) {
        return NextResponse.json({ error: "Geçerli bir ödeme tutarı giriniz" }, { status: 400 });
      }

      const paymentType = type === "BANK" ? "BANK" : "CASH";
      const newItem: PaymentItem = {
        id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        amount: parsedAmount,
        type: paymentType,
        date: payDate,
        notes: notes?.trim() || (paymentType === "BANK" ? "Banka Havale/EFT" : "Elden Nakit Ödeme"),
      };

      const updatedItems = [...currentItems, newItem];
      const totalPaid = updatedItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
      const isFully = totalPaid >= payroll.netTotal - 0.01;

      const updated = await prisma.payroll.update({
        where: { id: payrollId },
        data: {
          paymentItems: JSON.stringify(updatedItems),
          isPaid: isFully,
          paidDate: isFully ? new Date(payDate) : payroll.paidDate,
        },
      });

      return NextResponse.json({ success: true, payroll: updated });
    }

    // ================= 2. PARÇA ÖDEME SİL =================
    if (action === "DELETE_PAYMENT") {
      if (!paymentItemId) {
        return NextResponse.json({ error: "Silinecek ödeme kalemi belirtilmedi" }, { status: 400 });
      }

      const updatedItems = currentItems.filter((it) => it.id !== paymentItemId);
      const totalPaid = updatedItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
      const isFully = totalPaid >= payroll.netTotal - 0.01;

      const updated = await prisma.payroll.update({
        where: { id: payrollId },
        data: {
          paymentItems: updatedItems.length > 0 ? JSON.stringify(updatedItems) : null,
          isPaid: isFully,
          paidDate: isFully ? payroll.paidDate : null,
        },
      });

      return NextResponse.json({ success: true, payroll: updated });
    }

    // ================= 3. BANKA PAYINI TEK TIKLA KAPAT =================
    if (action === "PAY_BANK_FULL") {
      const currentBankPaid = currentItems
        .filter((it) => it.type === "BANK")
        .reduce((s, it) => s + (Number(it.amount) || 0), 0);
      const remainingBank = Math.max(0, Math.round((split.officialAmount - currentBankPaid) * 100) / 100);

      if (remainingBank <= 0) {
        return NextResponse.json({ error: "Banka payının tamamı zaten ödenmiş" }, { status: 400 });
      }

      const newItem: PaymentItem = {
        id: `pay_${Date.now()}_bank`,
        amount: remainingBank,
        type: "BANK",
        date: payDate,
        notes: notes?.trim() || "Banka Maaş Transferi (Tamamlandı)",
      };

      const updatedItems = [...currentItems, newItem];
      const totalPaid = updatedItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
      const isFully = totalPaid >= payroll.netTotal - 0.01;

      const updated = await prisma.payroll.update({
        where: { id: payrollId },
        data: {
          paymentItems: JSON.stringify(updatedItems),
          isPaid: isFully,
          paidDate: isFully ? new Date(payDate) : payroll.paidDate,
        },
      });

      return NextResponse.json({ success: true, payroll: updated });
    }

    // ================= 4. ELDEN NAKİT PAYINI TEK TIKLA KAPAT =================
    if (action === "PAY_CASH_FULL") {
      const currentCashPaid = currentItems
        .filter((it) => it.type === "CASH")
        .reduce((s, it) => s + (Number(it.amount) || 0), 0);
      const remainingCash = Math.max(0, Math.round((split.unofficialAmount - currentCashPaid) * 100) / 100);

      if (remainingCash <= 0) {
        return NextResponse.json({ error: "Elden nakit payının tamamı zaten ödenmiş" }, { status: 400 });
      }

      const newItem: PaymentItem = {
        id: `pay_${Date.now()}_cash`,
        amount: remainingCash,
        type: "CASH",
        date: payDate,
        notes: notes?.trim() || "Elden Nakit Ödeme (Tamamlandı)",
      };

      const updatedItems = [...currentItems, newItem];
      const totalPaid = updatedItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
      const isFully = totalPaid >= payroll.netTotal - 0.01;

      const updated = await prisma.payroll.update({
        where: { id: payrollId },
        data: {
          paymentItems: JSON.stringify(updatedItems),
          isPaid: isFully,
          paidDate: isFully ? new Date(payDate) : payroll.paidDate,
        },
      });

      return NextResponse.json({ success: true, payroll: updated });
    }

    // ================= 5. TÜMÜNÜ ÖDENDİ YAP =================
    if (action === "PAY_FULL") {
      const currentBankPaid = currentItems
        .filter((it) => it.type === "BANK")
        .reduce((s, it) => s + (Number(it.amount) || 0), 0);
      const currentCashPaid = currentItems
        .filter((it) => it.type === "CASH")
        .reduce((s, it) => s + (Number(it.amount) || 0), 0);

      const remBank = Math.max(0, Math.round((split.officialAmount - currentBankPaid) * 100) / 100);
      const remCash = Math.max(0, Math.round((split.unofficialAmount - currentCashPaid) * 100) / 100);

      const updatedItems = [...currentItems];
      if (remBank > 0) {
        updatedItems.push({
          id: `pay_${Date.now()}_b`,
          amount: remBank,
          type: "BANK",
          date: payDate,
          notes: "Banka Transferi",
        });
      }
      if (remCash > 0) {
        updatedItems.push({
          id: `pay_${Date.now()}_c`,
          amount: remCash,
          type: "CASH",
          date: payDate,
          notes: "Elden Nakit",
        });
      }

      const updated = await prisma.payroll.update({
        where: { id: payrollId },
        data: {
          paymentItems: JSON.stringify(updatedItems),
          isPaid: true,
          paidDate: new Date(payDate),
        },
      });

      return NextResponse.json({ success: true, payroll: updated });
    }

    // ================= 6. TÜM ÖDEMELERİ SIFIRLA =================
    if (action === "RESET_PAYMENTS") {
      const updated = await prisma.payroll.update({
        where: { id: payrollId },
        data: {
          paymentItems: null,
          isPaid: false,
          paidDate: null,
        },
      });

      return NextResponse.json({ success: true, payroll: updated });
    }

    // ================= 7. KLASİK TOGGLE (ESKİ UYUMLULUK) =================
    if (isPaid !== undefined) {
      if (isPaid) {
        // Tamamını ödendi yap
        const items: PaymentItem[] = [];
        if (split.officialAmount > 0) {
          items.push({
            id: `pay_${Date.now()}_b`,
            amount: split.officialAmount,
            type: "BANK",
            date: payDate,
            notes: "Banka Transferi",
          });
        }
        if (split.unofficialAmount > 0) {
          items.push({
            id: `pay_${Date.now()}_c`,
            amount: split.unofficialAmount,
            type: "CASH",
            date: payDate,
            notes: "Elden Nakit",
          });
        }

        const updated = await prisma.payroll.update({
          where: { id: payrollId },
          data: {
            paymentItems: JSON.stringify(items),
            isPaid: true,
            paidDate: new Date(),
          },
        });
        return NextResponse.json(updated);
      } else {
        const updated = await prisma.payroll.update({
          where: { id: payrollId },
          data: {
            paymentItems: null,
            isPaid: false,
            paidDate: null,
          },
        });
        return NextResponse.json(updated);
      }
    }

    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  } catch (error: any) {
    console.error("Cari ödeme güncelleme hatası:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
