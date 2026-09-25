"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  Briefcase,
  Calendar,
  X,
  CreditCard,
  Phone,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  Copy,
  Check,
  ChevronRight,
} from "lucide-react";

export interface SalaryStaffItem {
  id: string;
  fullName: string;
  title: string;
  deptName: string;
  amount: number;
  isPaid: boolean;
  paidDate?: string | null;
  iban?: string | null;
  accountNumber?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
}

interface DashboardSalaryScheduleProps {
  monthName: string;
  year: number;
  teachers: SalaryStaffItem[];
  staffs: SalaryStaffItem[];
  admins: SalaryStaffItem[];
}

export function DashboardSalarySchedule({
  monthName,
  year,
  teachers,
  staffs,
  admins,
}: DashboardSalaryScheduleProps) {
  const [selectedGroup, setSelectedGroup] = useState<"TEACHER" | "STAFF" | "ADMIN" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(val);
  };

  const teacherTotal = teachers.reduce((sum, t) => sum + t.amount, 0);
  const teacherPaidCount = teachers.filter((t) => t.isPaid).length;

  const staffTotal = staffs.reduce((sum, s) => sum + s.amount, 0);
  const staffPaidCount = staffs.filter((s) => s.isPaid).length;

  const adminTotal = admins.reduce((sum, a) => sum + a.amount, 0);
  const adminPaidCount = admins.filter((a) => a.isPaid).length;

  // Modaldaki aktif liste
  const getActiveGroupData = () => {
    if (selectedGroup === "TEACHER") {
      return {
        title: "Öğretmen Kadrosu Maaş Detayları",
        day: "10",
        payDayText: "Her Ayın 10'u",
        colorClass: "teal",
        icon: GraduationCap,
        list: teachers,
        total: teacherTotal,
        paidCount: teacherPaidCount,
      };
    }
    if (selectedGroup === "STAFF") {
      return {
        title: "Personel & Destek Kadrosu Maaş Detayları",
        day: "15",
        payDayText: "Her Ayın 15'i",
        colorClass: "blue",
        icon: Users,
        list: staffs,
        total: staffTotal,
        paidCount: staffPaidCount,
      };
    }
    if (selectedGroup === "ADMIN") {
      return {
        title: "İdari Personel & Yönetim Kadrosu Maaş Detayları",
        day: "20",
        payDayText: "Her Ayın 20'si",
        colorClass: "purple",
        icon: Briefcase,
        list: admins,
        total: adminTotal,
        paidCount: adminPaidCount,
      };
    }
    return null;
  };

  const activeGroup = getActiveGroupData();

  const filteredStaffList = activeGroup
    ? activeGroup.list.filter(
        (s) =>
          !searchQuery.trim() ||
          s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.deptName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleCopyIban = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Başlık ve Vade Bilgisi */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span>📅 {monthName} {year} Maaş Ödeme Takvimi</span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            3 Ayrı Vade • Tıklayarak İnceleyin
          </span>
        </h2>
        <Link href="/odeme" className="text-xs text-teal-700 hover:underline font-semibold flex items-center gap-1">
          <span>Tüm Bordroları İncele</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 3 Tıklanabilir Kart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. ÖĞRETMENLER (Ayın 10'u) */}
        <div
          onClick={() => {
            setSelectedGroup("TEACHER");
            setSearchQuery("");
          }}
          className="bg-white p-5 rounded-2xl border border-teal-200/90 shadow-xs relative overflow-hidden bg-gradient-to-br from-white to-teal-50/40 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex flex-col items-center justify-center font-extrabold text-xs shadow-2xs group-hover:scale-105 transition-transform">
                <span>10</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-800 transition-colors">
                  Öğretmen Maaşları
                </h3>
                <span className="text-[11px] text-teal-700 font-bold">Her Ayın 10&apos;u</span>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
              {teachers.length} Öğretmen
            </span>
          </div>

          <div className="pt-3 flex items-baseline justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-medium">Toplam Net Ödeme</span>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">{formatCurrency(teacherTotal)}</p>
            </div>
            <div className="text-right text-[11px]">
              <span className="text-emerald-700 font-bold block">{teacherPaidCount} Ödendi</span>
              <span className="text-amber-700 font-semibold block">{teachers.length - teacherPaidCount} Bekliyor</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-teal-100/60 flex items-center justify-between text-[11px] text-teal-700 font-semibold">
            <span>Kadro ve Maaş Listesini Gör</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 2. PERSONELLER (Ayın 15'i) */}
        <div
          onClick={() => {
            setSelectedGroup("STAFF");
            setSearchQuery("");
          }}
          className="bg-white p-5 rounded-2xl border border-blue-200/90 shadow-xs relative overflow-hidden bg-gradient-to-br from-white to-blue-50/40 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex flex-col items-center justify-center font-extrabold text-xs shadow-2xs group-hover:scale-105 transition-transform">
                <span>15</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-800 transition-colors">
                  Personel Maaşları
                </h3>
                <span className="text-[11px] text-blue-700 font-bold">Her Ayın 15&apos;i</span>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              {staffs.length} Personel
            </span>
          </div>

          <div className="pt-3 flex items-baseline justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-medium">Toplam Net Ödeme</span>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">{formatCurrency(staffTotal)}</p>
            </div>
            <div className="text-right text-[11px]">
              <span className="text-emerald-700 font-bold block">{staffPaidCount} Ödendi</span>
              <span className="text-amber-700 font-semibold block">{staffs.length - staffPaidCount} Bekliyor</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-blue-100/60 flex items-center justify-between text-[11px] text-blue-700 font-semibold">
            <span>Kadro ve Maaş Listesini Gör</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 3. İDARİ PERSONEL (Ayın 20'si) */}
        <div
          onClick={() => {
            setSelectedGroup("ADMIN");
            setSearchQuery("");
          }}
          className="bg-white p-5 rounded-2xl border border-purple-200/90 shadow-xs relative overflow-hidden bg-gradient-to-br from-white to-purple-50/40 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex flex-col items-center justify-center font-extrabold text-xs shadow-2xs group-hover:scale-105 transition-transform">
                <span>20</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-800 transition-colors">
                  İdari Personel Maaşları
                </h3>
                <span className="text-[11px] text-purple-700 font-bold">Her Ayın 20&apos;si</span>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              {admins.length} İdari
            </span>
          </div>

          <div className="pt-3 flex items-baseline justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-medium">Toplam Net Ödeme</span>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">{formatCurrency(adminTotal)}</p>
            </div>
            <div className="text-right text-[11px]">
              <span className="text-emerald-700 font-bold block">{adminPaidCount} Ödendi</span>
              <span className="text-amber-700 font-semibold block">{admins.length - adminPaidCount} Bekliyor</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-purple-100/60 flex items-center justify-between text-[11px] text-purple-700 font-semibold">
            <span>Kadro ve Maaş Listesini Gör</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* DETAY MODALI (Tıklanınca Açılan İçerik) */}
      {activeGroup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl text-white flex flex-col items-center justify-center font-extrabold text-xs shadow-xs ${
                    selectedGroup === "TEACHER"
                      ? "bg-teal-700"
                      : selectedGroup === "STAFF"
                      ? "bg-blue-700"
                      : "bg-purple-700"
                  }`}
                >
                  <span className="text-sm">{activeGroup.day}</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm md:text-base">{activeGroup.title}</h3>
                  <p className="text-xs text-slate-500">
                    {monthName} {year} Dönemi • {activeGroup.payDayText} • Toplam {activeGroup.list.length} Personel
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Arama ve KPI Bar */}
            <div className="p-4 bg-slate-50/40 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Personel veya unvan ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
                <span className="font-bold text-slate-700">
                  Toplam: <strong className="font-mono text-slate-900">{formatCurrency(activeGroup.total)}</strong>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                  {activeGroup.paidCount} Ödendi
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                  {activeGroup.list.length - activeGroup.paidCount} Bekliyor
                </span>
              </div>
            </div>

            {/* Personel Listesi */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
              {filteredStaffList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Aramanıza uygun personel bulunamadı.
                </div>
              ) : (
                filteredStaffList.map((staff) => (
                  <div
                    key={staff.id}
                    className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                        {staff.photoUrl ? (
                          <img src={staff.photoUrl} alt={staff.fullName} className="w-full h-full object-cover" />
                        ) : (
                          staff.fullName.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{staff.fullName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                            {staff.title || "Personel"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          {staff.deptName && <span>🏢 {staff.deptName}</span>}
                          {staff.phone && <span>📞 {staff.phone}</span>}
                        </div>
                        {staff.iban && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-slate-500">
                            <CreditCard className="w-3 h-3 text-slate-400" />
                            <span>{staff.iban}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyIban(staff.id, staff.iban!)}
                              className="text-slate-400 hover:text-teal-700 p-0.5"
                              title="IBAN Kopyala"
                            >
                              {copiedId === staff.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0">
                      <span className="font-mono font-extrabold text-slate-900 text-sm">
                        {formatCurrency(staff.amount)}
                      </span>
                      {staff.isPaid ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Ödendi</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" />
                          <span>Ödeme Bekliyor</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Detaylı bordro hesaplamaları ve banka talimatları için ödeme modülünü ziyaret edin.
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href="/odeme"
                  className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold transition-all shadow-xs"
                >
                  Ödemeleri Aç
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedGroup(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold transition-all"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
