import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { INITIAL_EXPENSES_DATA } from "@/lib/seed-expenses";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";
    const installmentOnly = searchParams.get("installmentOnly") === "true";

    // Veritabanında kayıt yoksa kullanıcının paylaştığı gerçek verileri otomatik aktar (seed)
    const count = await prisma.schoolExpense.count();
    if (count === 0) {
      for (const item of INITIAL_EXPENSES_DATA) {
        await prisma.schoolExpense.create({
          data: {
            title: item.title,
            category: item.category,
            subCategory: item.subCategory,
            period: item.period,
            installmentInfo: item.installmentInfo,
            periodStatus: item.periodStatus,
            dueDateStr: item.dueDateStr,
            amountDue: item.amountDue,
            amountPaid: item.amountPaid,
            amountRemaining: item.amountRemaining,
            status: item.status,
            paymentHistory: item.paymentHistory ? JSON.stringify(item.paymentHistory) : null,
          },
        });
      }
    }

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { subCategory: { contains: search, mode: "insensitive" } },
        { period: { contains: search, mode: "insensitive" } },
        { installmentInfo: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (installmentOnly) {
      where.installmentInfo = { not: null };
    }

    const expenses = await prisma.schoolExpense.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    // İstatistikler (Tüm kayıtlar üzerinden)
    const allExpenses = await prisma.schoolExpense.findMany();
    const stats = {
      totalDue: allExpenses.reduce((s, e) => s + e.amountDue, 0),
      totalPaid: allExpenses.reduce((s, e) => s + e.amountPaid, 0),
      totalRemaining: allExpenses.reduce((s, e) => s + e.amountRemaining, 0),
      countTotal: allExpenses.length,
      countPending: allExpenses.filter((e) => e.status === "PENDING").length,
      countPartial: allExpenses.filter((e) => e.status === "PARTIAL").length,
      countPaid: allExpenses.filter((e) => e.status === "PAID").length,
    };

    return NextResponse.json({ expenses, stats });
  } catch (error: any) {
    console.error("Giderler listesi hatası:", error);
    return NextResponse.json({ error: "Gider kayıtları alınamadı" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      category = "OTHER",
      subCategory = "",
      period = "",
      dueDateStr = "",
      dueDate = null,
      amountDue = 0,
      periodStatus = "Cari Dönem",
      description = "",
      // Taksit seçeneği
      isInstallment = false,
      installmentCount = 1,
      currentInstallment = 1,
    } = body;

    if (!title || Number(amountDue) <= 0) {
      return NextResponse.json({ error: "Lütfen başlık ve geçerli bir tutar girin" }, { status: 400 });
    }

    const numAmount = Number(amountDue);

    // Eğer çoklu taksit oluşturulması istenmişse (örn: 6 taksit)
    if (isInstallment && installmentCount > 1) {
      const createdItems = [];
      const installmentAmount = Number((numAmount / installmentCount).toFixed(2));

      for (let i = 1; i <= installmentCount; i++) {
        const item = await prisma.schoolExpense.create({
          data: {
            title,
            category,
            subCategory,
            period: `${i}t/${installmentCount}t`,
            installmentInfo: `${i}t/${installmentCount}t`,
            dueDateStr: dueDateStr ? `${dueDateStr} (${i}. Taksit)` : undefined,
            dueDate: dueDate ? new Date(dueDate) : null,
            amountDue: installmentAmount,
            amountPaid: 0,
            amountRemaining: installmentAmount,
            status: "PENDING",
            periodStatus,
            description: `${description} (${i}/${installmentCount} Taksit)`.trim(),
          },
        });
        createdItems.push(item);
      }
      return NextResponse.json({ success: true, count: createdItems.length, items: createdItems }, { status: 201 });
    }

    // Tekli kayıt
    const installmentInfo = isInstallment && installmentCount ? `${currentInstallment}t/${installmentCount}t` : null;

    const newExpense = await prisma.schoolExpense.create({
      data: {
        title,
        category,
        subCategory,
        period: installmentInfo || period,
        installmentInfo,
        dueDateStr,
        dueDate: dueDate ? new Date(dueDate) : null,
        amountDue: numAmount,
        amountPaid: 0,
        amountRemaining: numAmount,
        status: "PENDING",
        periodStatus,
        description,
      },
    });

    return NextResponse.json(newExpense, { status: 201 });
  } catch (error: any) {
    console.error("Gider ekleme hatası:", error);
    return NextResponse.json({ error: error?.message || "Gider kaydedilemedi" }, { status: 500 });
  }
}
