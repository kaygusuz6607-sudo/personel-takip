"use client";

import { useState, useEffect } from "react";
import {
  CalendarCheck,
  Plus,
  Palmtree,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Trash2,
  X,
  AlertCircle,
  Award,
} from "lucide-react";

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
  annualEntitled: number;
  annualUsed: number;
  annualRemaining: number;
  holidayCompensationDays: number;
  totalAvailableDays: number;
}

export default function IzinPage() {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [summaries, setSummaries] = useState<StaffSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
      if (data.staffSummaries) setSummaries(data.staffSummaries);
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
      fetchData();
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
      if (res.ok) fetchData();
    } catch (err) {
      alert("Silinemedi");
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    switch (type) {
      case "HOLIDAY_COMPENSATION":
        return {
          label: "Resmi Tatil 1'e 1 Telafi İzni",
          className: "bg-amber-50 text-amber-800 border-amber-300",
        };
      case "ANNUAL":
        return {
          label: "Yıllık İzin",
          className: "bg-teal-50 text-teal-800 border-teal-300",
        };
      case "SICK":
        return {
          label: "Rapor (Hastalık)",
          className: "bg-rose-50 text-rose-800 border-rose-300",
        };
      case "EXCUSE":
        return {
          label: "Mazeret İzni",
          className: "bg-blue-50 text-blue-800 border-blue-300",
        };
      default:
        return {
          label: "Ücretsiz İzin",
          className: "bg-slate-100 text-slate-800 border-slate-300",
        };
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">İzin Girişi & Takip</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Yıllık izinler, raporlar ve <strong>Resmi Tatil 1&apos;e 1 Telafi İzinleri</strong> havuzu
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

      {/* Personel İzin & Telafi Bakiyesi Tablosu */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-teal-700" />
            <h2 className="font-bold text-slate-800 text-sm">Personel İzin & Telafi Bakiyeleri</h2>
          </div>
          <span className="text-xs text-slate-400">
            Resmi tatil çalışmaları otomatik telafi bakiyesine yansır
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Personel Adı</th>
                <th className="py-3 px-3 text-center">Hak Edilen Yıllık İzin</th>
                <th className="py-3 px-3 text-center">Kullanılan Yıllık İzin</th>
                <th className="py-3 px-3 text-center">Kalan Yıllık İzin</th>
                <th className="py-3 px-3 text-center bg-amber-50/60 text-amber-900">
                  Resmi Tatil 1&apos;e 1 Telafi İzni
                </th>
                <th className="py-3 px-4 text-right font-bold text-teal-900">
                  Toplam Kullanılabilir İzin
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summaries.map((s) => (
                <tr key={s.staffId} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-bold text-slate-800 text-sm">{s.fullName}</td>
                  <td className="py-3 px-3 text-center text-slate-600 font-medium">{s.annualEntitled} gün</td>
                  <td className="py-3 px-3 text-center text-rose-600 font-medium">{s.annualUsed} gün</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">{s.annualRemaining} gün</td>
                  <td className="py-3 px-3 text-center bg-amber-50/40">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      +{s.holidayCompensationDays} gün
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-teal-800 text-sm">
                    {s.totalAvailableDays} gün
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* İzin Geçmişi Tablosu */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-sm">Kayıtlı İzinler & Telafi Kullanımları</h2>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400">Yükleniyor...</div>
        ) : leaves.length === 0 ? (
          <div className="p-10 text-center text-slate-400">Henüz izin kaydı girilmemiş.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Personel</th>
                  <th className="py-3 px-4">İzin Türü</th>
                  <th className="py-3 px-4">Tarih Aralığı</th>
                  <th className="py-3 px-3 text-center">Gün</th>
                  <th className="py-3 px-4">Açıklama</th>
                  <th className="py-3 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((l) => {
                  const badge = getLeaveTypeBadge(l.leaveType);
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-800">{l.staff.fullName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {l.startDate.split("T")[0]} ➔ {l.endDate.split("T")[0]}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {l.daysCount} gün
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {l.description || "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(l.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Sil"
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

      {/* İzin Ekleme Modalı */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Yeni İzin / Telafi Kaydı</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
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
                  <option value="HOLIDAY_COMPENSATION">
                    Resmi Tatil 1&apos;e 1 Telafi İzni (+1 Gün Hak)
                  </option>
                  <option value="ANNUAL">Yıllık İzin (Hakedişten Düşer)</option>
                  <option value="SICK">Rapor / Sağlık İzni</option>
                  <option value="EXCUSE">Mazeret İzni</option>
                  <option value="UNPAID">Ücretsiz İzin</option>
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
                  placeholder="Örn: 29 Ekim Cumhuriyet Bayramı çalışması telafisi"
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
