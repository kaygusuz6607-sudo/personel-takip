import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const accountId = searchParams.get("accountId");

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { tcNo: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const accounts = await prisma.thirdPartyAccount.findMany({
      where,
      include: {
        _count: {
          select: { transactions: true },
        },
        transactions: {
          orderBy: [{ date: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: { name: "asc" },
    });

    // Toplam borç ve alacak istatistikleri
    let totalCompanyOwed = 0; // Şirketin borçlu olduğu toplam (-)
    let totalCompanyReceivable = 0; // Şirketin alacaklı olduğu toplam (+)
    accounts.forEach((acc) => {
      if (acc.balance < 0) {
        totalCompanyOwed += Math.abs(acc.balance);
      } else {
        totalCompanyReceivable += acc.balance;
      }
    });

    let selectedAccount = null;
    if (accountId) {
      selectedAccount = accounts.find((a) => a.id === accountId) || null;
    } else if (accounts.length > 0) {
      selectedAccount = accounts[0];
    }

    return NextResponse.json({
      accounts,
      selectedAccount,
      stats: {
        totalAccounts: accounts.length,
        totalCompanyOwed, // Şahıslara borcumuz
        totalCompanyReceivable, // Şahıslardan alacağımız
        netBalance: totalCompanyReceivable - totalCompanyOwed,
      },
    });
  } catch (error: any) {
    console.error("Şahıs cari listesi hatası:", error);
    return NextResponse.json({ error: "Cariler alınamadı: " + error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type = "PERSON", phone, tcNo, iban, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Cari / Şahıs adı zorunludur" }, { status: 400 });
    }

    const newAccount = await prisma.thirdPartyAccount.create({
      data: {
        name: name.trim(),
        type,
        phone: phone ? phone.trim() : null,
        tcNo: tcNo ? tcNo.trim() : null,
        iban: iban ? iban.trim() : null,
        notes: notes ? notes.trim() : null,
        balance: 0,
      },
    });

    return NextResponse.json(newAccount);
  } catch (error: any) {
    console.error("Cari oluşturma hatası:", error);
    return NextResponse.json({ error: "Cari oluşturulamadı: " + error.message }, { status: 500 });
  }
}
