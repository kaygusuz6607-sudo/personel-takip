"use client";

import { useState, useEffect } from "react";
import { Download, Check, Sparkles } from "lucide-react";

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
      }

      const handler = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        "Masaüstüne veya telefona kısayol eklemek için:\n\n" +
        "• Bilgisayarda (Chrome/Edge): Adres çubuğunun en sağındaki 'Uygulamayı Yükle' (ekran simgesi) butonuna veya sağ üstteki üç noktadan 'Uygulama olarak yükle'ye tıklayın.\n\n" +
        "• Telefonda (Safari): Alttaki Paylaş butonuna basıp 'Ana Ekrana Ekle'yi seçin.\n" +
        "• Telefonda (Chrome): Sağ üstteki üç noktadan 'Uygulamayı Yükle / Ana Ekrana Ekle'yi seçin."
      );
    }
  };

  if (isInstalled) return null;

  return (
    <div className="px-3 py-2 border-t border-slate-100 bg-teal-50/50">
      <button
        onClick={handleInstall}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-xs transition-all"
        title="Eliflgs gibi masaüstü veya telefon uygulaması olarak yükle"
      >
        <Download className="w-3.5 h-3.5 text-teal-300" />
        <span>Uygulama Olarak Yükle</span>
      </button>
    </div>
  );
}
