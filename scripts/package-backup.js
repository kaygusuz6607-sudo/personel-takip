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
fs.copyFileSync('C:/Users/User/Downloads/ssh-key-2026-10-02.key', path.join(stagingDir, 'ssh-key-2026-10-02.key'));

const zipName = 'COSMOS_PERSONEL_TAKIP_TAM_YEDEK_20261002.zip';
const downloadsZip = path.join('C:/Users/User/Downloads', zipName);
const desktopZip = path.join('C:/Users/User/Desktop', zipName);

if (fs.existsSync(downloadsZip)) fs.unlinkSync(downloadsZip);
if (fs.existsSync(desktopZip)) fs.unlinkSync(desktopZip);

// Run powershell Compress-Archive
console.log('Compressing files...');
execSync(`powershell -Command "Compress-Archive -Path '${stagingDir}/*' -DestinationPath '${downloadsZip}' -Force"`, { stdio: 'inherit' });

// Copy to Desktop
fs.copyFileSync(downloadsZip, desktopZip);

console.log('Zip file created successfully at:');
console.log('1.', downloadsZip, 'Size:', fs.statSync(downloadsZip).size);
console.log('2.', desktopZip, 'Size:', fs.statSync(desktopZip).size);
