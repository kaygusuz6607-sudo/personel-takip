"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bell, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, X, Clock, Calendar } from "lucide-react";

interface NotificationItem {
  id: string;
  staffId: string;
  type: "SGK_START" | "MEB_END";
  fullName: string;
  tcNo: string;
  title: string | null;
  department: string;
  date?: string;
  isMonday?: boolean;
  isExpired?: boolean;
  daysRemaining?: number;
  urgency: string;
  message: string;
}

export function NotificationBanner() {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (pathname === "/login") return;
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        if (currentIndex >= data.notifications.length) {
          setCurrentIndex(0);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // 1 dakikada bir kontrol
    return () => clearInterval(interval);
  }, [pathname]);

  const markAsResolved = async (item: NotificationItem) => {
    try {
      setLoading(true);
      const payload: any = { staffId: item.staffId, type: item.type };
      if (item.type === "MEB_END") {
        payload.isMebEndNotified = true;
      } else {
        payload.isSgkNotified = true;
      }

      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setNotifications((prev) => {
          const next = prev.filter((n) => n.id !== item.id);
          if (currentIndex >= next.length) {
            setCurrentIndex(Math.max(0, next.length - 1));
          }
          return next;
        });
      }
    } catch (e) {
      alert("İşlem sırasında bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (pathname === "/login" || notifications.length === 0 || dismissed) return null;

  const currentItem = notifications[currentIndex] || notifications[0];
  const isMebEnd = currentItem.type === "MEB_END";
  const isCritical = currentItem.isExpired;

  // Banner arka plan rengi: Bitiş tarihi geçmişse kırmızı, yaklaşıyorsa turuncu/amber
  const bannerBg = isCritical
    ? "bg-rose-600 text-white border-rose-700"
    : isMebEnd
    ? "bg-amber-500 text-slate-950 border-amber-600"
    : "bg-amber-500 text-slate-950 border-amber-600";

  return (
    <div className={`${bannerBg} border-b shadow-md transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
          <div className="flex items-start md:items-center gap-2.5 min-w-0">
            <span
              className={`p-1.5 rounded-lg shrink-0 mt-0.5 md:mt-0 animate-pulse ${
                isCritical ? "bg-rose-700/60 text-white" : "bg-black/10 text-slate-950"
              }`}
            >
              {isCritical ? (
                <AlertTriangle className="w-4 h-4 font-bold" />
              ) : isMebEnd ? (
                <Calendar className="w-4 h-4 font-bold" />
              ) : (
                <Bell className="w-4 h-4 font-bold" />
              )}
            </span>

            <div className="text-xs sm:text-sm font-medium leading-tight">
              <span
                className={`font-black uppercase tracking-wider mr-1.5 px-2 py-0.5 rounded text-[11px] ${
                  isCritical
                    ? "bg-rose-900/60 text-white"
                    : isMebEnd
                    ? "bg-amber-900/20 text-slate-950"
                    : "bg-amber-900/20 text-slate-950"
                }`}
              >
                {isCritical
                  ? "🚨 MEB ATAMA SÜRESİ DOLDU"
                  : isMebEnd
                  ? "⚠️ MEB ATAMA BİTİŞ UYARISI"
                  : "🔔 SGK BİLDİRİMİ HATIRLATMASI"}
              </span>
              <span className="font-bold underline decoration-slate-900/30 underline-offset-2">
                {currentItem.fullName}
              </span>
              {currentItem.title && (
                <span className="opacity-80 text-xs ml-1 font-normal">
                  ({currentItem.title})
                </span>
              )}
              <span className="mx-1.5">—</span>
              <span className="font-medium">{currentItem.message}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            {/* Çoklu bildirim sayfalama */}
            {notifications.length > 1 && (
              <div className="flex items-center gap-1 bg-black/15 px-2 py-0.5 rounded-md text-xs font-bold mr-1">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : notifications.length - 1))}
                  className="hover:opacity-75 p-0.5"
                  title="Önceki Bildirim"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span>
                  {currentIndex + 1} / {notifications.length}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => (prev < notifications.length - 1 ? prev + 1 : 0))}
                  className="hover:opacity-75 p-0.5"
                  title="Sonraki Bildirim"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={() => markAsResolved(currentItem)}
              disabled={loading}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs ${
                isCritical
                  ? "bg-white text-rose-900 hover:bg-rose-50"
                  : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >
              <CheckCircle2
                className={`w-3.5 h-3.5 ${isCritical ? "text-rose-600" : "text-emerald-400"}`}
              />
              <span>
                {isMebEnd
                  ? "Atama Yenilendi / Bildirimi Kapat"
                  : "SGK Bildirimi Yapıldı Olarak İşaretle"}
              </span>
            </button>

            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-current opacity-70 hover:opacity-100 hover:bg-black/10 rounded transition-colors"
              title="Geçici Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

