const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const stagingDir = path.join(__dirname, 'staging');
if (!fs.existsSync(stagingDir)) {
  fs.mkdirSync(stagingDir, { recursive: true });
}

// Copy dev.db
fs.copyFileSync('c:/Personel takip cosmos/prisma/dev.db', path.join(stagingDir, 'dev.db'));
// Copy cosmos_tum_veriler.json
fs.copyFileSync('c:/Personel takip cosmos/cosmos_tum_veriler.json', path.join(stagingDir, 'cosmos_tum_veriler.json'));
// Copy ssh key
const keyPath = fs.existsSync('C:/Users/User/Desktop/akif çok önemlii/ssh-key-2026-10-02.key')
  ? 'C:/Users/User/Desktop/akif çok önemlii/ssh-key-2026-10-02.key'
  : 'C:/Users/User/Downloads/ssh-key-2026-10-02.key';
if (fs.existsSync(keyPath)) {
  fs.copyFileSync(keyPath, path.join(stagingDir, 'ssh-key-2026-10-02.key'));
}

const zipName = 'COSMOS_PERSONEL_TAKIP_TAM_YEDEK_20261002.zip';
const zipNameToday = 'COSMOS_PERSONEL_TAKIP_TAM_YEDEK_20261003.zip';
const downloadsZip = path.join('C:/Users/User/Downloads', zipName);
const desktopZip = path.join('C:/Users/User/Desktop', zipName);
const desktopZipToday = path.join('C:/Users/User/Desktop', zipNameToday);

if (fs.existsSync(downloadsZip)) fs.unlinkSync(downloadsZip);
if (fs.existsSync(desktopZip)) fs.unlinkSync(desktopZip);
if (fs.existsSync(desktopZipToday)) fs.unlinkSync(desktopZipToday);

// Run powershell Compress-Archive
console.log('Compressing files...');
execSync(`powershell -Command "Compress-Archive -Path '${stagingDir}/*' -DestinationPath '${downloadsZip}' -Force"`, { stdio: 'inherit' });

// Copy to Desktop
fs.copyFileSync(downloadsZip, desktopZip);
fs.copyFileSync(downloadsZip, desktopZipToday);

console.log('Zip file created successfully at:');
console.log('1.', downloadsZip, 'Size:', fs.statSync(downloadsZip).size);
console.log('2.', desktopZip, 'Size:', fs.statSync(desktopZip).size);
console.log('3.', desktopZipToday, 'Size:', fs.statSync(desktopZipToday).size);
