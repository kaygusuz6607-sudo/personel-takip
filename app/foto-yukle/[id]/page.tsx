"use client";

import { useState, useEffect, useRef, use } from "react";
import { Camera, Image as ImageIcon, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, User } from "lucide-react";

export default function FotoYuklePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [staff, setStaff] = useState<{ id: string; fullName: string; title: string; photoUrl: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStaff();
  }, [id]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/personel/${id}/foto`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Personel bilgisi alınamadı.");
      setStaff(data);
      if (data.photoUrl) setPreview(data.photoUrl);
    } catch (err: any) {
      setErrorMsg(err.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Resmi 400x400 boyutunda sıkıştır ve Base64'e dönüştür
  const processImage = (file: File) => {
    setErrorMsg("");
    setSavedSuccess(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        // Kareye kırpma/oran koruma
        const minDim = Math.min(width, height);
        const startX = (width - minDim) / 2;
        const startY = (height - minDim) / 2;

        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setErrorMsg("Görsel işlenemedi.");
          return;
        }

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, MAX_SIZE, MAX_SIZE);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
        setPreview(compressedBase64);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    try {
      setSaving(true);
      setErrorMsg("");

      const res = await fetch(`/api/personel/${id}/foto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: preview }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fotoğraf kaydedilemedi.");

      setSavedSuccess(true);
      fetchStaff();
    } catch (err: any) {
      setErrorMsg(err.message || "Fotoğraf kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-400" />
          <p className="text-sm font-medium">Personel bilgisi yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (errorMsg && !staff) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-6 text-center space-y-4 border border-slate-700">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold">Hata Oluştu</h2>
          <p className="text-sm text-slate-300">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto">
      {/* Üst Başlık */}
      <div className="text-center pt-2 pb-4 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-2">
          <span>📱 Mobil Fotoğraf Yükleme</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">{staff?.fullName}</h1>
        <p className="text-xs text-slate-400">{staff?.title}</p>
      </div>

      {/* Ana Fotoğraf Önizleme Alanı */}
      <div className="flex-1 flex flex-col items-center justify-center py-6">
        <div className="relative group">
          <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-teal-500/40 shadow-2xl bg-slate-900 flex items-center justify-center relative">
            {preview ? (
              <img src={preview} alt={staff?.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500">
                <User className="w-20 h-20 text-slate-600 mb-1" />
                <span className="text-xs font-medium">Fotoğraf Yok</span>
              </div>
            )}
          </div>

          {savedSuccess && (
            <div className="absolute -bottom-2 inset-x-0 flex justify-center">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg">
                <CheckCircle2 className="w-4 h-4" />
                Kaydedildi!
              </span>
            </div>
          )}
        </div>

        {savedSuccess && (
          <div className="mt-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs text-center leading-relaxed">
            🎉 <strong>Tebrikler!</strong> Fotoğraf başarıyla yüklendi. Bilgisayar ekranınız otomatik olarak güncellenmiştir. Bu sayfayı kapatabilirsiniz.
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Aksiyon Butonları */}
      <div className="space-y-3 pb-6">
        {/* Gizli file inputlar */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 active:scale-95 transition-all shadow-md"
          >
            <Camera className="w-4 h-4 text-teal-400" />
            <span>Kamera ile Çek</span>
          </button>

          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 active:scale-95 transition-all shadow-md"
          >
            <ImageIcon className="w-4 h-4 text-blue-400" />
            <span>Galeriden Seç</span>
          </button>
        </div>

        {preview && preview !== staff?.photoUrl && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Fotoğrafı Kaydet</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
