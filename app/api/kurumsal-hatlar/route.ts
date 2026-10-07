import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ensureCorporatePhoneLinesTable,
  CorporatePhoneLineRow,
} from "@/lib/corporate-lines";
import crypto from "crypto";

export async function GET() {
  try {
    await ensureCorporatePhoneLinesTable();

    // 1. Hatları getir
    const lines = (await prisma.$queryRawUnsafe(
      `SELECT * FROM CorporatePhoneLine ORDER BY 
        CASE 
          WHEN endDate IS NULL OR endDate = '' THEN 1 
          ELSE 0 
        END, 
        endDate ASC, 
        userName ASC`
    )) as CorporatePhoneLineRow[];

    // 2. Okul Giderleri tablosundaki Vodafone / Telefon faturalarını getir
    const phoneExpenses = await prisma.schoolExpense.findMany({
      where: {
        OR: [
          { title: { contains: "Vodafone" } },
          { title: { contains: "vodafone" } },
          { title: { contains: "Hat" } },
          { title: { contains: "Telefon" } },
          { subCategory: "F-Haberleşme" },
        ],
      },
      orderBy: { dueDate: "desc" },
    });

    // İstatistikler
    let totalMonthlyFee = 0;
    let activeCount = 0;
    let urgentCommitmentsCount = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const in30DaysStr = in30Days.toISOString().slice(0, 10);
    const todayStr = today.toISOString().slice(0, 10);

    lines.forEach((l) => {
      const fee = Number(l.monthlyFee) || 0;
      if (l.status === "ACTIVE") {
        totalMonthlyFee += fee;
        activeCount++;
      }

      if (l.endDate) {
        if (l.endDate <= in30DaysStr) {
          urgentCommitmentsCount++;
        }
      }
    });

    return NextResponse.json({
      lines,
      expenses: phoneExpenses,
      stats: {
        totalLines: lines.length,
        activeCount,
        totalMonthlyFee,
        urgentCommitmentsCount,
      },
    });
  } catch (error) {
    console.error("Kurumsal hatlar alınırken hata:", error);
    return NextResponse.json(
      { error: "Kurumsal hat verileri alınamadı." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureCorporatePhoneLinesTable();
    const body = await request.json();

    // Eğer işlem Okul Giderine Fatura Yansıtma / Ekleme ise:
    if (body.action === "SYNC_EXPENSE") {
      const {
        period = "10. Ay (2026)",
        dueDate = new Date().toISOString().slice(0, 10),
        amountDue = 0,
        title = "Vodafone Kurumsal Hatlar (Tek Fatura - 6 Hat)",
        notes = "",
      } = body;

      const numAmount = Number(amountDue) || 0;
      if (numAmount <= 0) {
        return NextResponse.json(
          { error: "Geçerli bir fatura tutarı giriniz." },
          { status: 400 }
        );
      }

      const dueDateObj = new Date(`${dueDate}T12:00:00Z`);
      const monthIdx = parseInt(dueDate.split("-")[1], 10) || 10;

      // Aynı döneme ait fatura var mı kontrol et
      const existing = await prisma.schoolExpense.findFirst({
        where: {
          period,
          OR: [
            { title: { contains: "Vodafone" } },
            { title: { contains: "vodafone" } },
          ],
        },
      });

      let updatedExpense;
      if (existing) {
        updatedExpense = await prisma.schoolExpense.update({
          where: { id: existing.id },
          data: {
            title,
            amountDue: numAmount,
            amountRemaining: existing.status === "PAID" ? 0 : numAmount,
            dueDate: dueDateObj,
            dueDateStr: `${dueDateObj.getDate()} ${dueDateObj.toLocaleDateString("tr-TR", { month: "long" })} ${dueDateObj.getFullYear()}`,
            description: notes || existing.description,
          },
        });
      } else {
        updatedExpense = await prisma.schoolExpense.create({
          data: {
            title,
            category: "INVOICE",
            subCategory: "F-Haberleşme",
            period,
            dueDate: dueDateObj,
            dueDateStr: `${dueDateObj.getDate()} ${dueDateObj.toLocaleDateString("tr-TR", { month: "long" })} ${dueDateObj.getFullYear()}`,
            amountDue: numAmount,
            amountPaid: 0,
            amountRemaining: numAmount,
            status: "PENDING",
            periodStatus: "Cari Dönem",
            paymentMethod: "CASH",
            isCommitment: true,
            monthIndex: monthIdx,
            description: notes || "Vodafone Kurumsal Hatlar Tek Fatura",
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Fatura Okul Giderlerine başarıyla yansıtıldı.",
        expense: updatedExpense,
      });
    }

    // Yeni Hat Ekleme
    const {
      phoneNumber,
      userName,
      operator = "Vodafone",
      packageName = "",
      monthlyFee = 0,
      startDate = null,
      endDate = null,
      commitmentMonths = 12,
      status = "ACTIVE",
      simCardNo = "",
      notes = "",
    } = body;

    if (!phoneNumber || !userName) {
      return NextResponse.json(
        { error: "Telefon numarası ve kullanan kişi/departman adı zorunludur." },
        { status: 400 }
      );
    }

    const id = `line-${crypto.randomUUID()}`;
    const nowISO = new Date().toISOString();

    await prisma.$executeRawUnsafe(
      `INSERT INTO CorporatePhoneLine (
        id, phoneNumber, userName, operator, packageName, monthlyFee,
        startDate, endDate, commitmentMonths, status, simCardNo, notes,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      phoneNumber.trim(),
      userName.trim(),
      operator.trim(),
      packageName ? packageName.trim() : null,
      Number(monthlyFee) || 0,
      startDate || null,
      endDate || null,
      Number(commitmentMonths) || 12,
      status,
      simCardNo ? simCardNo.trim() : null,
      notes ? notes.trim() : null,
      nowISO,
      nowISO
    );

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Yeni hat eklenirken hata:", error);
    return NextResponse.json(
      { error: "Hat kaydedilirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
