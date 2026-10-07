import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureChequeTable, ChequeRecordRow } from "@/lib/cheque-sync";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureChequeTable();
    const { id } = await params;

    const rows = (await prisma.$queryRawUnsafe(
      `SELECT * FROM ChequeRecord WHERE id = ? LIMIT 1`,
      id
    )) as ChequeRecordRow[];

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Çek bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({ cheque: rows[0] });
  } catch (error) {
    console.error("Çek detayı alınamadı:", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureChequeTable();
    const { id } = await params;
    const body = await request.json();

    const existingRows = (await prisma.$queryRawUnsafe(
      `SELECT * FROM ChequeRecord WHERE id = ? LIMIT 1`,
      id
    )) as ChequeRecordRow[];

    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json({ error: "Güncellenecek çek bulunamadı." }, { status: 404 });
    }

    const current = existingRows[0];
    const nowISO = new Date().toISOString();

    // Hızlı durum güncellemesi
    if (body.action === "TOGGLE_STATUS" || body.status !== undefined) {
      const nextStatus =
        body.action === "TOGGLE_STATUS"
          ? current.status === "COLLECTED"
            ? "PORTFOLIO"
            : "COLLECTED"
          : body.status;

      const isPaid = nextStatus === "COLLECTED";

      await prisma.$executeRawUnsafe(
        `UPDATE ChequeRecord SET
           status = ?,
           paymentDate = ?,
           updatedAt = ?
         WHERE id = ?`,
        nextStatus,
        isPaid ? nowISO : null,
        nowISO,
        id
      );

      // Bağlı SchoolExpense varsa senkronize et
      if (current.expenseId) {
        try {
          const exp = await prisma.schoolExpense.findUnique({
            where: { id: current.expenseId },
          });
          if (exp) {
            await prisma.schoolExpense.update({
              where: { id: current.expenseId },
              data: {
                status: isPaid ? "PAID" : "PENDING",
                amountPaid: isPaid ? exp.amountDue : 0,
                amountRemaining: isPaid ? 0 : exp.amountDue,
                periodStatus: isPaid ? "Ödendi" : "Cari Dönem",
              },
            });
          }
        } catch (expErr) {
          console.error("Bağlı gider güncellenirken hata:", expErr);
        }
      }

      return NextResponse.json({
        success: true,
        status: nextStatus,
        paymentDate: isPaid ? nowISO : null,
      });
    }

    // Tam form güncellemesi
    const {
      type = current.type,
      chequeNo = current.chequeNo,
      bank = current.bank,
      branch = current.branch,
      accountNo = current.accountNo,
      issuer = current.issuer,
      recipient = current.recipient,
      amount = current.amount,
      issueDate = current.issueDate,
      dueDate = current.dueDate,
      dueDateStr = current.dueDateStr,
      status = current.status,
      notes = current.notes,
      photoUrl = current.photoUrl,
    } = body;

    const numAmount = Number(amount) || current.amount;

    await prisma.$executeRawUnsafe(
      `UPDATE ChequeRecord SET
         type = ?,
         chequeNo = ?,
         bank = ?,
         branch = ?,
         accountNo = ?,
         issuer = ?,
         recipient = ?,
         amount = ?,
         issueDate = ?,
         dueDate = ?,
         dueDateStr = ?,
         status = ?,
         paymentDate = CASE WHEN ? = 'COLLECTED' THEN COALESCE(paymentDate, ?) ELSE NULL END,
         notes = ?,
         photoUrl = COALESCE(?, photoUrl),
         updatedAt = ?
       WHERE id = ?`,
      type,
      chequeNo || null,
      bank || null,
      branch || null,
      accountNo || null,
      issuer || null,
      recipient || null,
      numAmount,
      issueDate || null,
      dueDate || null,
      dueDateStr || null,
      status,
      status,
      nowISO,
      notes || null,
      photoUrl || null,
      nowISO,
      id
    );

    // Eğer fotoğraf sağlandıysa ChequePhotoStore'u da güncelle
    if (photoUrl) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO ChequePhotoStore (id, photoUrl, title, updatedAt)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           photoUrl = excluded.photoUrl,
           title = excluded.title,
           updatedAt = excluded.updatedAt`,
        id,
        photoUrl,
        (type === "GIVEN" ? recipient : issuer) || "Çek Görseli",
        nowISO
      );
      if (current.expenseId) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO ChequePhotoStore (id, photoUrl, title, updatedAt)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             photoUrl = excluded.photoUrl,
             title = excluded.title,
             updatedAt = excluded.updatedAt`,
          current.expenseId,
          photoUrl,
          recipient || "Çek Görseli",
          nowISO
        );
      }
    }

    // Bağlı SchoolExpense varsa temel bilgileri güncelle
    if (current.expenseId) {
      try {
        await prisma.schoolExpense.update({
          where: { id: current.expenseId },
          data: {
            title: recipient || issuer || undefined,
            amountDue: numAmount,
            amountRemaining: status === "COLLECTED" ? 0 : numAmount,
            amountPaid: status === "COLLECTED" ? numAmount : 0,
            status: status === "COLLECTED" ? "PAID" : "PENDING",
            periodStatus: status === "COLLECTED" ? "Ödendi" : "Cari Dönem",
            chequeNo: chequeNo || undefined,
            chequeBank: bank || undefined,
            dueDateStr: dueDateStr || undefined,
            description: notes ? `Çek Ödemesi: ${notes}` : undefined,
          },
        });
      } catch {}
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Çek güncellenirken hata:", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureChequeTable();
    const { id } = await params;

    const existingRows = (await prisma.$queryRawUnsafe(
      `SELECT * FROM ChequeRecord WHERE id = ? LIMIT 1`,
      id
    )) as ChequeRecordRow[];

    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json({ error: "Silinecek çek bulunamadı." }, { status: 404 });
    }

    const current = existingRows[0];

    // ChequeRecord tablosundan sil
    await prisma.$executeRawUnsafe(`DELETE FROM ChequeRecord WHERE id = ?`, id);

    // ChequePhotoStore'dan sil
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM ChequePhotoStore WHERE id = ?`, id);
      if (current.expenseId) {
        await prisma.$executeRawUnsafe(`DELETE FROM ChequePhotoStore WHERE id = ?`, current.expenseId);
      }
    } catch {}

    // Eğer bağlı bir SchoolExpense varsa ve id 'chk-exp-' ile başlıyorsa (yani giderden otomatik oluşturulduysa veya bağlandıysa)
    if (current.expenseId) {
      try {
        await prisma.schoolExpense.delete({
          where: { id: current.expenseId },
        });
      } catch {}
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Çek silinirken hata:", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
