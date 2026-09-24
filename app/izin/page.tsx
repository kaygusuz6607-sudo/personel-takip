"use client";

import { useState, useEffect, Fragment } from "react";
import {
  CalendarCheck,
  Plus,
  Palmtree,
  Clock,
  CheckCircle2,
  Trash2,
  X,
  AlertCircle,
  Award,
  User,
  Briefcase,
  Eye,
  Search,
  Filter,
  FileText,
  Calendar,
  Sparkles,
  ShieldCheck,
  Activity,
  HeartPulse,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronRight,
  ChevronUp,
} from "lucide-react";

interface StaffLeaveItem {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  description: string | null;
  status: string;
  createdAt?: string;
}

interface LeaveRecord {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  description: string | null;
  status: string;
  staff: {
    id: string;
    fullName: string;
    tcNo: string;
    title: string | null;
  };
}

interface StaffSummary {
  staffId: string;
  fullName: string;
  tcNo: string;
  title: string;
  hireDate: string | null;
  departments: string[];
  seniorityText: string;
  completedYears?: number;
  annualRate: number;
  annualEntitled: number;
  annualUsed: number;
  annualRemaining: number;
  holidayCompensationDays: number;
  totalAvailableDays: number;
  sickUsed: number;
  excuseUsed: number;
  unpaidUsed: number;
  totalUsedAllLeaves: number;
  leaves: StaffLeaveItem[];
}

