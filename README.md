# 🏫 COSMOS - Okul & Personel Takip Sistemi (Proje El Kitabı & Durum Özeti)

Bu doküman, yeni bir geliştirici veya yeni bir Antigravity yapay zeka oturumu açıldığında projenin mevcut durumunu, mimarisini ve canlı sunucu bağlantılarını eksiksiz aktarmak için hazırlanmıştır.

---

## 📌 1. Proje Genel Bilgileri & Teknoloji Yığını
* **Framework:** Next.js 15 (App Router, Standalone Output) + React + Tailwind CSS
* **Veritabanı & ORM:** SQLite (`prisma/dev.db`) + Prisma ORM
* **Çalışma Ortamı:** Docker & Docker Compose (`personel_takip_app`)
* **Yerel Proje Dizini:** `C:\Personel takip cosmos`

---

## 🚀 2. Canlı Sunucu (Production) Bilgileri
* **Sunucu IP:** `193.122.58.27`
* **Kullanıcı:** `ubuntu`
* **SSH Anahtarı Yolu:** `C:\Users\User\Desktop\akif çok önemlii\ssh-key-2026-10-02.key`
* **Sunucudaki Proje Dizini:** `/home/ubuntu/personel-takip`
* **Docker Konteyneri:** `personel_takip_app` (Port 3000)
* **Canlı Yayına Alma Komutu:**
  ```bash
  ssh -i "C:\Users\User\Desktop\akif çok önemlii\ssh-key-2026-10-02.key" ubuntu@193.122.58.27 "cd /home/ubuntu/personel-takip && docker compose build app && docker compose up -d"
  ```
* **Veritabanı Konumu (Sunucu):** `/home/ubuntu/personel-takip/prisma/dev.db`
* **Yüklenen Evraklar Konumu (Sunucu):** `/home/ubuntu/personel-takip/uploads/evraklar/`

---

## 📂 3. Mevcut Ana Modüller & Sayfalar
1. **Gösterge Paneli (`/`):** Personel, öğrenci, ciro özetleri, geciken ve bugünkü işlerin hatırlatıcı kartları, telefon taahhüt uyarıları.
2. **İş Planı & Okul Ajandası (`/is-plani`):**
   * Günlük yapılacak işler (Banka para çekimi, MEB evrakları, vb.).
   * 📋 Ajanda Listesi (Gecikenler, Bugün, Yaklaşanlar, Tamamlananlar) + 📅 İnteraktif Ay Takvimi.
   * Tek tıkla checkbox tamamlama/geri alma.
   * API: `/api/gorevler`
3. **Evrak & Dosya Yönetimi (`/dosyalar`):**
   * Kullanım alanlarına göre evrak kategorileri (Kayıt & Veli, MEB & Resmi, vb.).
   * Tarayıcı içinde indirmeden **Önizleme (PDF/Resim)** ve doğrudan **Yazdır (Print)** özellikleri.
   * Çift yedekli depolama: hem diskte (`uploads/evraklar/`) hem SQLite'da Base64 yedekli.
   * API: `/api/dosyalar`, `/api/dosyalar/[id]/view`, `/api/dosyalar/[id]/download`
4. **Öğrenci Kütüğü (`/ogrenciler`):**
   * Kayıtlar, sözleşmeler, taksit planları, yoklama, veli bilgileri.
   * **Arama Özelliği:** Büyük/küçük harf duyarsız, tam Türkçe karakter toleranslı (İ/i, I/ı, vb.), 3 harf ile anında arama.
5. **Muhasebe & Finans Modülleri:**
   * **Fatura & Abonelik Takibi (`/faturalar`):** Doğalgaz, Elektrik, Su, İnternet faturaları, aylık/yıllık analiz.
   * **Kredi Takibi (`/krediler`):** Okul veya şahıs adına çekilen krediler, taksit planları, kalan borçlar.
   * **Kredi Kartları Takip (`/kredi-kartlari`):** Kart limitleri, ekstre tarihleri, taksitli işlemler.
   * **Çek Takibi (`/cekler`):** Alınan ve verilen çekler, vadeler.
   * **Tedarikçi & Ürün Carileri (`/tedarikci-cariler`):** Cari hesap ekstresi ve ödemeler.
   * **Şahıs & 3. Kişi Carileri (`/sahis-carileri`):** Ortaklar, emanetler ve şahıs borçları.
   * **Kayıt Silme İadeleri (`/kayit-silme-iadeleri`):** Ayrılan öğrencilerin iade taksit planları.
   * **Günlük Kasa & Gider Planı (`/gunluk-kasa-plan`):** Nakit akışı ve gider planı.
   * **Finansal Analiz & AI Paneli (`/finansal-analiz`)**
6. **Personel İşlemleri:**
   * Personeller (`/personeller`), Maaş / Tahakkuk (`/maas`), Personel Ödeme (`/odeme`), Personel Cari (`/cari`), İzin Girişi (`/izin`).
7. **CRM & Aday Öğrenci (`/crm`), Fiyat Teklif Formu (`/teklifler`), Sınıflar & Şubeler (`/siniflar`), Araç & Mülk Takibi (`/arac-mulk-takip`).

---

## ⚠️ 4. Önemli Kurallar & Hassas Noktalar
1. **Veritabanı Güvenliği:** Sunucudaki `dev.db` gerçek okul verilerini içerir. Yapılan herhangi bir işlemden önce sunucudan yerel `backups/` klasörüne SCP ile yedek alınmalıdır.
2. **`git push` Durumu:** Kullanıcının özel talimatı gereği son geliştirmeler yerel commit yapılmış fakat `git push origin main` henüz çalıştırılmamıştır (doğrudan canlı sunucuya SCP ile aktarılıp derlenmiştir). `git push` yapmadan önce kullanıcıdan onay alınmalıdır.
3. **Canlıya Alma:** Değişen dosyalar `/home/ubuntu/personel-takip` dizinine SCP ile aktarılıp `docker compose build app && docker compose up -d` ile yeniden başlatılır.
