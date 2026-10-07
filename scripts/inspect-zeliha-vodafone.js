const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const p = new PrismaClient();

async function main() {
  console.log("=== 1. CURRENT DB INSPECTION ===");
  const zeliha = await p.staff.findFirst({
    where: { fullName: { contains: "Zeliha" } },
    include: { leaves: true }
  });
  console.log("Current DB Zeliha:", zeliha ? { id: zeliha.id, name: zeliha.fullName, leavesCount: zeliha.leaves ? zeliha.leaves.length : 0, leaves: zeliha.leaves } : "Not found");

  const allLeaves = await p.leaveRecord.findMany({
    include: { staff: true }
  });
  console.log("Total leaves in DB:", allLeaves.length);
  const zLeaves = allLeaves.filter(l => l.staff && l.staff.fullName && l.staff.fullName.includes("Zeliha"));
  console.log("Zeliha leaves count:", zLeaves.length, zLeaves);

  const vodafone = await p.schoolExpense.findMany({
    where: {
      OR: [
        { title: { contains: "Vodafone" } },
        { title: { contains: "vodafone" } },
        { description: { contains: "Vodafone" } },
        { description: { contains: "vodafone" } }
      ]
    }
  });
  console.log("Current DB Vodafone expenses count:", vodafone.length);
  for (const v of vodafone) {
    console.log(`- [${v.id}] ${v.title} | ${v.period} | ${v.amountDue} | Desc: ${v.description}`);
  }

  console.log("\n=== 2. SEARCHING BACKUP JSON FILES ===");
  const jsonFiles = [
    "C:\\Users\\User\\Desktop\\akif çok önemlii\\oracle_tam_yedek.json",
    "C:\\Users\\User\\Desktop\\akif çok önemlii\\COSMOS_TAM_YEDEK_2026-10-01.json",
    "C:\\Users\\User\\Downloads\\COSMOS_TAM_YEDEK_2026-09-29.json",
    "C:\\Users\\User\\Downloads\\COSMOS_TAM_YEDEK_2026-09-26.json",
    "c:\\Personel takip cosmos\\scripts\\authoritative_dump.json",
    "c:\\Personel takip cosmos\\cosmos_tum_veriler.json",
    "C:\\Personel takip cosmos\\scripts\\staging\\cosmos_tum_veriler.json"
  ];

  for (const filePath of jsonFiles) {
    if (!fs.existsSync(filePath)) continue;
    try {
      console.log(`\nChecking: ${filePath}`);
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);

      // Check for leaves of Zeliha
      // Structure could be data.leaves or data.data.leaves or personnel.leaves
      let leaves = [];
      if (Array.isArray(data.leaves)) leaves = data.leaves;
      else if (data.data && Array.isArray(data.data.leaves)) leaves = data.data.leaves;

      // Also check personnel list
      let personels = [];
      if (Array.isArray(data.personnel)) personels = data.personnel;
      else if (data.data && Array.isArray(data.data.personnel)) personels = data.data.personnel;
      else if (Array.isArray(data.personnels)) personels = data.personnels;

      const z = personels.find(x => x.fullName && x.fullName.includes("Zeliha"));
      if (z) {
        console.log(`  Found Zeliha in personels: ID=${z.id}, leaves in personnel object=${z.leaves ? z.leaves.length : "none"}`);
        if (z.leaves && z.leaves.length > 0) {
          console.log("  Zeliha's leaves inside personnel:", JSON.stringify(z.leaves, null, 2));
        }
      }

      const zLeaves = leaves.filter(l => (z && l.personnelId === z.id) || (l.personnel && l.personnel.fullName && l.personnel.fullName.includes("Zeliha")));
      console.log(`  Leaves matching Zeliha: ${zLeaves.length}`);
      if (zLeaves.length > 0) {
        console.log("  Leaves:", JSON.stringify(zLeaves, null, 2));
      }

      // Check expenses for Vodafone
      let expenses = [];
      if (Array.isArray(data.schoolExpenses)) expenses = data.schoolExpenses;
      else if (Array.isArray(data.expenses)) expenses = data.expenses;
      else if (data.data && Array.isArray(data.data.schoolExpenses)) expenses = data.data.schoolExpenses;

      const vExps = expenses.filter(e => 
        (e.title && e.title.toLowerCase().includes("vodafone")) || 
        (e.description && e.description.toLowerCase().includes("vodafone"))
      );
      console.log(`  Vodafone expenses: ${vExps.length}`);
      for (const ve of vExps) {
        console.log(`    * [${ve.id}] ${ve.title} | ${ve.period} | ${ve.amountDue} | Desc: ${ve.description}`);
      }
    } catch (err) {
      console.error(`  Error reading ${filePath}:`, err.message);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