export default function IzinPage() {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [summaries, setSummaries] = useState<StaffSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Personel Detay Modalı & Akordeon State'leri
  const [selectedStaff, setSelectedStaff] = useState<StaffSummary | null>(null);
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);
  const [staffSearch, setStaffSearch] = useState<string>("");
  const [detailFilterType, setDetailFilterType] = useState<string>("ALL");
  const [detailSearchTerm, setDetailSearchTerm] = useState<string>("");

  const [form, setForm] = useState({
    staffId: "",
    leaveType: "HOLIDAY_COMPENSATION",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    daysCount: 1,
    description: "",
    status: "APPROVED",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/izin");
      const data = await res.json();
      if (data.leaves) setLeaves(data.leaves);
      if (data.staffSummaries) {
        setSummaries(data.staffSummaries);
        // Eğer detay modalı açıksa, o personelin güncel verisini de güncelle
        setSelectedStaff((prev) => {
          if (!prev) return null;
          return data.staffSummaries.find((s: StaffSummary) => s.staffId === prev.staffId) || prev;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/izin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "İzin kaydedilemedi");

      setModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu izin kaydını silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/izin?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      alert("Silinemedi");
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    switch (type) {
      case "HOLIDAY_COMPENSATION":
        return {
          label: "Resmi Tatil Telafisi (1'e 1)",
          shortLabel: "Tatil Telafisi",
          className: "bg-amber-50 text-amber-900 border-amber-300",
          icon: "🎁",
        };
      case "ANNUAL":
        return {
          label: "Yıllık İzin",
          shortLabel: "Yıllık İzin",
          className: "bg-teal-50 text-teal-800 border-teal-300",
          icon: "🏖️",
        };
      case "SICK":
        return {
          label: "Rapor (Hastalık)",
          shortLabel: "Rapor",
          className: "bg-rose-50 text-rose-800 border-rose-300",
          icon: "🩺",
        };
      case "EXCUSE":
        return {
          label: "Mazeret İzni",
          shortLabel: "Mazeret",
          className: "bg-blue-50 text-blue-800 border-blue-300",
          icon: "📄",
        };
      default:
        return {
          label: "Ücretsiz İzin",
          shortLabel: "Ücretsiz",
          className: "bg-slate-100 text-slate-800 border-slate-300",
          icon: "🛑",
        };
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Detay modalında filtrelenmiş izinler
  const filteredStaffLeaves = selectedStaff
    ? selectedStaff.leaves.filter((l) => {
        const matchesType = detailFilterType === "ALL" || l.leaveType === detailFilterType;
        const matchesSearch =
          !detailSearchTerm ||
          (l.description && l.description.toLowerCase().includes(detailSearchTerm.toLowerCase())) ||
          l.startDate.includes(detailSearchTerm) ||
          l.endDate.includes(detailSearchTerm);
        return matchesType && matchesSearch;
      })
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">İzin Yönetimi & Personel Takip</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Personel üzerine tıklayarak <strong>hak ettiği, kullandığı, kalan tüm izinleri ve geçmiş kayıtları</strong> ayrıntılı inceleyebilirsiniz.
          </p>
        </div>

        <button
          onClick={() => {
            if (summaries.length > 0) {
              setForm((f) => ({ ...f, staffId: summaries[0].staffId }));
            }
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni İzin / Telafi Ekle</span>
        </button>
      </div>

      {/* Personel İzin & Telafi Bakiyesi Tablosu (Personel Bazlı Gruplanmış & Genişletilebilir) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-teal-700" />
            <h2 className="font-bold text-slate-800 text-sm">Personel İzin & Telafi Listesi</h2>
            <span className="text-xs font-semibold px-2 py-0.5 bg-teal-100 text-teal-900 rounded-full">
              {summaries.length} Personel
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                placeholder="Personel ara (örn: Akif, Muhammed Ali)..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
            <span className="text-xs text-slate-500 hidden md:inline-flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-teal-600" />
              İzin geçmişini görmek için personele tıklayın
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Personel (Tıklayınız)</th>
                <th className="py-3 px-3 text-center">Kıdem</th>
                <th className="py-3 px-3 text-center">Hak Ettiği Yıllık</th>
                <th className="py-3 px-3 text-center">Kullandığı İzin</th>
                <th className="py-3 px-3 text-center">Kullanmadığı (Kalan)</th>
                <th className="py-3 px-3 text-center bg-amber-50/70 text-amber-900">
                  Resmi Tatil Telafisi
                </th>
                <th className="py-3 px-4 text-right font-bold text-teal-900">
                  Toplam Kullanılabilir
                </th>
                <th className="py-3 px-3 text-center">İzin Kayıtları</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    İzin bakiyeleri yükleniyor...
                  </td>
                </tr>
              ) : summaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Aktif personel bulunamadı.
                  </td>
                </tr>
              ) : (
                summaries
                  .filter((s) => {
                    if (!staffSearch.trim()) return true;
                    const q = staffSearch.toLowerCase();
                    return (
                      s.fullName.toLowerCase().includes(q) ||
                      s.tcNo.includes(q) ||
                      (s.title && s.title.toLowerCase().includes(q))
                    );
                  })
                  .map((s) => {
                    const isExpanded = expandedStaffId === s.staffId;
                    return (
                      <Fragment key={s.staffId}>
                        {/* Personel Satırı (Her personel listede TEK KEZ yer alır) */}
                        <tr
                          onClick={() => setExpandedStaffId(isExpanded ? null : s.staffId)}
                          className={`hover:bg-teal-50/50 cursor-pointer transition-colors group ${
                            isExpanded ? "bg-teal-50/40 border-l-4 border-l-teal-600" : ""
                          }`}
                          title="İzin geçmişini açmak / kapatmak için tıklayınız"
                        >
                          {/* Personel Adı */}
                          <td className="py-3 px-4 min-w-[210px]">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                className="p-1 rounded-md text-slate-400 group-hover:text-teal-700 transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-teal-700" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-slate-400" />
                                )}
                              </button>
                              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs group-hover:bg-teal-700 group-hover:text-white transition-colors shrink-0">
                                {s.fullName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm group-hover:text-teal-800 transition-colors">
                                  {s.fullName}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {s.title || (s.departments && s.departments[0]) || "Personel"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Kıdem */}
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                              <Briefcase className="w-3 h-3 text-slate-400" />
                              {s.seniorityText}
                            </span>
                          </td>

                          {/* Hak Edilen */}
                          <td className="py-3 px-3 text-center">
                            <span className="font-semibold text-slate-800">{s.annualEntitled} gün</span>
                            <span className="block text-[10px] text-teal-700 font-medium">
                              {s.completedYears && s.completedYears > 0
                                ? `${s.completedYears} yıl x ${s.annualRate} gün`
                                : "1 yıl dolmadı (0 gün)"}
                            </span>
                          </td>

                          {/* Kullanılan */}
                          <td className="py-3 px-3 text-center">
                            <span className="font-semibold text-rose-600">{s.annualUsed} gün</span>
                            {s.totalUsedAllLeaves > s.annualUsed && (
                              <span className="block text-[10px] text-slate-400" title="Rapor ve mazeret dahil tüm izinler">
                                (Toplam: {s.totalUsedAllLeaves} gün)
                              </span>
                            )}
                          </td>

                          {/* Kalan (Kullanmadığı) */}
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              {s.annualRemaining} gün
                            </span>
                          </td>

                          {/* Resmi Tatil Telafisi */}
                          <td className="py-3 px-3 text-center bg-amber-50/40">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300">
                              +{s.holidayCompensationDays} gün
                            </span>
                          </td>

                          {/* Toplam Kullanılabilir */}
                          <td className="py-3 px-4 text-right">
                            <span className="font-extrabold text-teal-800 text-sm block">
                              {s.totalAvailableDays} gün
                            </span>
                            <span className="text-[10px] text-slate-400">kullanıma hazır</span>
                          </td>

                          {/* İncele & Genişlet Butonları */}
                          <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setExpandedStaffId(isExpanded ? null : s.staffId)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                                  isExpanded
                                    ? "bg-teal-700 text-white"
                                    : "bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200"
                                }`}
                              >
                                <span>{isExpanded ? "Kapat" : `İzinler (${s.leaves.length})`}</span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStaff(s);
                                  setDetailFilterType("ALL");
                                  setDetailSearchTerm("");
                                }}
                                className="p-1 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                                title="Tam Ekran İzin Kartını Aç"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Genişletilmiş İzin Hareketleri (Personelin üzerine tıklandığında açılan liste) */}
                        {isExpanded && (
                          <tr className="bg-slate-50/90 border-b-2 border-teal-600/30">
                            <td colSpan={8} className="p-4 sm:p-5">
                              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <CalendarCheck className="w-4 h-4 text-teal-700" />
                                    <h3 className="font-bold text-slate-900 text-sm">
                                      {s.fullName} — Kayıtlı İzin Hareketleri
                                    </h3>
                                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-teal-100 text-teal-900">
                                      {s.leaves.length} Kayıt
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setForm((f) => ({ ...f, staffId: s.staffId }));
                                        setModalOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>+ Bu Personele İzin Ekle</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedStaff(s);
                                        setDetailFilterType("ALL");
                                        setDetailSearchTerm("");
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Tam Detay Raporu</span>
                                    </button>
                                  </div>
                                </div>

                                {s.leaves.length === 0 ? (
                                  <div className="py-6 text-center text-slate-400 text-xs">
                                    Bu personele ait henüz kayıtlı izin hareketi bulunmuyor.
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                      <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                                          <th className="py-2.5 px-3">İzin Türü</th>
                                          <th className="py-2.5 px-3">Tarih Aralığı</th>
                                          <th className="py-2.5 px-3 text-center">Gün</th>
                                          <th className="py-2.5 px-3">Açıklama / Sebep</th>
                                          <th className="py-2.5 px-3 text-center">Durum</th>
                                          <th className="py-2.5 px-3 text-right">İşlem</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {s.leaves.map((l) => {
                                          const badge = getLeaveTypeBadge(l.leaveType);
                                          return (
                                            <tr key={l.id} className="hover:bg-slate-50/60">
                                              <td className="py-2.5 px-3">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.className}`}>
                                                  <span>{badge.icon}</span>
                                                  <span>{badge.label}</span>
                                                </span>
                                              </td>
                                              <td className="py-2.5 px-3 text-slate-700 font-mono text-[11px]">
                                                {formatDate(l.startDate)} ➔ {formatDate(l.endDate)}
                                              </td>
                                              <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                                                {l.daysCount} gün
                                              </td>
                                              <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                                                {l.description || "—"}
                                              </td>
                                              <td className="py-2.5 px-3 text-center">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                  Onaylandı
                                                </span>
                                              </td>
                                              <td className="py-2.5 px-3 text-right">
                                                <button
                                                  type="button"
                                                  onClick={() => handleDelete(l.id)}
                                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                  title="Bu İzin Kaydını Sil"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 🌟 KAPSAMLI PERSONEL İZİN DETAY MODALI (İstenen Tüm Detaylar)   */}
      {/* ============================================================== */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white p-5 sm:p-6 relative">
              <button
                onClick={() => setSelectedStaff(null)}
                className="absolute top-4 right-4 text-teal-200 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border-2 border-teal-400/40 text-teal-200 font-extrabold flex items-center justify-center text-xl shadow-inner">
                  {selectedStaff.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                      {selectedStaff.fullName}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/30 text-teal-200 border border-teal-400/30">
                      {selectedStaff.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap text-xs text-teal-200/90">
                    <span>🆔 TC: {selectedStaff.tcNo}</span>
                    <span>•</span>
                    <span>🏢 {selectedStaff.departments?.join(", ") || "Departman"}</span>
                    <span>•</span>
                    <span>📅 İşe Giriş: {formatDate(selectedStaff.hireDate)}</span>
                    <span>•</span>
                    <span className="bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded font-semibold border border-amber-400/30">
                      ⏳ Kıdem: {selectedStaff.seniorityText}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Gövdesi (Scroll Edilebilir) */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-800">
              {/* 1. Büyük İstatistik Kartları (Hak Ettiği, Kullandığı, Kalan, Telafi, Toplam) */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  İzin Hak Ediş & Bakiye Özeti
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Hak Ettiği Yıllık İzin */}
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-blue-700">
                      <span className="text-xs font-bold">Hak Ettiği Yıllık</span>
                      <Palmtree className="w-4 h-4" />
                    </div>
                    <p className="text-2xl font-extrabold text-blue-900">
                      {selectedStaff.annualEntitled} <span className="text-xs font-normal text-blue-700">gün</span>
                    </p>
                    <p className="text-[11px] text-blue-700/80 font-medium">
                      {selectedStaff.completedYears && selectedStaff.completedYears > 0
                        ? `${selectedStaff.completedYears} yıl x ${selectedStaff.annualRate} gün hakediş`
                        : "1 yıl dolmadı (Hakediş 0 gün)"}
                    </p>
                  </div>

                  {/* Kullandığı Yıllık İzin */}
                  <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-rose-700">
                      <span className="text-xs font-bold">Kullandığı İzin</span>
                      <Clock className="w-4 h-4" />
                    </div>
                    <p className="text-2xl font-extrabold text-rose-900">
                      {selectedStaff.annualUsed} <span className="text-xs font-normal text-rose-700">gün</span>
                    </p>
                    <p className="text-[11px] text-rose-700/80">
                      Yıllık izin kullanımı
                    </p>
                  </div>

                  {/* Kalan (Kullanmadığı) Yıllık İzin */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-emerald-700">
                      <span className="text-xs font-bold">Kullanmadığı (Kalan)</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <p className="text-2xl font-extrabold text-emerald-900">
                      {selectedStaff.annualRemaining} <span className="text-xs font-normal text-emerald-700">gün</span>
                    </p>
                    <p className="text-[11px] text-emerald-700/80">
                      Kullanıma hazır yıllık bakiye
                    </p>
                  </div>

                  {/* Resmi Tatil Telafisi */}
                  <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-amber-800">
                      <span className="text-xs font-bold">Tatil Telafi İzni</span>
                      <Award className="w-4 h-4" />
                    </div>
                    <p className="text-2xl font-extrabold text-amber-950">
                      +{selectedStaff.holidayCompensationDays} <span className="text-xs font-normal text-amber-800">gün</span>
                    </p>
                    <p className="text-[11px] text-amber-800">
                      1&apos;e 1 resmi tatil hakkı
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Toplam Kullanılabilir İzin Vurgu Bandı & İlerleme Çubuğu */}
              <div className="bg-gradient-to-r from-teal-800 to-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
                <div>
                  <div className="flex items-center gap-1.5 text-teal-300 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Toplam Kullanılabilir Net İzin Bakiyesi</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white mt-1">
                    {selectedStaff.totalAvailableDays} <span className="text-sm font-semibold text-teal-200">GÜN İZİN KULLANABİLİR</span>
                  </p>
                  <p className="text-xs text-teal-200/80 mt-0.5">
                    (Kalan Yıllık: {selectedStaff.annualRemaining} gün + Resmi Tatil Telafisi: {selectedStaff.holidayCompensationDays} gün)
                  </p>
                </div>

                <button
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      staffId: selectedStaff.staffId,
                      leaveType: "ANNUAL",
                    }));
                    setModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow transition-all self-start sm:self-center"
                >
                  <Plus className="w-4 h-4" />
                  <span>Bu Personele İzin Ekle</span>
                </button>
              </div>

              {/* 3. Diğer İzin Kullanımları (Rapor, Mazeret vb.) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Diğer İzin Türleri Kullanım Dökümü</span>
                  <span className="text-slate-400">Genel Toplam: {selectedStaff.totalUsedAllLeaves} gün izin kullanıldı</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white border border-slate-200 rounded-lg p-2">
                    <span className="text-slate-500 block text-[11px]">🩺 Sağlık / Rapor</span>
                    <span className="font-bold text-rose-700 text-sm">{selectedStaff.sickUsed} Gün</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-2">
                    <span className="text-slate-500 block text-[11px]">📄 Mazeret İzni</span>
                    <span className="font-bold text-blue-700 text-sm">{selectedStaff.excuseUsed} Gün</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-2">
                    <span className="text-slate-500 block text-[11px]">🛑 Ücretsiz İzin</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedStaff.unpaidUsed} Gün</span>
                  </div>
                </div>
              </div>

              {/* 4. Geçmiş İzin Kayıtları Listesi (Tarihçe ve Her Detay) */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-700" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      Geçmiş Tüm İzin Kayıtları ({selectedStaff.leaves.length})
                    </h3>
                  </div>

                  {/* Arama Inputu */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Açıklama veya tarihte ara..."
                      value={detailSearchTerm}
                      onChange={(e) => setDetailSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 w-full sm:w-56"
                    />
                  </div>
                </div>

                {/* Filtreleme Sekmeleri */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: "ALL", label: `Tümü (${selectedStaff.leaves.length})` },
                    {
                      id: "ANNUAL",
                      label: `Yıllık İzin (${selectedStaff.leaves.filter((l) => l.leaveType === "ANNUAL").length})`,
                    },
                    {
                      id: "HOLIDAY_COMPENSATION",
                      label: `Tatil Telafisi (${selectedStaff.leaves.filter((l) => l.leaveType === "HOLIDAY_COMPENSATION").length})`,
                    },
                    {
                      id: "SICK",
                      label: `Rapor (${selectedStaff.leaves.filter((l) => l.leaveType === "SICK").length})`,
                    },
                    {
                      id: "EXCUSE",
                      label: `Mazeret (${selectedStaff.leaves.filter((l) => l.leaveType === "EXCUSE").length})`,
                    },
                    {
                      id: "UNPAID",
                      label: `Ücretsiz (${selectedStaff.leaves.filter((l) => l.leaveType === "UNPAID").length})`,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setDetailFilterType(tab.id)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                        detailFilterType === tab.id
                          ? "bg-teal-800 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* İzin Geçmişi Tablosu */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  {filteredStaffLeaves.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Bu kriterlere uygun geçmiş izin kaydı bulunamadı.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                          <th className="py-2.5 px-3">İzin Türü</th>
                          <th className="py-2.5 px-3">Tarih Aralığı</th>
                          <th className="py-2.5 px-2 text-center">Süre</th>
                          <th className="py-2.5 px-3">Açıklama / Sebep</th>
                          <th className="py-2.5 px-2 text-center">Durum</th>
                          <th className="py-2.5 px-3 text-right">Sil</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStaffLeaves.map((item) => {
                          const badge = getLeaveTypeBadge(item.leaveType);
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.className}`}
                                >
                                  <span>{badge.icon}</span>
                                  <span>{badge.shortLabel}</span>
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-700 text-[11px]">
                                {formatDate(item.startDate)} ➔ {formatDate(item.endDate)}
                              </td>
                              <td className="py-2.5 px-2 text-center font-bold text-slate-900">
                                {item.daysCount} gün
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                                {item.description || "—"}
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Onaylandı
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={async () => {
                                    await handleDelete(item.id);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                  title="Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Personel İzin Kartı • Güncel Veritabanı
              </span>
              <button
                onClick={() => setSelectedStaff(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 📝 YENİ İZİN / TELAFİ GİRİŞ MODALI                             */}
      {/* ============================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Yeni İzin / Telafi Kaydı</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Personel Seçimi *</label>
                <select
                  required
                  value={form.staffId}
                  onChange={(e) => setForm({ ...form, staffId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="">Seçiniz</option>
                  {summaries.map((s) => (
                    <option key={s.staffId} value={s.staffId}>
                      {s.fullName} (Kalan: {s.totalAvailableDays} gün)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">İzin Türü *</label>
                <select
                  value={form.leaveType}
                  onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="ANNUAL">🏖️ Yıllık İzin (Hakedişten Düşer)</option>
                  <option value="HOLIDAY_COMPENSATION">
                    🎁 Resmi Tatil 1&apos;e 1 Telafi İzni (+1 Gün Hak)
                  </option>
                  <option value="SICK">🩺 Rapor / Sağlık İzni</option>
                  <option value="EXCUSE">📄 Mazeret İzni</option>
                  <option value="UNPAID">🛑 Ücretsiz İzin</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Başlangıç Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Bitiş Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Gün Sayısı *</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={form.daysCount}
                  onChange={(e) => setForm({ ...form, daysCount: parseFloat(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Açıklama / Not</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Örn: Yıllık izin kullanımı veya nöbet telafisi"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-teal-800 text-white rounded-lg font-semibold hover:bg-teal-900 disabled:opacity-50"
                >
                  {submitting ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
