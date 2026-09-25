import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Orhan Kayaalp Cari hesabı...");

  // Mevcut var mı kontrol et
  let orhan = await prisma.thirdPartyAccount.findFirst({
    where: { name: { contains: "Orhan Kayaalp", mode: "insensitive" } },
  });

  if (!orhan) {
    orhan = await prisma.thirdPartyAccount.create({
      data: {
        name: "Orhan Kayaalp",
        type: "PARTNER",
        phone: "0532 000 00 00",
        notes: "Şirket kurucu / borç-alacak cari hesabı",
        balance: 0,
      },
    });
    console.log("Orhan Kayaalp hesabı oluşturuldu:", orhan.id);
  }

  // Mevcut işlemlerini temizleyip baştan ekle
  await prisma.thirdPartyTransaction.deleteMany({
    where: { accountId: orhan.id },
  });

  // 1. İşlem: Borç alındı 150.000 TL -> Bakiye -150.000 TL
  const tx1 = await prisma.thirdPartyTransaction.create({
    data: {
      accountId: orhan.id,
      date: new Date("2026-08-15"),
      type: "BORROW",
      amount: 150000,
      direction: "OUTFLOW",
      balanceAfter: -150000,
      paymentMethod: "BANK",
      category: "Nakit Borç",
      description: "Şahıstan borç para alındı",
    },
  });

  // 2. İşlem: Sgk için bizim adımıza ödeme yaptı borçlanıldı 10.000 tl -> Bakiye -140.000 TL
  const tx2 = await prisma.thirdPartyTransaction.create({
    data: {
      accountId: orhan.id,
      date: new Date("2026-08-25"),
      type: "OFFSET",
      amount: 10000,
      direction: "INFLOW",
      balanceAfter: -140000,
      paymentMethod: "BANK",
      category: "SGK Ödemesi",
      description: "SGK için bizim adımıza ödeme yaptı (Borç mahsubu)",
    },
  });

  // 3. İşlem: Ödeme gönderildi 50.000 tl -> Bakiye -90.000 TL
  const tx3 = await prisma.thirdPartyTransaction.create({
    data: {
      accountId: orhan.id,
      date: new Date("2026-09-05"),
      type: "PAYMENT_SENT",
      amount: 50000,
      direction: "INFLOW",
      balanceAfter: -90000,
      paymentMethod: "BANK",
      category: "Banka Havalesi",
      description: "Şahsa borç ödemesi gönderildi",
    },
  });

  await prisma.thirdPartyAccount.update({
    where: { id: orhan.id },
    data: { balance: -90000 },
  });

  console.log("Orhan Kayaalp örnek ekstresi başarıyla oluşturuldu! Güncel bakiye: -90.000 TL");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
