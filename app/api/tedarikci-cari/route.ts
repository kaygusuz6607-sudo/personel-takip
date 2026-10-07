import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ensureSupplierCariTables,
  syncSupplierToSchoolExpenses,
  SupplierAccountRow,
  SupplierTransactionRow,
} from "@/lib/supplier-cari-sync";

export async function GET() {
  try {
    await ensureSupplierCariTables();

    const accounts = (await prisma.$queryRawUnsafe(
      `SELECT * FROM SupplierCariAccount ORDER BY createdAt ASC`
    )) as SupplierAccountRow[];

    const transactions = (await prisma.$queryRawUnsafe(
      `SELECT * FROM SupplierCariTransaction ORDER BY date DESC, createdAt DESC`
    )) as SupplierTransactionRow[];

    const enrichedAccounts = accounts.map((acc) => {
      const accTxs = transactions.filter((t) => t.supplierId === acc.id);
      const purchases = accTxs.filter((t) => t.txType === "PURCHASE");
      const payments = accTxs.filter((t) => t.txType === "PAYMENT");

      const totalPurchased = purchases.reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const totalPaid = payments.reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const remainingDebt = Math.max(0, Number((totalPurchased - totalPaid).toFixed(2)));

      const cardPurchased = purchases
        .filter((t) => t.paymentMethod === "CREDIT_CARD")
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const cashPurchased = Math.max(0, totalPurchased - cardPurchased);

      const cardPaid = payments
        .filter((t) => t.paymentMethod === "CREDIT_CARD")
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const cashPaid = Math.max(0, totalPaid - cardPaid);

      return {
        ...acc,
        defaultUnitPrice: Number(acc.defaultUnitPrice) || 0,
        paymentDay: Number(acc.paymentDay) || 15,
        totalPurchased: Number(totalPurchased.toFixed(2)),
        totalPaid: Number(totalPaid.toFixed(2)),
        remainingDebt,
        cashPurchased: Number(cashPurchased.toFixed(2)),
        cardPurchased: Number(cardPurchased.toFixed(2)),
        cashPaid: Number(cashPaid.toFixed(2)),
        cardPaid: Number(cardPaid.toFixed(2)),
        purchaseCount: purchases.length,
        paymentCount: payments.length,
        transactions: accTxs.map((t) => ({
          ...t,
          quantity: Number(t.quantity) || 1,
          unitPrice: Number(t.unitPrice) || 0,
          amount: Number(t.amount) || 0,
        })),
      };
    });

    const stats = {
      supplierCount: enrichedAccounts.length,
      activeDebtSupplierCount: enrichedAccounts.filter((a) => a.remainingDebt > 0).length,
      totalPurchased: enrichedAccounts.reduce((s, a) => s + a.totalPurchased, 0),
      totalPaid: enrichedAccounts.reduce((s, a) => s + a.totalPaid, 0),
      totalRemaining: enrichedAccounts.reduce((s, a) => s + a.remainingDebt, 0),
      totalCashPaid: enrichedAccounts.reduce((s, a) => s + a.cashPaid, 0),
      totalCardPaid: enrichedAccounts.reduce((s, a) => s + a.cardPaid, 0),
      totalCashPurchased: enrichedAccounts.reduce((s, a) => s + a.cashPurchased, 0),
      totalCardPurchased: enrichedAccounts.reduce((s, a) => s + a.cardPurchased, 0),
    };

    return NextResponse.json({
      suppliers: enrichedAccounts,
      stats,
    });
  } catch (error: any) {
    console.error("GET /api/tedarikci-cari error:", error);
    return NextResponse.json(
      { error: "Tedarikçi carileri yüklenemedi: " + (error?.message || "") },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureSupplierCariTables();
    const body = await request.json();
    const action = body.action || "ADD_TRANSACTION";
    const now = new Date().toISOString();

    if (action === "CREATE_SUPPLIER") {
      const id = `sup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const name = String(body.name || "").trim();
      const productSummary = String(body.productSummary || "Ürün / Hizmet Alımı").trim();
      if (!name) {
        return NextResponse.json({ error: "Cari / Firma adı zorunludur." }, { status: 400 });
      }
      const paymentDay = Math.min(31, Math.max(1, Number(body.paymentDay) || 15));
      const today = new Date();
      const defNextDate =
        body.nextPaymentDate ||
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(paymentDay).padStart(2, "0")}`;

      await prisma.$executeRawUnsafe(
        `INSERT INTO SupplierCariAccount (id, name, productSummary, category, unitLabel, defaultUnitPrice, paymentDay, nextPaymentDate, paymentMethod, cardHolder, cardBank, phone, iban, notes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        name,
        productSummary,
        body.category || "Tedarikçi",
        body.unitLabel || "Adet",
        Number(body.defaultUnitPrice) || 0,
        paymentDay,
        defNextDate,
        body.paymentMethod || "CASH",
        body.cardHolder || null,
        body.cardBank || null,
        body.phone || "",
        body.iban || "",
        body.notes || "",
        now,
        now
      );

      return NextResponse.json({ ok: true, id });
    }

    if (action === "UPDATE_SUPPLIER") {
      const id = String(body.id || "");
      const name = String(body.name || "").trim();
      const productSummary = String(body.productSummary || "Ürün / Hizmet Alımı").trim();
      if (!id || !name) {
        return NextResponse.json({ error: "Geçersiz cari bilgisi." }, { status: 400 });
      }
      const paymentDay = Math.min(31, Math.max(1, Number(body.paymentDay) || 15));

      await prisma.$executeRawUnsafe(
        `UPDATE SupplierCariAccount
         SET name = ?, productSummary = ?, category = ?, unitLabel = ?, defaultUnitPrice = ?, paymentDay = ?, nextPaymentDate = ?, paymentMethod = ?, cardHolder = ?, cardBank = ?, phone = ?, iban = ?, notes = ?, updatedAt = ?
         WHERE id = ?`,
        name,
        productSummary,
        body.category || "Tedarikçi",
        body.unitLabel || "Adet",
        Number(body.defaultUnitPrice) || 0,
        paymentDay,
        body.nextPaymentDate || null,
        body.paymentMethod || "CASH",
        body.cardHolder || null,
        body.cardBank || null,
        body.phone || "",
        body.iban || "",
        body.notes || "",
        now,
        id
      );

      // Eğer yeni bir ödeme tarihi seçildiyse ve kullanıcının mevcut bekleyen alımlarının ödeme tarihini de güncellemesi istendiyse
      if (body.syncDueDateToPurchases && body.nextPaymentDate) {
        const m = String(body.nextPaymentDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) {
          const ymPrefix = `${m[1]}-${m[2]}`;
          await prisma.$executeRawUnsafe(
            `UPDATE SupplierCariTransaction SET dueDate = ? WHERE supplierId = ? AND txType = 'PURCHASE' AND (dueDate LIKE ? OR date LIKE ?)`,
            body.nextPaymentDate,
            id,
            `${ymPrefix}%`,
            `${ymPrefix}%`
          );
        }
      }

      await syncSupplierToSchoolExpenses(id);
      return NextResponse.json({ ok: true, id });
    }

    if (action === "ADD_TRANSACTION") {
      const supplierId = String(body.supplierId || "");
      const txType = body.txType === "PAYMENT" ? "PAYMENT" : "PURCHASE";
      const amount = Number(body.amount) || 0;
      if (!supplierId || amount <= 0) {
        return NextResponse.json(
          { error: "Lütfen cari seçin ve 0'dan büyük bir tutar girin." },
          { status: 400 }
        );
      }

      const date = body.date || new Date().toISOString().split("T")[0];
      const dueDate = body.dueDate || date;
      const itemTitle =
        String(body.itemTitle || "").trim() ||
        (txType === "PAYMENT" ? "Cari Ödeme" : "Ürün / Hizmet Alımı");
      const quantity = Math.max(0.01, Number(body.quantity) || 1);
      const unitPrice = Number(body.unitPrice) || Number((amount / quantity).toFixed(2));
      const paymentMethod = body.paymentMethod || "CASH";
      const repeatMonths =
        txType === "PURCHASE" && Number(body.repeatMonths) > 1
          ? Math.min(24, Number(body.repeatMonths))
          : 1;

      const baseDueMatch = String(dueDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
      const baseYear = baseDueMatch ? parseInt(baseDueMatch[1], 10) : new Date().getFullYear();
      const baseMonth = baseDueMatch ? parseInt(baseDueMatch[2], 10) : new Date().getMonth() + 1;
      const baseDay = baseDueMatch ? parseInt(baseDueMatch[3], 10) : 15;

      for (let step = 0; step < repeatMonths; step++) {
        const txId = `stx-${Date.now()}-${step}-${Math.random().toString(36).slice(2, 6)}`;
        const targetDateObj = new Date(baseYear, baseMonth - 1 + step, 1);
        const yr = targetDateObj.getFullYear();
        const mo = targetDateObj.getMonth() + 1;
        const maxD = new Date(yr, mo, 0).getDate();
        const safeDay = Math.min(baseDay, maxD);
        const stepDueISO =
          step === 0
            ? dueDate
            : `${yr}-${String(mo).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
        const stepDateISO = step === 0 ? date : stepDueISO;
        const stepTitle =
          repeatMonths > 1 ? `${itemTitle} (${mo}. Ay ${yr})` : itemTitle;

        const rawNotes = String(body.notes || "").trim();
        const cardTag = body.cardId && !rawNotes.includes(`[${body.cardId}]`) ? ` [${body.cardId}]` : "";
        const finalNotes = `${rawNotes}${cardTag}`.trim();

        await prisma.$executeRawUnsafe(
          `INSERT INTO SupplierCariTransaction (id, supplierId, txType, date, dueDate, itemTitle, quantity, unitPrice, amount, paymentMethod, cardHolder, cardBank, notes, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          txId,
          supplierId,
          txType,
          stepDateISO,
          stepDueISO,
          stepTitle,
          quantity,
          unitPrice,
          amount,
          paymentMethod,
          body.cardHolder || null,
          body.cardBank || null,
          finalNotes,
          now
        );

        // Kredi kartı ile cari ödemesi yapıldıysa ve tanımlı kart seçildiyse:
        // Kartın kullanılabilir limitinden düşmesi, ekstresine yansıması ve okul giderlerinde gözükmesi için SchoolExpense oluştur
        if (txType === "PAYMENT" && paymentMethod === "CREDIT_CARD" && (body.cardId || body.cardHolder)) {
          try {
            const supRows = (await prisma.$queryRawUnsafe(
              `SELECT name FROM SupplierCariAccount WHERE id = ?`,
              supplierId
            )) as any[];
            const supName = supRows[0]?.name || "Tedarikçi";
            const cHolder = body.cardHolder || "Kredi Kartı";
            const cBank = body.cardBank || "Banka";
            const cIdTag = body.cardId ? `[${body.cardId}]` : "";
            const ccSyncTag = `[SUPPLIER_PAY_CC:${txId}]`;

            await prisma.schoolExpense.create({
              data: {
                id: `exp-sup-pay-${txId}`,
                title: `${cHolder} / ${cBank} KK / ${supName} Cari Ödemesi`,
                category: "CREDIT_CARD",
                subCategory: "Kredi Kartı (Cari Ödeme)",
                dueDate: new Date(stepDueISO),
                dueDateStr: stepDueISO,
                amountDue: amount,
                amountPaid: 0,
                amountRemaining: amount,
                status: "PENDING",
                paymentMethod: "CREDIT_CARD",
                cardHolder: cHolder,
                cardBank: cBank,
                description: `Tedarikçi cari ödemesi: ${supName} ${cIdTag} ${ccSyncTag}`.trim(),
              },
            });
          } catch (ccExpErr) {
            console.error("Kredi kartı cari ödemesi okul giderlerine eklenirken hata:", ccExpErr);
          }
        }
      }

      if (txType === "PURCHASE" && dueDate) {
        const dMatch = String(dueDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
        const dayNum = dMatch ? parseInt(dMatch[3], 10) : 15;
        await prisma.$executeRawUnsafe(
          `UPDATE SupplierCariAccount SET nextPaymentDate = ?, paymentDay = ?, updatedAt = ? WHERE id = ?`,
          dueDate,
          dayNum,
          now,
          supplierId
        );
      }

      await syncSupplierToSchoolExpenses(supplierId);
      return NextResponse.json({ ok: true });
    }

    if (action === "UPDATE_TRANSACTION") {
      const txId = String(body.id || "");
      const supplierId = String(body.supplierId || "");
      const amount = Number(body.amount) || 0;
      if (!txId || !supplierId || amount <= 0) {
        return NextResponse.json({ error: "Geçersiz işlem bilgisi." }, { status: 400 });
      }
      const quantity = Math.max(0.01, Number(body.quantity) || 1);
      const unitPrice = Number(body.unitPrice) || Number((amount / quantity).toFixed(2));

      const rawNotes = String(body.notes || "").trim();
      const cardTag = body.cardId && !rawNotes.includes(`[${body.cardId}]`) ? ` [${body.cardId}]` : "";
      const finalNotes = `${rawNotes}${cardTag}`.trim();

      await prisma.$executeRawUnsafe(
        `UPDATE SupplierCariTransaction
         SET date = ?, dueDate = ?, itemTitle = ?, quantity = ?, unitPrice = ?, amount = ?, paymentMethod = ?, cardHolder = ?, cardBank = ?, notes = ?
         WHERE id = ?`,
        body.date,
        body.dueDate || body.date,
        body.itemTitle || "İşlem",
        quantity,
        unitPrice,
        amount,
        body.paymentMethod || "CASH",
        body.cardHolder || null,
        body.cardBank || null,
        finalNotes,
        txId
      );

      // Kart ödemesi varsa SchoolExpense güncelle veya sil
      const ccSyncTag = `[SUPPLIER_PAY_CC:${txId}]`;
      await prisma.schoolExpense.deleteMany({
        where: { description: { contains: ccSyncTag } },
      });

      if (body.txType === "PAYMENT" && body.paymentMethod === "CREDIT_CARD" && (body.cardId || body.cardHolder)) {
        try {
          const supRows = (await prisma.$queryRawUnsafe(
            `SELECT name FROM SupplierCariAccount WHERE id = ?`,
            supplierId
          )) as any[];
          const supName = supRows[0]?.name || "Tedarikçi";
          const cHolder = body.cardHolder || "Kredi Kartı";
          const cBank = body.cardBank || "Banka";
          const cIdTag = body.cardId ? `[${body.cardId}]` : "";
          const dueISO = body.dueDate || body.date || new Date().toISOString().split("T")[0];

          await prisma.schoolExpense.create({
            data: {
              id: `exp-sup-pay-${txId}`,
              title: `${cHolder} / ${cBank} KK / ${supName} Cari Ödemesi`,
              category: "CREDIT_CARD",
              subCategory: "Kredi Kartı (Cari Ödeme)",
              dueDate: new Date(dueISO),
              dueDateStr: dueISO,
              amountDue: amount,
              amountPaid: 0,
              amountRemaining: amount,
              status: "PENDING",
              paymentMethod: "CREDIT_CARD",
              cardHolder: cHolder,
              cardBank: cBank,
              description: `Tedarikçi cari ödemesi: ${supName} ${cIdTag} ${ccSyncTag}`.trim(),
            },
          });
        } catch (ccExpErr) {
          console.error("Kredi kartı cari ödemesi güncellenirken hata:", ccExpErr);
        }
      }

      await syncSupplierToSchoolExpenses(supplierId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Geçersiz işlem türü" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/tedarikci-cari error:", error);
    return NextResponse.json(
      { error: "İşlem kaydedilemedi: " + (error?.message || "") },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureSupplierCariTables();
    const { searchParams } = new URL(request.url);
    const txId = searchParams.get("txId");
    const supplierId = searchParams.get("supplierId");

    if (txId && supplierId) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM SupplierCariTransaction WHERE id = ?`,
        txId
      );
      await prisma.schoolExpense.deleteMany({
        where: { description: { contains: `[SUPPLIER_PAY_CC:${txId}]` } },
      });
      await syncSupplierToSchoolExpenses(supplierId);
      return NextResponse.json({ ok: true });
    }

    if (supplierId && !txId) {
      // Önce bu tedarikçiye ait tüm ödeme kart kayıtlarını temizle
      const txRows = (await prisma.$queryRawUnsafe(
        `SELECT id FROM SupplierCariTransaction WHERE supplierId = ?`,
        supplierId
      )) as any[];
      for (const t of txRows) {
        if (t.id) {
          await prisma.schoolExpense.deleteMany({
            where: { description: { contains: `[SUPPLIER_PAY_CC:${t.id}]` } },
          });
        }
      }

      await prisma.$executeRawUnsafe(
        `DELETE FROM SupplierCariTransaction WHERE supplierId = ?`,
        supplierId
      );
      await prisma.$executeRawUnsafe(
        `DELETE FROM SupplierCariAccount WHERE id = ?`,
        supplierId
      );
      await syncSupplierToSchoolExpenses(supplierId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
  } catch (error: any) {
    console.error("DELETE /api/tedarikci-cari error:", error);
    return NextResponse.json({ error: "Silinemedi" }, { status: 500 });
  }
}
