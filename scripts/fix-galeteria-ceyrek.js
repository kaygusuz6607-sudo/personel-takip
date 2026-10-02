const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function checkIsUserTurn(name) {
  if (!name) return false;
  const n = name.toLowerCase().trim();
  return (
    n.includes("muhammed") ||
    n.includes("muhammet") ||
    n.includes("maç") ||
    n.includes("mac")
  );
}

async function main() {
  const group = await prisma.goldDayGroup.findFirst({
    where: { title: { contains: "Galeteria" } },
    include: { rounds: { orderBy: { roundIndex: "asc" } } },
  });

  if (!group) {
    console.error("Galeteria Altın grubu bulunamadı!");
    return;
  }

  console.log(`Grup bulundu: ${group.title} (ID: ${group.id})`);
  console.log(`Toplam Üye: ${group.totalMembers}, Muhammed Ali Hisse: ${group.userShareCount}`);

  const defAmt = 11250; // 1 Çeyrek Altın
  const payingCount = group.totalMembers - 1; // 12 kişi
  const totalPoolGold = defAmt * payingCount; // 135.000 TL

  // Grubu güncelle
  await prisma.goldDayGroup.update({
    where: { id: group.id },
    data: {
      defaultAmount: defAmt,
      goldType: "CEYREK_ALTIN",
      goldTypeLabel: "Çeyrek Altın",
    },
  });

  for (const round of group.rounds) {
    const isUserTurn = checkIsUserTurn(round.recipientName);
    const effShares = isUserTurn ? 4 : 5;
    const userAmountToPay = defAmt * effShares; // 45.000 TL veya 56.250 TL
    const isPaid = round.isPaid;
    const paidAmount = isPaid ? userAmountToPay : 0;

    console.log(
      `Tur ${round.roundIndex}: ${round.recipientName} -> isUserTurn: ${isUserTurn}, Hisse: ${effShares}, Borç: ${userAmountToPay} TL, Ödendi mi: ${isPaid}`
    );

    const updatedRound = await prisma.goldDayRound.update({
      where: { id: round.id },
      data: {
        isUserTurn,
        goldAmount: totalPoolGold,
        payingMembersCount: payingCount,
        perMemberAmount: defAmt,
        userShareCount: effShares,
        userAmountToPay,
        paidAmount,
      },
    });

    if (round.expenseId) {
      const userTurnNote = isUserTurn
        ? ` (Muhammed Ali Sırası - ${effShares} Hisse)`
        : ` (${effShares} Hisse)`;

      const desc = `Altın Günü | Grup: ${group.title} | Sıra: ${round.recipientName}${userTurnNote} | Kişi Başı: 1 Çeyrek (₺11.250) | Toplam Altın: 12 Çeyrek (₺135.000)`;

      await prisma.schoolExpense.update({
        where: { id: round.expenseId },
        data: {
          subCategory: "Çeyrek Altın",
          amountDue: userAmountToPay,
          amountPaid: isPaid ? userAmountToPay : 0,
          amountRemaining: isPaid ? 0 : userAmountToPay,
          status: isPaid ? "PAID" : "PENDING",
          description: desc,
        },
      });
    }
  }

  console.log("Tüm turlar ve gider kayıtları başarıyla güncellendi!");
}

main()
  .catch((e) => {
    console.error("Hata:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
