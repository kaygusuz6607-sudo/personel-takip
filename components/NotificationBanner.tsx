"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bell, AlertTriangle, CheckCircle2, ChevronRight, X } from "lucide-react";

interface NotificationItem {
  staffId: string;
  fullName: string;
  tcNo: string;
  title: string | null;
  department: string;
  mebAssignmentDate: string;
  isMonday: boolean;
  urgency: string;
  message: string;
}

export function NotificationBanner() {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (pathname === "/login") return;
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // 1 dakikada bir kontrol
    return () => clearInterval(interval);
  }, []);

  const markAsNotified = async (staffId: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId, isSgkNotified: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.staffId !== staffId));
      }
    } catch (e) {
      alert("Hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (pathname === "/login" || notifications.length === 0 || dismissed) return null;

  return (
    <div className="bg-amber-500 text-slate-900 border-b border-amber-600 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-start md:items-center gap-2.5">
            <span className="p-1 rounded-md bg-amber-600/30 text-slate-950 shrink-0 mt-0.5 md:mt-0 animate-pulse">
              <Bell className="w-4 h-4 font-bold" />
            </span>
            <div className="text-xs sm:text-sm font-medium leading-tight">
              <span className="font-bold text-slate-950 uppercase tracking-wide mr-1.5">
                [SGK Bildirimi Hatırlatması]:
              </span>
              <span>{notifications[0].fullName} — {notifications[0].message}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              onClick={() => markAsNotified(notifications[0].staffId)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bildirim Yapıldı Olarak İşaretle</span>
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-slate-800 hover:bg-amber-600/20 rounded transition-colors"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
