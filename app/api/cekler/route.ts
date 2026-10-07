import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ensureChequeTable,
  syncChequesFromSchoolExpenses,
  ChequeRecordRow,
} from "@/lib/cheque-sync";
import crypto from "crypto";

export async function GET() {
  try {
    await syncChequesFromSchoolExpenses();

    const cheques = (await prisma.$queryRawUnsafe(
      `SELECT * FROM ChequeRecord ORDER BY 
        CASE 
          WHEN dueDate IS NULL OR dueDate = '' THEN 1 
          ELSE 0 
        END, 
        dueDate ASC, 
        createdAt DESC`
    )) as ChequeRecordRow[];

    // İstatistikler & Özetler
    let totalGiven = 0;
    let totalGivenPaid = 0;
    let totalGivenPending = 0;
    let countGiven = 0;

    let totalReceived = 0;
    let totalReceivedCollected = 0;
    let totalReceivedPending = 0;
    let countReceived = 0;

    const todayStr = new Date().toISOString().slice(0, 10);
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    const in7DaysStr = in7Days.toISOString().slice(0, 10);

    let urgentCount = 0;

    cheques.forEach((c) => {
      const amt = Number(c.amount) || 0;
      const isPaid = c.status === "COLLECTED";

      if (c.type === "GIVEN") {
        totalGiven += amt;
        countGiven++;
        if (isPaid) {
          totalGivenPaid += amt;
        } else {
          totalGivenPending += amt;
        }
      } else {
        totalReceived += amt;
        countReceived++;
        if (isPaid) {
          totalReceivedCollected += amt;
        } else {
          totalReceivedPending += amt;
        }
      }

      if (!isPaid && c.dueDate && c.dueDate <= in7DaysStr) {
        urgentCount++;
      }
    });

    return NextResponse.json({
      cheques,
      stats: {
        totalCount: cheques.length,
        totalGiven,
        totalGivenPaid,
        totalGivenPending,
        countGiven,
        totalReceived,
        totalReceivedCollected,
        totalReceivedPending,
        countReceived,
        netBalance: totalReceived - totalGiven,
        urgentCount,
      },
    });
  } catch (error) {
    console.error("Çekler listelenirken hata:", error);
    return NextResponse.json(
      { error: "Çek verileri alınırken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureChequeTable();
    const body = await request.json();

    const {
      type = "GIVEN", // "GIVEN" veya "RECEIVED"
      chequeNo = "",
      bank = "",
      branch = "",
      accountNo = "",
      issuer = "",
      recipient = "",
      amount = 0,
      issueDate = null,
      dueDate = null,
      dueDateStr = "",
      status = "PORTFOLIO",
      notes = "",
      photoUrl = null,
      syncWithExpense = true, // Verilen çek ise Okul Giderlerine de eklensin mi?
    } = body;

    const numAmount = Number(amount) || 0;
    if (numAmount <= 0) {
      return NextResponse.json(
        { error: "Geçerli bir çek tutarı giriniz." },
        { status: 400 }
      );
    }

    const chequeId = `chk-${crypto.randomUUID()}`;
    const nowISO = new Date().toISOString();

    let formattedDueDateStr = dueDateStr;
    if (!formattedDueDateStr && dueDate) {
      const parts = String(dueDate).split("-");
      if (parts.length === 3) {
        const months = [
          "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
          "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
        ];
        formattedDueDateStr = `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
      }
    }

    let createdExpenseId: string | null = null;

    // Eğer VERİLEN ÇEK ise ve Okul Giderlerine yansıtılması isteniyorsa SchoolExpense kaydı oluştur
    if (type === "GIVEN" && syncWithExpense) {
      try {
        const dueDateObj = dueDate ? new Date(`${dueDate}T12:00:00Z`) : new Date();
        const expenseMonthIndex = dueDate ? parseInt(String(dueDate).split("-")[1], 10) : 10;

        const newExpense = await prisma.schoolExpense.create({
          data: {
            title: recipient || issuer || "Verilen Çek",
            category: "CHEQUE",
            period: `${expenseMonthIndex}. Ay`,
            dueDate: dueDateObj,
            dueDateStr: formattedDueDateStr || `${dueDateObj.getDate()} ${dueDateObj.toLocaleDateString("tr-TR", { month: "long" })} ${dueDateObj.getFullYear()}`,
            amountDue: numAmount,
            amountPaid: status === "COLLECTED" ? numAmount : 0,
            amountRemaining: status === "COLLECTED" ? 0 : numAmount,
            status: status === "COLLECTED" ? "PAID" : "PENDING",
            periodStatus: status === "COLLECTED" ? "Ödendi" : "Cari Dönem",
            paymentMethod: "CASH",
            chequeNo: chequeNo || null,
            chequeBank: bank || null,
            monthIndex: expenseMonthIndex,
            description: notes ? `Çek Ödemesi: ${notes}` : `Çek Ödemesi (No: ${chequeNo || "-"})`,
          },
        });
        createdExpenseId = newExpense.id;

        // Fotoğraf varsa ChequePhotoStore'a da kaydet
        if (photoUrl) {
          await prisma.$executeRawUnsafe(
            `INSERT INTO ChequePhotoStore (id, photoUrl, title, updatedAt)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               photoUrl = excluded.photoUrl,
               title = excluded.title,
               updatedAt = excluded.updatedAt`,
            newExpense.id,
            photoUrl,
            recipient || "Çek Görseli",
            nowISO
          );
        }
      } catch (expErr) {
        console.error("Okul gideri oluşturulurken hata:", expErr);
      }
    }

    // ChequeRecord tablosuna kaydet
    await prisma.$executeRawUnsafe(
      `INSERT INTO ChequeRecord (
        id, type, chequeNo, bank, branch, accountNo, issuer, recipient,
        amount, issueDate, dueDate, dueDateStr, status, paymentDate,
        notes, photoUrl, expenseId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      chequeId,
      type,
      chequeNo || null,
      bank || null,
      branch || null,
      accountNo || null,
      issuer || (type === "GIVEN" ? "Özel Kayseri Simya Çocuk Üniversitesi" : "Müşteri / Veli"),
      recipient || (type === "GIVEN" ? "Tedarikçi / Cari" : "Özel Kayseri Simya Çocuk Üniversitesi"),
      numAmount,
      issueDate || null,
      dueDate || null,
      formattedDueDateStr || null,
      status,
      status === "COLLECTED" ? nowISO : null,
      notes || null,
      photoUrl || null,
      createdExpenseId,
      nowISO,
      nowISO
    );

    // Eğer ayrıca ChequePhotoStore'a yazılması gerekiyorsa
    if (photoUrl) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO ChequePhotoStore (id, photoUrl, title, updatedAt)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           photoUrl = excluded.photoUrl,
           title = excluded.title,
           updatedAt = excluded.updatedAt`,
        chequeId,
        photoUrl,
        (type === "GIVEN" ? recipient : issuer) || "Çek Görseli",
        nowISO
      );
    }

    return NextResponse.json({
      success: true,
      cheque: {
        id: chequeId,
        type,
        chequeNo,
        bank,
        amount: numAmount,
        dueDate,
        status,
        expenseId: createdExpenseId,
      },
    });
  } catch (error) {
    console.error("Yeni çek kaydedilirken hata:", error);
    return NextResponse.json(
      { error: "Çek kaydedilirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
