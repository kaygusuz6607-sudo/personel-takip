const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const target = process.argv[2];

if (!['postgres', 'postgresql', 'sqlite'].includes(target)) {
  console.error('Kullanım: node scripts/switch-db.js [postgres|sqlite]');
  process.exit(1);
}

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

const postgresDatasource = `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_UNPOOLED")
}`;

const sqliteDatasource = `datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}`;

if (target === 'postgres' || target === 'postgresql') {
  content = content.replace(/datasource db \{[\s\S]*?\}/, postgresDatasource);
  console.log('✓ prisma/schema.prisma -> PostgreSQL olarak ayarlandı.');
} else {
  content = content.replace(/datasource db \{[\s\S]*?\}/, sqliteDatasource);
  console.log('✓ prisma/schema.prisma -> SQLite (dev.db) olarak ayarlandı.');
}

fs.writeFileSync(schemaPath, content, 'utf8');

try {
  console.log('Prisma istemcisi oluşturuluyor...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✓ Prisma Client başarıyla güncellendi.');
} catch (e) {
  console.error('Prisma generate hatası:', e.message);
  process.exit(1);
}
