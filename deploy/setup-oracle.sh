#!/bin/bash
set -e

echo "=========================================================="
echo "    ORACLE CLOUD (OCI) OTOMATİK KURULUM BAŞLATILIYOR     "
echo "=========================================================="

# 1. Sistem Güncellemesi ve Araçların Kurulumu
echo "-> 1/5: Sistem paketleri güncelleniyor ve gerekli araçlar kuruluyor..."
sudo apt-get update -y
sudo apt-get install -y curl git ufw nginx iptables-persistent netfilter-persistent

# 2. Oracle Cloud Güvenlik Duvarı (iptables) Kuralı
# ÖNEMLİ: Oracle Cloud Ubuntu imajlarında varsayılan iptables kuralları port 80 ve 443'ü engeller.
echo "-> 2/5: Güvenlik duvarı (Port 80, 443 ve 3000) açılıyor..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT
sudo netfilter-persistent save

# UFW yapılandırması
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable

# 3. Docker Kurulumu
echo "-> 3/5: Docker ve Docker Compose kontrol ediliyor..."
if ! command -v docker &> /dev/null; then
    echo "Docker kuruluyor..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    sudo apt-get install -y docker-compose-plugin
    rm -f get-docker.sh
fi

# 4. Nginx Yapılandırması (Port 80 -> 3000 Yönlendirme)
echo "-> 4/5: Nginx ters vekil sunucusu (Reverse Proxy) ayarlanıyor..."
sudo cp deploy/nginx.conf /etc/nginx/sites-available/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# 5. Docker Konteynerini Derle ve Başlat
echo "-> 5/5: Personel Takip uygulaması konteyneri derleniyor ve başlatılıyor..."
sudo docker compose down || true
sudo docker compose up -d --build

echo ""
echo "=========================================================="
echo "           TEBRİKLER! KURULUM BAŞARIYLA TAMAMLANDI        "
echo "=========================================================="
PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "SUNUCU_IP")
echo "Sitenize şu adresten erişebilirsiniz:"
echo "http://${PUBLIC_IP}"
echo "=========================================================="
