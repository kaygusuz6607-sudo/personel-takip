const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("--- CUMHURİYETE YATIRIM YAPANLAR GRUBU DÜZELTME BAŞLATILIYOR ---");

  const group = await prisma.goldDayGroup.findFirst({
    where: {
      title: { contains: "Cumhiriyete" },
    },
    include: {
      rounds: { orderBy: { roundIndex: "asc" } },
    },
  });

  if (!group) {
    console.error("Grup bulunamadı!");
    return;
  }

  console.log(`Grup bulundu: ${group.title} (ID: ${group.id})`);

  const defAmt = 43100;
  const tMembers = group.totalMembers || 4;
  const payingMembers = tMembers - 1; // 3 kişi
  const roundGoldPool = defAmt * payingMembers; // 129.300 TL

  // 1. Grubu Güncelle
  const updatedGroup = await prisma.goldDayGroup.update({
    where: { id: group.id },
    data: {
      goldType: "CUMHURIYET_ALTIN",
      goldTypeLabel: "Cumhuriyet Altını",
      defaultAmount: defAmt,
      totalMembers: tMembers,
      userShareCount: 2,
    },
  });

  console.log(`Grup bilgileri güncellendi: defaultAmount = ${updatedGroup.defaultAmount}, goldType = ${updatedGroup.goldType}`);

  // 2. Turları ve Bağlı SchoolExpense Kayıtlarını Güncelle
  for (const round of group.rounds) {
    const isUserTurn = round.isUserTurn;
    const effectiveShares = isUserTurn ? Math.max(0, 2 - 1) : 2;
    const userAmount = defAmt * effectiveShares; // 43.100 veya 86.200

    const userTurnNote = isUserTurn
      ? ` (Muhammed Ali Sırası - ${effectiveShares} Hisse)`
      : ` (${effectiveShares} Hisse)`;

    const note = isUserTurn
      ? `🎉 Gün Sırası Muhammed Ali'de — Toplam ${payingMembers} Cumhuriyet Altını (₺${roundGoldPool.toLocaleString("tr-TR")}) teslim alınacak (${effectiveShares} hisse ödenecek)`
      : "";

    const updatedRound = await prisma.goldDayRound.update({
      where: { id: round.id },
      data: {
        goldAmount: roundGoldPool,
        payingMembersCount: payingMembers,
        perMemberAmount: defAmt,
        userShareCount: effectiveShares,
        userAmountToPay: userAmount,
        notes: note,
      },
    });

    console.log(`Tur ${round.roundIndex} (${round.recipientName}): goldAmount=${roundGoldPool}, perMember=${defAmt}, userShare=${effectiveShares}, userPay=${userAmount}`);

    if (round.expenseId) {
      const expDesc = `Altın Günü | Grup: ${updatedGroup.title} | Sıra: ${round.recipientName}${userTurnNote} | Kişi Başı: 1 Cumhuriyet Altını (₺${defAmt.toLocaleString("tr-TR")}) | Toplam Altın: ${payingMembers} Adet (₺${roundGoldPool.toLocaleString("tr-TR")}) | Muhammed Ali (${effectiveShares} Hisse)`;

      await prisma.schoolExpense.update({
        where: { id: round.expenseId },
        data: {
          title: `🪙 Altın Günü: ${updatedGroup.title} (Sıra: ${round.recipientName})`,
          subCategory: "Cumhuriyet Altını",
          amountDue: userAmount,
          amountPaid: round.isPaid ? userAmount : 0,
          amountRemaining: round.isPaid ? 0 : userAmount,
          description: expDesc,
        },
      });
      console.log(`  -> SchoolExpense (ID: ${round.expenseId}) güncellendi: amountDue=${userAmount}`);
    }
  }

  console.log("--- DÜZELTME BAŞARIYLA TAMAMLANDI ---");
}

main()
  .catch((e) => {
    console.error("Hata:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
