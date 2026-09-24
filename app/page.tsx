import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, UserCheck, UserX, Clock, Building2, UserPlus, ArrowRight, Wallet, CheckCircle2, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const totalStaff = await prisma.staff.count();
  const activeStaff = await prisma.staff.count({ where: { status: "ACTIVE" } });
  const passiveStaff = await prisma.staff.count({ where: { status: "PASSIVE" } });
  const onLeaveStaff = await prisma.staff.count({ where: { status: "ON_LEAVE" } });

  const departments = await prisma.department.findMany({
    include: {
      _count: {
        select: { staffs: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const recentStaff = await prisma.staff.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      departments: { include: { department: true } },
      salaryConfig: true,
    },
  });

  // Son bordro verileri (dinamik)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];
  let activeYear = currentYear;
  let activeMonth = currentMonth;

  let latestPayrolls = await prisma.payroll.findMany({
    where: { year: activeYear, month: activeMonth },
  });

  if (latestPayrolls.length === 0) {
    const latestOne = await prisma.payroll.findFirst({
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    if (latestOne) {
      activeYear = latestOne.year;
      activeMonth = latestOne.month;
      latestPayrolls = await prisma.payroll.findMany({
        where: { year: activeYear, month: activeMonth },
      });
    }
  }

  const grossTotal = latestPayrolls.reduce((sum, p) => sum + p.grossTotal, 0);
  const totalSpecialDeductions = latestPayrolls.reduce((sum, p) => sum + (p.deductionAmount || 0), 0);
  const netTotal = latestPayrolls.reduce((sum, p) => sum + p.netTotal, 0);
  const paidCount = latestPayrolls.filter((p) => p.isPaid).length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(val);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gösterge Paneli</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kurumunuzun personel ve ödeme özeti</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/personeller"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Yeni Personel</span>
          </Link>
          <Link
            href="/odeme"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg shadow-xs transition-all"
          >
            <Wallet className="w-4 h-4 text-teal-600" />
            <span>Ödemeleri Gör</span>
          </Link>
        </div>
      </div>

      {/* 4 Ana Sayaç Kartı (Fotoğraftaki tasarımın birebir aynısı) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 tracking-wide">Toplam Personel</p>
            <p className="text-3xl font-extrabold text-slate-800 mt-1">{totalStaff}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 tracking-wide">Aktif</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">{activeStaff}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 tracking-wide">Pasif</p>
            <p className="text-3xl font-extrabold text-rose-500 mt-1">{passiveStaff}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 tracking-wide">İzinli</p>
            <p className="text-3xl font-extrabold text-amber-500 mt-1">{onLeaveStaff}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Edutime Özet Finans Kartı */}
      <div className="bg-gradient-to-r from-teal-800 to-slate-900 rounded-2xl text-white p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-teal-700/60 pb-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-300">
              {monthNames[activeMonth - 1]} {activeYear} Bordro Durumu
            </span>
            <h2 className="text-xl font-bold mt-0.5">Maaş & Ödeme Özeti</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-medium rounded-full border border-emerald-400/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {paidCount} Ödendi
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-medium rounded-full border border-amber-400/30">
              <AlertCircle className="w-3.5 h-3.5" />
              {latestPayrolls.length - paidCount} Bekliyor
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
          <div>
            <p className="text-xs text-teal-200">Brüt Toplam</p>
            <p className="text-2xl font-bold text-white mt-1">{formatCurrency(grossTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-rose-300">Personel Özel Kesintileri</p>
            <p className="text-2xl font-bold text-rose-300 mt-1">- {formatCurrency(totalSpecialDeductions)}</p>
          </div>
          <div>
            <p className="text-xs text-emerald-300">Net Ödeme Tutarı</p>
            <p className="text-2xl font-extrabold text-emerald-300 mt-1">{formatCurrency(netTotal)}</p>
          </div>
        </div>
      </div>

      {/* Alt Izgara: Departman Dağılımı + Son Eklenen Personeller */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departman Dağılımı (Ekran görüntüsündeki sol kutu) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Building2 className="w-5 h-5 text-teal-700" />
              <h2>Departman Dağılımı</h2>
            </div>
            <Link href="/departmanlar" className="text-xs text-teal-700 hover:underline font-medium">
              Yönet
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {departments.length === 0 ? (
              <p className="text-sm text-slate-400 py-3">Henüz departman tanımlanmamış.</p>
            ) : (
              departments.map((dept) => (
                <div key={dept.id} className="py-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">{dept.name}</span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    {dept._count.staffs} kişi
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Son Eklenen Personeller (Ekran görüntüsündeki sağ kutu) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Users className="w-5 h-5 text-teal-700" />
              <h2>Personeller</h2>
            </div>
            <Link href="/personeller" className="text-xs text-teal-700 hover:underline font-medium flex items-center gap-1">
              Tümünü Gör <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentStaff.length === 0 ? (
              <p className="text-sm text-slate-400 py-3">Henüz personel eklenmemiş.</p>
            ) : (
              recentStaff.map((staff) => (
                <Link
                  key={staff.id}
                  href={`/personeller/${staff.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                      {staff.fullName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-teal-800 transition-colors">
                        {staff.fullName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {staff.title || staff.departments[0]?.department?.name || "Personel"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-teal-700 block">
                      {staff.salaryConfig?.salaryType === "HOURLY"
                        ? `${staff.salaryConfig.hourlyRate} TL/saat`
                        : staff.salaryConfig?.salaryType === "DAILY"
                        ? `${staff.salaryConfig.dailyRate} TL/gün`
                        : `${formatCurrency(staff.salaryConfig?.monthlySalary || 0)}`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {staff.salaryConfig?.salaryType === "MONTHLY"
                        ? "Aylık Maaş"
                        : staff.salaryConfig?.salaryType === "HOURLY"
                        ? "Ders Saatli"
                        : staff.salaryConfig?.salaryType === "DAILY"
                        ? "Günlük"
                        : "Karma"}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
