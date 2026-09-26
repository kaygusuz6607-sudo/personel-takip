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
  Palette,
  Coins,
  AlertCircle,
} from "lucide-react";

export interface SalaryStaffItem {
  id: string;
  fullName: string;
  title: string;
  deptName: string;
  amount: number; // Net Ödenecek (tahakkuku yapılan) veya Tahmini Tutar
  isPaid: boolean;
  hasPayroll: boolean; // Tahakkuku yapıldı mı?
  salaryType?: string;
  hourlyRate?: number;
  monthlySalary?: number;
  lessonHours?: number;
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
  branchTeachers: SalaryStaffItem[];
  staffs: SalaryStaffItem[];
  admins: SalaryStaffItem[];
}

export function DashboardSalarySchedule({
  monthName,
  year,
  teachers,
  branchTeachers,
  staffs,
  admins,
}: DashboardSalaryScheduleProps) {
  const [selectedGroup, setSelectedGroup] = useState<"TEACHER" | "BRANCH" | "STAFF" | "ADMIN" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPayrollStatus, setFilterPayrollStatus] = useState<"ALL" | "SAVED" | "PENDING">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(val);
  };

  // Grup istatistik hesaplayıcı
  const getGroupStats = (list: SalaryStaffItem[]) => {
    const savedList = list.filter((s) => s.hasPayroll);
    const pendingList = list.filter((s) => !s.hasPayroll);
    const savedTotal = savedList.reduce((sum, s) => sum + s.amount, 0);
    const pendingTotal = pendingList.reduce((sum, s) => sum + s.amount, 0);
    const total = savedTotal + pendingTotal;
    const paidCount = list.filter((s) => s.isPaid).length;
    return {
      total,
      savedTotal,
      pendingTotal,
      savedCount: savedList.length,
      pendingCount: pendingList.length,
      paidCount,
      list,
    };
  };

  const teacherStats = getGroupStats(teachers);
  const branchStats = getGroupStats(branchTeachers);
  const staffStats = getGroupStats(staffs);
  const adminStats = getGroupStats(admins);

  // Modaldaki aktif liste
  const getActiveGroupData = () => {
    if (selectedGroup === "TEACHER") {
      return {
        title: "Öğretmen Kadrosu Maaş Detayları",
        day: "10",
        payDayText: "Her Ayın 10'u",
        colorClass: "teal",
        icon: GraduationCap,
        stats: teacherStats,
      };
    }
    if (selectedGroup === "BRANCH") {
      return {
        title: "Branş Öğretmenleri Maaş Detayları",
        day: "15",
        payDayText: "Her Ayın 15'i",
        colorClass: "amber",
        icon: Palette,
        stats: branchStats,
      };
    }
    if (selectedGroup === "STAFF") {
      return {
        title: "Personel & Destek Kadrosu Maaş Detayları",
        day: "15",
        payDayText: "Her Ayın 15'i",
        colorClass: "blue",
        icon: Users,
        stats: staffStats,
      };
    }
    if (selectedGroup === "ADMIN") {
      return {
        title: "İdari Personel & Yönetim Kadrosu Maaş Detayları",
        day: "20",
        payDayText: "Her Ayın 20'si",
        colorClass: "purple",
        icon: Briefcase,
        stats: adminStats,
      };
    }
    return null;
  };

  const activeGroup = getActiveGroupData();

  const filteredStaffList = activeGroup
    ? activeGroup.stats.list.filter((s) => {
        // Durum filtresi (Tahakkuku Yapılan / Bekleyen)
        if (filterPayrollStatus === "SAVED" && !s.hasPayroll) return false;
        if (filterPayrollStatus === "PENDING" && s.hasPayroll) return false;

        // Arama filtresi
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          s.fullName.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q) ||
          s.deptName.toLowerCase().includes(q)
        );
      })
    : [];

  const handleCopyIban = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Başlık ve Vade Bilgisi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span>📅 {monthName} {year} Maaş Ödeme Takvimi</span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            10&apos;u • 15&apos;i • 20&apos;si Vade Grupları
          </span>
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 font-medium">Detay ve personeller için kartlara tıklayın</span>
          <Link href="/maas" className="text-xs text-teal-700 hover:underline font-semibold flex items-center gap-1">
            Maaş Tahakkuk →
          </Link>
        </div>
      </div>

      {/* 4 AYRI MAAŞ KARTI (10'u Öğretmen, 15'i Branş Öğretmenleri, 15'i Destek Personel, 20'si İdari) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. ÖĞRETMENLER (Ayın 10'u) */}
        <div
          onClick={() => {
            setSelectedGroup("TEACHER");
            setFilterPayrollStatus("ALL");
            setSearchQuery("");
          }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-teal-200/90 shadow-xs relative overflow-hidden bg-gradient-to-br from-white to-teal-50/40 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
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

            <div className="pt-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium">Toplam Tutar</span>
                  <p className="text-lg font-extrabold text-slate-900">{formatCurrency(teacherStats.total)}</p>
                </div>
                <div className="text-right text-[10px]">
                  <span className="text-emerald-700 font-bold block">{teacherStats.paidCount} Ödendi</span>
                  <span className="text-amber-700 font-semibold block">{teachers.length - teacherStats.paidCount} Bekliyor</span>
                </div>
              </div>

              {/* Tahakkuk / Tahmini Kırılımı */}
              <div className="mt-2.5 pt-2 border-t border-slate-100/80 space-y-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Net Kesinleşen ({teacherStats.savedCount}):
                  </span>
                  <span className="font-bold text-slate-700 font-mono">{formatCurrency(teacherStats.savedTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Tahmini ({teacherStats.pendingCount}):
                  </span>
                  <span className="font-medium text-amber-800 font-mono">{formatCurrency(teacherStats.pendingTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-teal-100/60 flex items-center justify-between text-[11px] text-teal-700 font-semibold">
            <span>Listeyi İncele</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 2. BRANŞ ÖĞRETMENLERİ (Ayın 15'i - Ayrı Sekme/Kart) */}
        <div
          onClick={() => {
            setSelectedGroup("BRANCH");
            setFilterPayrollStatus("ALL");
            setSearchQuery("");
          }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-300 shadow-xs relative overflow-hidden bg-gradient-to-br from-white to-amber-50/50 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex flex-col items-center justify-center font-extrabold text-xs shadow-2xs group-hover:scale-105 transition-transform">
                  <span>15</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-800 transition-colors">
                    Branş Öğretmenleri
                  </h3>
                  <span className="text-[11px] text-amber-700 font-bold">Her Ayın 15&apos;i</span>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                {branchTeachers.length} Branş
              </span>
            </div>

            <div className="pt-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium">Toplam Tutar</span>
                  <p className="text-lg font-extrabold text-slate-900">{formatCurrency(branchStats.total)}</p>
                </div>
                <div className="text-right text-[10px]">
                  <span className="text-emerald-700 font-bold block">{branchStats.paidCount} Ödendi</span>
                  <span className="text-amber-700 font-semibold block">{branchTeachers.length - branchStats.paidCount} Bekliyor</span>
                </div>
              </div>

              {/* Tahakkuk / Tahmini Kırılımı */}
              <div className="mt-2.5 pt-2 border-t border-slate-100/80 space-y-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Net Kesinleşen ({branchStats.savedCount}):
                  </span>
                  <span className="font-bold text-slate-700 font-mono">{formatCurrency(branchStats.savedTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Tahmini ({branchStats.pendingCount}):
                  </span>
                  <span className="font-medium text-amber-800 font-mono">{formatCurrency(branchStats.pendingTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-amber-100/60 flex items-center justify-between text-[11px] text-amber-800 font-semibold">
            <span>Listeyi İncele</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 3. DESTEK PERSONELİ (Ayın 15'i) */}
        <div
          onClick={() => {
            setSelectedGroup("STAFF");
            setFilterPayrollStatus("ALL");
            setSearchQuery("");
          }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-200/90 shadow-xs relative overflow-hidden bg-gradient-to-br from-white to-blue-50/40 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
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

            <div className="pt-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium">Toplam Tutar</span>
                  <p className="text-lg font-extrabold text-slate-900">{formatCurrency(staffStats.total)}</p>
                </div>
                <div className="text-right text-[10px]">
                  <span className="text-emerald-700 font-bold block">{staffStats.paidCount} Ödendi</span>
                  <span className="text-amber-700 font-semibold block">{staffs.length - staffStats.paidCount} Bekliyor</span>
                </div>
              </div>

              {/* Tahakkuk / Tahmini Kırılımı */}
              <div className="mt-2.5 pt-2 border-t border-slate-100/80 space-y-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Net Kesinleşen ({staffStats.savedCount}):
                  </span>
                  <span className="font-bold text-slate-700 font-mono">{formatCurrency(staffStats.savedTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Tahmini ({staffStats.pendingCount}):
                  </span>
                  <span className="font-medium text-amber-800 font-mono">{formatCurrency(staffStats.pendingTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-blue-100/60 flex items-center justify-between text-[11px] text-blue-700 font-semibold">
            <span>Listeyi İncele</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 4. İDARİ PERSONEL (Ayın 20'si) */}
        <div
          onClick={() => {
            setSelectedGroup("ADMIN");
            setFilterPayrollStatus("ALL");
            setSearchQuery("");
          }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-200/90 shadow-xs relative overflow-hidden bg-gradient-to-br from-white to-purple-50/40 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
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

            <div className="pt-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium">Toplam Tutar</span>
                  <p className="text-lg font-extrabold text-slate-900">{formatCurrency(adminStats.total)}</p>
                </div>
                <div className="text-right text-[10px]">
                  <span className="text-emerald-700 font-bold block">{adminStats.paidCount} Ödendi</span>
                  <span className="text-amber-700 font-semibold block">{admins.length - adminStats.paidCount} Bekliyor</span>
                </div>
              </div>

              {/* Tahakkuk / Tahmini Kırılımı */}
              <div className="mt-2.5 pt-2 border-t border-slate-100/80 space-y-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Net Kesinleşen ({adminStats.savedCount}):
                  </span>
                  <span className="font-bold text-slate-700 font-mono">{formatCurrency(adminStats.savedTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Tahmini ({adminStats.pendingCount}):
                  </span>
                  <span className="font-medium text-amber-800 font-mono">{formatCurrency(adminStats.pendingTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-purple-100/60 flex items-center justify-between text-[11px] text-purple-700 font-semibold">
            <span>Listeyi İncele</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* DETAY MODALI (Tıklanınca Açılan İnteraktif Pencere) */}
      {activeGroup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl text-white flex flex-col items-center justify-center font-extrabold text-xs shadow-xs ${
                    selectedGroup === "TEACHER"
                      ? "bg-teal-700"
                      : selectedGroup === "BRANCH"
                      ? "bg-amber-600"
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
                    {monthName} {year} Dönemi • {activeGroup.payDayText} • Toplam {activeGroup.stats.list.length} Personel
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

            {/* Finansal Özet Kartları (Net Ödenecek / Tahmini Ödeme / Toplam) */}
            <div className="p-4 bg-slate-50/60 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Genel Toplam */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Toplam Ödeme Tutarı</span>
                  <Coins className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-lg font-extrabold text-slate-900 mt-1">{formatCurrency(activeGroup.stats.total)}</p>
                <span className="text-[10px] text-slate-400">
                  {activeGroup.stats.list.length} personelin genel toplamı
                </span>
              </div>

              {/* 2. Tahakkuku Yapılanlar (Net Ödenecek) */}
              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Net Ödenecek Maaş
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                    {activeGroup.stats.savedCount} Kişi
                  </span>
                </div>
                <p className="text-lg font-extrabold text-emerald-800 mt-1 font-mono">
                  {formatCurrency(activeGroup.stats.savedTotal)}
                </p>
                <span className="text-[10px] text-emerald-700">Tahakkuku onaylanmış kesin tutar</span>
              </div>

              {/* 3. Tahakkuku Yapılmayanlar (Tahmini Ödeme) */}
              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Tahmini Ödeme
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                    {activeGroup.stats.pendingCount} Kişi
                  </span>
                </div>
                <p className="text-lg font-extrabold text-amber-800 mt-1 font-mono">
                  {formatCurrency(activeGroup.stats.pendingTotal)}
                </p>
                <span className="text-[10px] text-amber-700">Tahakkuku henüz yapılmamış bekleyen</span>
              </div>
            </div>

            {/* Arama ve Sekmeler */}
            <div className="p-3 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Sekmeler: Tümü / Tahakkuku Yapılanlar / Tahmini */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setFilterPayrollStatus("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterPayrollStatus === "ALL"
                      ? "bg-slate-800 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Tümü ({activeGroup.stats.list.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPayrollStatus("SAVED")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    filterPayrollStatus === "SAVED"
                      ? "bg-emerald-700 text-white shadow-2xs"
                      : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Tahakkuku Yapılanlar ({activeGroup.stats.savedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPayrollStatus("PENDING")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    filterPayrollStatus === "PENDING"
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  Tahmini Ödeme ({activeGroup.stats.pendingCount})
                </button>
              </div>

              {/* Arama Inputu */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Personel veya branş ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Personel Listesi */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
              {filteredStaffList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Aramanıza veya seçilen filtreye uygun personel bulunamadı.
                </div>
              ) : (
                filteredStaffList.map((staff) => (
                  <div
                    key={staff.id}
                    className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-200">
                        {staff.photoUrl ? (
                          <img src={staff.photoUrl} alt={staff.fullName} className="w-full h-full object-cover" />
                        ) : (
                          staff.fullName.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs">{staff.fullName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                            {staff.title || "Personel"}
                          </span>

                          {/* Tahakkuk Yapıldı / Tahmini Rozeti */}
                          {staff.hasPayroll ? (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                              Tahakkuk Yapıldı
                            </span>
                          ) : (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5 text-amber-700" />
                              Tahmini Ödeme
                            </span>
                          )}
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

                    <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900 block font-mono">
                          {formatCurrency(staff.amount)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {staff.hasPayroll ? "Net Kesin Tutar" : "Tahmini Tutar"}
                        </span>
                      </div>

                      <div className="shrink-0">
                        {staff.isPaid ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Ödendi
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Bekliyor
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-500">
                Seçili Grupta: <strong>{activeGroup.stats.savedCount}</strong> Tahakkuku Yapılan,{" "}
                <strong>{activeGroup.stats.pendingCount}</strong> Tahmini Ödeme
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href="/maas"
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition-colors"
                >
                  Maaş Tahakkuka Git
                </Link>
                <Link
                  href="/odeme"
                  className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold transition-colors"
                >
                  Ödemeleri Yönet
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
