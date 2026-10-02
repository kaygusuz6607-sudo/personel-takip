# Oracle Cloud (OCI) Üzerinde Personel Takip Kurulum Kılavuzu

Bu kılavuz, projenizi Oracle Cloud Altyapısı'nda (OCI Always Free - Ömür Boyu Ücretsiz) canlıya almak için gereken tüm adımları içerir.

---

## 1. Oracle Cloud Konsolunda Sanal Sunucu (VM) Oluşturma

1. [cloud.oracle.com](https://cloud.oracle.com) adresine giriş yapın.
2. Sol üstteki menüden (☰) **Compute (İşlem) -> Instances (Örnekler)** yolunu izleyin.
3. **"Create Instance" (Örnek Oluştur)** butonuna tıklayın:
   - **Name (Ad):** `personel-takip-server`
   - **Placement (Yerleşim):** Varsayılan bırakın.
   - **Image and Shape (İmaj ve Şekil):**
     - **Image:** `Ubuntu 22.04` veya `Ubuntu 24.04 LTS` (Değiştir butonuna basıp Ubuntu seçin).
     - **Shape:** `Ampere (ARM)` seçin -> `VM.Standard.A1.Flex` -> 2 veya 4 OCPU, 12 veya 24 GB RAM (Always Free Eligible etiketini görürsünüz). *Alternatif: `AMD VM.Standard.E2.1.Micro`*.
   - **Networking (Ağ):** Varsayılan VCN seçili kalsın, **"Assign a public IPv4 address"** (Genel IPv4 adresi ata) seçeneğinin **işaretli** olduğundan emin olun.
   - **Add SSH keys (SSH Anahtarları):**
     - **"Save private key"** (Özel anahtarı kaydet) butonuna tıklayıp `.key` dosyasını bilgisayarınıza indirin. (Bu dosya sunucuya bağlanmak için gereklidir).
4. En alttaki **"Create"** butonuna basın. Yaklaşık 1–2 dakika içinde sunucu durumu sarıdan yeşile dönüp **"Running"** olacaktır.
5. Sayfadaki **"Public IP Address"** (Genel IP Adresi) değerini kopyalayın.

---

## 2. Oracle Güvenlik Duvarında (Security List) Port 80 ve 443 Açma

> **Önemli:** Oracle Cloud güvenlik nedeniyle dışarıdan gelen HTTP/HTTPS isteklerini başlangıçta kilitler. Sitenizin açılması için bu kuralı eklemelisiniz:

1. Sunucu detay sayfasında alt kısımdaki **"Subnet"** (Alt Ağ) bağlantısına tıklayın.
2. Açılan sayfada **"Default Security List"** bağlantısına tıklayın.
3. **"Add Ingress Rules"** (Gelen Kuralı Ekle) butonuna tıklayın:
   - **Source CIDR:** `0.0.0.0/0`
   - **IP Protocol:** `TCP`
   - **Destination Port Range:** `80,443,3000`
   - **Description:** `Web Trafiği HTTP HTTPS`
4. **"Add Ingress Rules"** butonuna basın.

---

## 3. Sunucuya Bağlanma ve Tek Tıkla Kurulum

Bilgisayarınızda PowerShell veya Terminal açın:

```bash
# İndirdiğiniz SSH anahtarının olduğu klasöre gidin (örn: İndirilenler klasörü):
cd C:\Users\User\Downloads

# Sunucuya bağlanın (SUNUCU_IP yerine 1. adımdaki genel IP'nizi yazın):
ssh -i ssh-key-*.key ubuntu@SUNUCU_IP
```

Sunucuya bağlandıktan sonra sadece şu 2 komutu çalıştırın:

```bash
git clone https://github.com/kaygusuz6607-sudo/personel-takip.git
cd personel-takip
bash deploy/setup-oracle.sh
```

Bu script otomatik olarak:
1. Ubuntu paketlerini günceller.
2. Oracle iptables ve güvenlik duvarı izinlerini ayarlar.
3. Docker ve Nginx'i kurar.
4. Mevcut veritabanınızı (`dev.db`) koruyarak siteyi derler ve arka planda başlatır.

İşlem bittiğinde ekranda beliren IP adresini tarayıcınıza yapıştırarak sitenize erişebilirsiniz!

---

## 4. (İsteğe Bağlı) Alan Adı ve Ücretsiz SSL (HTTPS) Sertifikası

Eğer bir alan adınız (domain) varsa:
1. Domain yönetim panelinizden bir `A Kaydı` ekleyip sunucu IP adresinize yönlendirin (örn: `takip.siteniz.com`).
2. Sunucu terminalinde şu komutu çalıştırın:
   ```bash
   sudo certbot --nginx -d takip.siteniz.com
   ```
3. E-posta adresinizi girin ve şartları onaylayın. Sistem SSL sertifikanızı ücretsiz kuracak ve HTTPS üzerinden güvenli hale getirecektir.
