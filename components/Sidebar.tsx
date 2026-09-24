"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Calculator,
  CreditCard,
  CalendarCheck,
  FileSpreadsheet,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ShieldCheck,
  KeyRound,
  Lock,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  HardDrive,
} from "lucide-react";

interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: string;
  email?: string | null;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Profil & Şifre Değiştirme Modalı Durumu
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: "",
    name: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const openProfileModal = () => {
    if (!currentUser) return;
    setProfileForm({
      username: currentUser.username,
      name: currentUser.name,
      newPassword: "",
      confirmPassword: "",
    });
    setProfileError(null);
    setProfileSuccess(null);
    setProfileModalOpen(true);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setProfileError(null);
    setProfileSuccess(null);

    if (!profileForm.username.trim() || !profileForm.name.trim()) {
      setProfileError("Kullanıcı adı ve Ad Soyad zorunludur.");
      return;
    }

    if (profileForm.newPassword) {
      if (profileForm.newPassword.length < 4) {
        setProfileError("Şifre en az 4 karakter olmalıdır.");
        return;
      }
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        setProfileError("Girdiğiniz yeni şifreler birbiriyle uyuşmuyor.");
        return;
      }
    }

    try {
      setProfileSaving(true);
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: profileForm.username.trim(),
          name: profileForm.name.trim(),
          password: profileForm.newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error || "Güncelleme başarısız.");
        return;
      }

      setCurrentUser((prev) => (prev ? { ...prev, username: data.username, name: data.name } : data));
      setProfileSuccess("Kullanıcı adı ve şifreniz başarıyla güncellendi!");
      setTimeout(() => {
        setProfileModalOpen(false);
      }, 1500);
    } catch {
      setProfileError("Sunucu hatası oluştu.");
    } finally {
      setProfileSaving(false);
    }
  };

  useEffect(() => {
    if (pathname === "/login") return;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/login";
  };

  if (pathname === "/login") {
    return null;
  }

  const menuItems = [
    { href: "/", label: "Gösterge Paneli", icon: LayoutDashboard },
    { href: "/personeller", label: "Personeller", icon: Users },
    { href: "/departmanlar", label: "Departmanlar", icon: Building2 },
    { href: "/maas", label: "Maaş / Tahakkuk", icon: Calculator },
    { href: "/odeme", label: "Personel Ödeme", icon: CreditCard },
    { href: "/izin", label: "İzin Girişi & Takip", icon: CalendarCheck },
    { href: "/raporlar", label: "Raporlar & Excel", icon: FileSpreadsheet },
    { href: "/kullanicilar", label: "Yetkili Kullanıcılar", icon: ShieldCheck },
    { href: "/yedekleme", label: "Yedek & Senkronizasyon", icon: HardDrive },
  ];

  const getInitials = (name?: string) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Top Header (Edutime style) */}
      <header className="lg:hidden sticky top-0 z-40 bg-teal-800 text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1 rounded-md hover:bg-teal-700 focus:outline-none"
            aria-label="Menüyü Aç"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-wider">COSMOS</span>
            <span className="text-xs bg-teal-600 px-2 py-0.5 rounded text-teal-100 font-medium">Personel Takip</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center font-bold text-xs tracking-wider">
            {getInitials(currentUser?.name)}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] h-full bg-white text-slate-800 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-teal-600 flex items-center justify-center font-bold text-xs tracking-wider">
                  CS
                </div>
                <div>
                  <span className="font-bold text-lg block leading-tight">COSMOS</span>
                  <span className="text-xs text-teal-200">Personel Takip</span>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded hover:bg-teal-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Navigation List */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
              <div className="text-xs font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
                Ana Menü
              </div>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-teal-50 text-teal-800 font-semibold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${active ? "text-teal-700" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {getInitials(currentUser?.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {currentUser?.name || "Yetkili"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    @{currentUser?.username || "kullanıcı"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={openProfileModal}
                  title="Şifre & Kullanıcı Adı Değiştir"
                  className="p-2 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                >
                  <KeyRound className="w-5 h-5" />
                </button>
                <button
                  onClick={handleLogout}
                  title="Çıkış Yap"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Matches provided mockup screenshot) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col h-screen sticky top-0 shrink-0 select-none">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-lg bg-teal-800 text-white font-bold flex items-center justify-center text-sm shadow-sm tracking-wider">
            CS
          </div>
          <div>
            <h1 className="font-extrabold text-slate-800 leading-tight tracking-wide text-base">COSMOS</h1>
            <p className="text-[11px] text-teal-700 font-medium">Personel Takip</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-teal-50 text-teal-800 font-semibold shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    active ? "text-teal-700" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer Card */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 tracking-wider">
                {getInitials(currentUser?.name)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {currentUser?.name || "Yetkili"}
                </p>
                <p className="text-[11px] text-teal-700 font-medium truncate">
                  @{currentUser?.username || "admin"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={openProfileModal}
                title="Şifre & Kullanıcı Adı Değiştir"
                className="text-slate-400 hover:text-teal-700 hover:bg-teal-50 p-1.5 rounded-lg transition-colors"
              >
                <KeyRound className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                title="Güvenli Çıkış Yap"
                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Hızlı Şifre & Kullanıcı Adı Değiştirme Modalı */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Şifre & Kullanıcı Adı Değiştir</h3>
                  <p className="text-[11px] text-slate-500">Kendi giriş bilgilerinizi güncelleyin</p>
                </div>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
              {profileError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              {profileSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kullanıcı Adı (Girişte kullanılan)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)
                </label>
                <input
                  type="password"
                  placeholder="Yeni şifrenizi girin..."
                  value={profileForm.newPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                />
              </div>

              {profileForm.newPassword && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Yeni Şifre Tekrar
                  </label>
                  <input
                    type="password"
                    placeholder="Şifreyi tekrar girin..."
                    value={profileForm.confirmPassword}
                    onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {profileSaving ? "Kaydediliyor..." : "Kaydet ve Güncelle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
