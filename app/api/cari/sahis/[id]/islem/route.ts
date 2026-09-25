import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Bir hesabın tüm işlemlerini kronolojik sırada yeniden hesaplayıp bakiyeyi günceller
async function recalculateAccountBalance(accountId: string) {
  const transactions = await prisma.thirdPartyTransaction.findMany({
    where: { accountId },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  let runningBalance = 0;
  for (const tx of transactions) {
    if (tx.direction === "INFLOW") {
      runningBalance += tx.amount;
    } else {
      runningBalance -= tx.amount;
    }

    if (tx.balanceAfter !== runningBalance) {
      await prisma.thirdPartyTransaction.update({
        where: { id: tx.id },
        data: { balanceAfter: runningBalance },
      });
    }
  }

  await prisma.thirdPartyAccount.update({
    where: { id: accountId },
    data: { balance: runningBalance },
  });

  return runningBalance;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params;
    const body = await request.json();
    const {
      date,
      type, // BORROW, PAYMENT_SENT, EXPENSE_ON_BEHALF, LEND, COLLECTION, OFFSET
      amount,
      direction, // INFLOW (+), OUTFLOW (-)
      paymentMethod = "BANK",
      category,
      description,
    } = body;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: "Geçerli bir işlem tutarı giriniz" }, { status: 400 });
    }

    // Yön tespiti (Otomatik mantık):
    // BORROW (Borç Alındı) -> Şirketin borcu artar -> OUTFLOW (-)
    // EXPENSE_ON_BEHALF (Bizim Adımıza SGK/Fatura Ödedi) -> Şirketin şahsa borcu artar -> OUTFLOW (-)
    // PAYMENT_SENT (Şahsa Ödeme Gönderildi) -> Şirketin borcu azalır -> INFLOW (+)
    // LEND (Şahsa Borç Verildi) -> Şirketin alacağı artar -> INFLOW (+)
    // COLLECTION (Şahıstan Tahsilat Yapıldı) -> Şirketin alacağı azalır -> OUTFLOW (-)
    // OFFSET / OTHER -> Kullanıcının belirttiği direction kullanılır
    let finalDirection = direction;
    if (!finalDirection) {
      if (type === "BORROW" || type === "EXPENSE_ON_BEHALF") {
        finalDirection = "OUTFLOW";
      } else if (type === "PAYMENT_SENT" || type === "LEND") {
        finalDirection = "INFLOW";
      } else if (type === "COLLECTION") {
        finalDirection = "OUTFLOW";
      } else {
        finalDirection = "INFLOW";
      }
    }

    const txDate = date ? new Date(date) : new Date();

    const createdTx = await prisma.thirdPartyTransaction.create({
      data: {
        accountId,
        date: txDate,
        type: type || "BORROW",
        amount: numAmount,
        direction: finalDirection,
        balanceAfter: 0,
        paymentMethod,
        category: category ? category.trim() : null,
        description: description ? description.trim() : null,
      },
    });

    // Bakiyeyi baştan sona kronolojik olarak hesapla ve güncelle
    const updatedBalance = await recalculateAccountBalance(accountId);

    return NextResponse.json({
      transaction: createdTx,
      balance: updatedBalance,
    });
  } catch (error: any) {
    console.error("Cari işlem ekleme hatası:", error);
    return NextResponse.json({ error: "İşlem kaydedilemedi: " + error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params;
    const { searchParams } = new URL(request.url);
    const txId = searchParams.get("txId");

    if (!txId) {
      return NextResponse.json({ error: "İşlem ID zorunludur" }, { status: 400 });
    }

    await prisma.thirdPartyTransaction.delete({
      where: { id: txId },
    });

    const updatedBalance = await recalculateAccountBalance(accountId);

    return NextResponse.json({ success: true, balance: updatedBalance });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
