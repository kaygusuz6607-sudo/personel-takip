const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportAll() {
  console.log("Veritabanı tam dışa aktarımı başlatılıyor...");

  const backupData = {
    exportDate: new Date().toISOString(),
    version: "1.0",
    system: "COSMOS Personel Takip Sistemi",
    serverIp: "193.122.58.27",
    tables: {}
  };

  const modelKeys = Object.keys(prisma).filter(k => 
    !k.startsWith('$') && 
    !k.startsWith('_') && 
    typeof prisma[k] === 'object' && 
    prisma[k] && 
    typeof prisma[k].findMany === 'function'
  );

  console.log("Bulunan tablolar:", modelKeys);

  for (const model of modelKeys) {
    try {
      const records = await prisma[model].findMany();
      backupData.tables[model] = records;
      console.log(`- ${model}: ${records.length} kayıt dışa aktarıldı.`);
    } catch (err) {
      console.error(`- ${model} hatası:`, err.message);
    }
  }

  const targetDir = path.join(__dirname, '..', 'YEDEK_PAKETI');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const jsonPath = path.join(targetDir, 'cosmos_tum_veriler.json');
  fs.writeFileSync(jsonPath, JSON.stringify(backupData, null, 2), 'utf8');

  console.log(`\nBAŞARILI: Tam JSON yedeği oluşturuldu -> ${jsonPath}`);
  await prisma.$disconnect();
}

exportAll().catch(console.error);
