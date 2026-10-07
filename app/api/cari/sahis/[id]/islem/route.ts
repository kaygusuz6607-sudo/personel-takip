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

    const cardTag = body.cardId && !String(description || "").includes(`[${body.cardId}]`) ? ` [${body.cardId}]` : "";
    const finalDescription = `${String(description || "").trim()}${cardTag}`.trim();

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
        description: finalDescription ? finalDescription : null,
      },
    });

    // Kredi kartı ile ödeme yapıldıysa ve kart seçildiyse: SchoolExpense oluştur
    if (paymentMethod === "CREDIT_CARD" && (body.cardId || body.cardHolder)) {
      try {
        const acc = await prisma.thirdPartyAccount.findUnique({ where: { id: accountId } });
        const personName = acc?.name || "Şahıs Carisi";
        const cHolder = body.cardHolder || "Kredi Kartı";
        const cBank = body.cardBank || "Banka";
        const cIdTag = body.cardId ? `[${body.cardId}]` : "";
        const ccTag = `[THIRD_PARTY_PAY_CC:${createdTx.id}]`;
        const dateISO = txDate.toISOString().split("T")[0];

        await prisma.schoolExpense.create({
          data: {
            id: `exp-tp-pay-${createdTx.id}`,
            title: `${cHolder} / ${cBank} KK / ${personName} Cari Ödemesi`,
            category: "CREDIT_CARD",
            subCategory: "Kredi Kartı (Cari Ödeme)",
            dueDate: txDate,
            dueDateStr: dateISO,
            amountDue: numAmount,
            amountPaid: 0,
            amountRemaining: numAmount,
            status: "PENDING",
            paymentMethod: "CREDIT_CARD",
            cardHolder: cHolder,
            cardBank: cBank,
            description: `Şahıs cari ödemesi: ${personName} ${cIdTag} ${ccTag}`.trim(),
          },
        });
      } catch (ccErr) {
        console.error("Şahıs cari kart ödemesi okul giderlerine eklenirken hata:", ccErr);
      }
    }

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params;
    const body = await request.json();
    const {
      txId,
      date,
      type,
      amount,
      direction,
      paymentMethod = "BANK",
      category,
      description,
    } = body;

    if (!txId) {
      return NextResponse.json({ error: "İşlem ID zorunludur" }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: "Geçerli bir işlem tutarı giriniz" }, { status: 400 });
    }

    let finalDirection = direction;
    if (!finalDirection) {
      if (type === "BORROW" || type === "EXPENSE_ON_BEHALF") {
        finalDirection = "OUTFLOW";
      } else if (type === "PAYMENT_SENT" || type === "LEND" || type === "BARTER") {
        finalDirection = "INFLOW";
      } else if (type === "COLLECTION") {
        finalDirection = "OUTFLOW";
      } else {
        finalDirection = "INFLOW";
      }
    }

    const txDate = date ? new Date(date) : new Date();

    const cardTag = body.cardId && !String(description || "").includes(`[${body.cardId}]`) ? ` [${body.cardId}]` : "";
    const finalDescription = `${String(description || "").trim()}${cardTag}`.trim();

    const updatedTx = await prisma.thirdPartyTransaction.update({
      where: { id: txId },
      data: {
        date: txDate,
        type: type || "BORROW",
        amount: numAmount,
        direction: finalDirection,
        paymentMethod,
        category: category ? category.trim() : null,
        description: finalDescription ? finalDescription : null,
      },
    });

    // SchoolExpense güncelle veya temizle
    const ccTag = `[THIRD_PARTY_PAY_CC:${txId}]`;
    await prisma.schoolExpense.deleteMany({
      where: { description: { contains: ccTag } },
    });

    if (paymentMethod === "CREDIT_CARD" && (body.cardId || body.cardHolder)) {
      try {
        const acc = await prisma.thirdPartyAccount.findUnique({ where: { id: accountId } });
        const personName = acc?.name || "Şahıs Carisi";
        const cHolder = body.cardHolder || "Kredi Kartı";
        const cBank = body.cardBank || "Banka";
        const cIdTag = body.cardId ? `[${body.cardId}]` : "";
        const dateISO = txDate.toISOString().split("T")[0];

        await prisma.schoolExpense.create({
          data: {
            id: `exp-tp-pay-${txId}`,
            title: `${cHolder} / ${cBank} KK / ${personName} Cari Ödemesi`,
            category: "CREDIT_CARD",
            subCategory: "Kredi Kartı (Cari Ödeme)",
            dueDate: txDate,
            dueDateStr: dateISO,
            amountDue: numAmount,
            amountPaid: 0,
            amountRemaining: numAmount,
            status: "PENDING",
            paymentMethod: "CREDIT_CARD",
            cardHolder: cHolder,
            cardBank: cBank,
            description: `Şahıs cari ödemesi: ${personName} ${cIdTag} ${ccTag}`.trim(),
          },
        });
      } catch (ccErr) {
        console.error("Şahıs cari kart ödemesi güncellenirken hata:", ccErr);
      }
    }

    const updatedBalance = await recalculateAccountBalance(accountId);

    return NextResponse.json({
      transaction: updatedTx,
      balance: updatedBalance,
    });
  } catch (error: any) {
    console.error("Cari işlem güncelleme hatası:", error);
    return NextResponse.json({ error: "İşlem güncellenemedi: " + error.message }, { status: 500 });
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

    const ccTag = `[THIRD_PARTY_PAY_CC:${txId}]`;
    await prisma.schoolExpense.deleteMany({
      where: { description: { contains: ccTag } },
    });

    const updatedBalance = await recalculateAccountBalance(accountId);

    return NextResponse.json({ success: true, balance: updatedBalance });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

