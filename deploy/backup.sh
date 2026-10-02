#!/bin/bash
mkdir -p /home/ubuntu/backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/home/ubuntu/backups/dev_${TIMESTAMP}.db"
cp /home/ubuntu/personel-takip/prisma/dev.db "$BACKUP_FILE"
find /home/ubuntu/backups -name "dev_*.db" -mtime +30 -delete
echo "Yedek başarıyla alındı: $BACKUP_FILE"
