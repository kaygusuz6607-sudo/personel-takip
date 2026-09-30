"use client";

import { useState, useEffect, use } from "react";
import { Camera, Upload, CheckCircle2, RefreshCw, AlertCircle, FileSpreadsheet, Trash2 } from "lucide-react";

export default function MobileChequePhotoUploadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [title, setTitle] = useState<string>("Çek Görseli");
  const [chequeBank, setChequeBank] = useState<string | null>(null);
  const [chequeNo, setChequeNo] = useState<string | null>(null);
  const [dueDateStr, setDueDateStr] = useState<string | null>(null);
  const [amountDue, setAmountDue] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/giderler/cek/${id}/foto`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          if (data.title) setTitle(data.title);
          if (data.chequeBank) setChequeBank(data.chequeBank);
          if (data.chequeNo) setChequeNo(data.chequeNo);
          if (data.dueDateStr) setDueDateStr(data.dueDateStr);
          if (data.amountDue) setAmountDue(Number(data.amountDue));
          if (data.photoUrl) setPreviewUrl(data.photoUrl);
        }
      })
      .catch(() => setError("Sunucuya bağlanılamadı."))
      .finally(() => setLoading(false));
  }, [id]);

  // Çek görselini dikdörtgen en-boy oranını koruyarak (max 1400px) sıkıştır
  const processChequeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_DIM = 1400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_DIM) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Canvas hatası");

          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => reject("Görsel okunamadı");
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject("Dosya okunamadı");
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const base64Image = await processChequeImage(file);
      setPreviewUrl(base64Image);

      const res = await fetch(`/api/giderler/cek/${id}/foto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: base64Image, title }),
      });

      if (!res.ok) throw new Error("Yükleme başarısız");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Fotoğraf yüklenirken bir hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setUploading(true);
    setError(null);
    try {
      await fetch(`/api/giderler/cek/${id}/foto`, { method: "DELETE" });
      setPreviewUrl(null);
      setSuccess(false);
    } catch {
      setError("Görsel silinemedi.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-sm text-slate-300">Çek bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-amber-950/80 to-slate-900 flex flex-col items-center justify-center p-5 text-white">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-amber-400/30 rounded-3xl p-6 shadow-2xl text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold mb-3">
          <FileSpreadsheet className="w-3.5 h-3.5" />
          CosMos Okulları • Mobil Çek Görseli Yükleme
        </div>

        <h1 className="text-xl font-black tracking-tight text-white mb-1">
          {title || "Çek Ödemesi"}
        </h1>

        {(chequeBank || chequeNo || dueDateStr || amountDue) && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2 mb-4">
            {chequeBank && (
              <span className="text-[11px] bg-white/10 px-2.5 py-0.5 rounded-full text-amber-200 font-semibold">
                🏦 {chequeBank}
              </span>
            )}
            {chequeNo && (
              <span className="text-[11px] bg-white/10 px-2.5 py-0.5 rounded-full text-slate-200 font-semibold">
                Çek No: {chequeNo}
              </span>
            )}
            {dueDateStr && (
              <span className="text-[11px] bg-white/10 px-2.5 py-0.5 rounded-full text-slate-200 font-semibold">
                📅 {dueDateStr}
              </span>
            )}
            {amountDue && amountDue > 0 && (
              <span className="text-[11px] bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-emerald-300 font-bold">
                {amountDue.toLocaleString("tr-TR")} ₺
              </span>
            )}
          </div>
        )}

        <p className="text-xs text-slate-300 mb-5">
          Çekin fotoğrafını kameranızla yatay/net şekilde çekin veya galeriden seçin. Yüklediğinizde bilgisayar ekranına otomatik yansır.
        </p>

        {/* Çek Görseli Önizleme Alanı (Dikdörtgen) */}
        <div className="relative w-full min-h-[190px] mb-5 rounded-2xl overflow-hidden border-2 border-dashed border-amber-400/50 bg-slate-950/60 flex items-center justify-center shadow-inner">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Çek Fotoğrafı"
              className="w-full max-h-72 object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 px-4 text-slate-400">
              <Camera className="w-12 h-12 text-amber-400/70" />
              <span className="text-xs font-medium">Henüz çek fotoğrafı yüklenmedi</span>
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
              <span className="text-xs font-bold text-amber-200">Çek görseli yükleniyor...</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5 text-left">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <div>
              <p className="font-bold text-emerald-300">Çek Fotoğrafı Başarıyla Yüklendi!</p>
              <p className="text-[11px] text-emerald-200/80">
                Bilgisayar ekranınızda çek görseli otomatik olarak güncellendi. Bu sayfayı kapatabilirsiniz.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {/* Kamerayı Doğrudan Açan Buton */}
          <label className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-lg shadow-amber-600/30 cursor-pointer active:scale-95 transition">
            <Camera className="w-5 h-5" />
            <span>Kamerayla Çek Fotoğrafı Çek</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>

          {/* Galeriden Seçen Buton */}
          <label className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-slate-200 font-semibold text-sm cursor-pointer active:scale-95 transition">
            <Upload className="w-4 h-4" />
            <span>Galeriden / Dosyalardan Seç</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>

          {previewUrl && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-300 font-semibold text-xs transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Görseli Kaldır</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
