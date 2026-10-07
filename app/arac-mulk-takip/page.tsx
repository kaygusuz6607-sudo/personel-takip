"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Car,
  Building2,
  Plus,
  Search,
  ShieldAlert,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Layers,
  FileText,
  Filter,
} from "lucide-react";

interface AssetTrackingItem {
  id: string;
  title: string;
  assetType: string; // VEHICLE, REAL_ESTATE
  owner: string | null;
  inspectionDate: string | null;
  insuranceDate: string | null;
  kaskoDate: string | null;
  housingDate: string | null;
  notes: string | null;
  inspDays?: number | null;
  insDays?: number | null;
  kaskoDays?: number | null;
  houseDays?: number | null;
  hasWarning?: boolean;
}

function formatSafeDate(dStr: string | null | undefined): string {
  if (!dStr) return "-";
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return String(dStr);
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return String(dStr);
  }
}

export default function AracMulkTakipPage() {
  const [assets, setAssets] = useState<AssetTrackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [warningCount, setWarningCount] = useState(0);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "VEHICLE" | "REAL_ESTATE">("ALL");
  const [onlyWarnings, setOnlyWarnings] = useState(false);

  // Modal Durumu
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetTrackingItem | null>(null);
  const [assetSubmitting, setAssetSubmitting] = useState(false);
  const [assetForm, setAssetForm] = useState({
    title: "",
    assetType: "VEHICLE",
    owner: "",
    inspectionDate: "",
    insuranceDate: "",
    kaskoDate: "",
    housingDate: "",
    notes: "",
  });

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/assets");
      const data = await res.json();
      if (data.assets && Array.isArray(data.assets)) {
        setAssets(data.assets);
      }
      if (typeof data.warningCount === "number") {
        setWarningCount(data.warningCount);
      }
    } catch (e) {
      console.error("Varlıklar alınamadı:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const openNewAssetModal = () => {
    setEditingAsset(null);
    setAssetForm({
      title: "",
      assetType: "VEHICLE",
      owner: "",
      inspectionDate: "",
      insuranceDate: "",
      kaskoDate: "",
      housingDate: "",
      notes: "",
    });
    setAssetModalOpen(true);
  };

  const openEditAssetModal = (item: AssetTrackingItem) => {
    setEditingAsset(item);
    setAssetForm({
      title: item.title,
      assetType: item.assetType || "VEHICLE",
      owner: item.owner || "",
      inspectionDate: item.inspectionDate ? item.inspectionDate.split("T")[0] : "",
      insuranceDate: item.insuranceDate ? item.insuranceDate.split("T")[0] : "",
      kaskoDate: item.kaskoDate ? item.kaskoDate.split("T")[0] : "",
      housingDate: item.housingDate ? item.housingDate.split("T")[0] : "",
      notes: item.notes || "",
    });
    setAssetModalOpen(true);
  };

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAssetSubmitting(true);
      const url = editingAsset ? `/api/assets/${editingAsset.id}` : "/api/assets";
      const method = editingAsset ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assetForm),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Kayıt kaydedilemedi");
        return;
      }

      setAssetModalOpen(false);
      await fetchAssets();
    } catch (e) {
      alert("Hata oluştu");
    } finally {
      setAssetSubmitting(false);
    }
  };

  const handleDeleteAsset = async (id: string, title: string) => {
    if (!confirm(`"${title}" varlık kaydını silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAssets();
      } else {
        alert("Silinemedi");
      }
    } catch (e) {
      alert("Silinemedi");
    }
  };

  // Filtrelenmiş Varlıklar
  const filteredAssets = useMemo(() => {
    return assets.filter((item) => {
      if (typeFilter !== "ALL" && item.assetType !== typeFilter) return false;
      if (onlyWarnings && !item.hasWarning) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesOwner = (item.owner || "").toLowerCase().includes(q);
        const matchesNotes = (item.notes || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesOwner && !matchesNotes) return false;
      }
      return true;
    });
  }, [assets, typeFilter, onlyWarnings, search]);

  const vehicleCount = useMemo(() => assets.filter((a) => a.assetType === "VEHICLE").length, [assets]);
  const realEstateCount = useMemo(() => assets.filter((a) => a.assetType === "REAL_ESTATE").length, [assets]);

  return (
    <div className="min-h-screen bg-slate-50/70 p-3 sm:p-6 space-y-6 animate-in fade-in duration-200">
      {/* 🧭 ÜST BAŞLIK VE HIZLI EYLEMLER */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Araç & Mülk Muayene / Kasko Takibi</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  {assets.length} Kayıtlı Varlık
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Şirket ve bireysel araçların TÜVTÜRK muayeneleri, kasko ve trafik sigortaları; gayrimenkullerin DASK poliçeleri
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={openNewAssetModal}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Araç / Mülk Ekle</span>
          </button>
        </div>
      </div>

      {/* 📊 İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">Toplam Varlık</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{assets.length}</p>
          <span className="text-[10px] text-slate-500 font-medium">Sistemde takip edilen</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">Araç & Servis</span>
            <Car className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{vehicleCount}</p>
          <span className="text-[10px] text-slate-500 font-medium">Muayene / Kasko takipli</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">Bina & Mülk</span>
            <Building2 className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{realEstateCount}</p>
          <span className="text-[10px] text-slate-500 font-medium">DASK poliçe takipli</span>
        </div>

        <div className={`p-3.5 sm:p-4 rounded-2xl border shadow-xs transition-all ${
          warningCount > 0
            ? "bg-rose-50 border-rose-300 text-rose-950"
            : "bg-emerald-50 border-emerald-200 text-emerald-950"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">{warningCount > 0 ? "Acil Hatırlatma" : "Durum"}</span>
            {warningCount > 0 ? (
              <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <p className={`text-xl sm:text-2xl font-black mt-1 ${warningCount > 0 ? "text-rose-600" : "text-emerald-700"}`}>
            {warningCount > 0 ? `${warningCount} Kalem` : "Güvende"}
          </p>
          <span className="text-[10px] font-medium opacity-80">
            {warningCount > 0 ? "10 gün ve altı kalan" : "Tüm poliçeler güncel"}
          </span>
        </div>
      </div>

      {/* ⚠️ 10 GÜN ERKEN UYARI BİLDİRİMİ */}
      {warningCount > 0 && (
        <div className="bg-gradient-to-r from-rose-50 via-rose-100/60 to-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-start sm:items-center justify-between gap-3 text-rose-950 shadow-sm animate-pulse">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <h4 className="font-extrabold text-sm text-rose-950">
                ⚠️ Acil Hatırlatma: Muayene veya Kasko Süresine 10 Günden Az Kalan Varlıklar ({warningCount} Kalem)
              </h4>
              <p className="text-xs text-rose-800 mt-0.5">
                Trafik cezası ve sigortasız kalma riskini önlemek için muayene randevusu alınız ve kasko poliçenizi yenileyiniz.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOnlyWarnings(!onlyWarnings)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all ${
              onlyWarnings
                ? "bg-rose-700 text-white"
                : "bg-white text-rose-900 border border-rose-300 hover:bg-rose-50"
            }`}
          >
            {onlyWarnings ? "Tümünü Göster" : "Sadece Uyarılıları Listele"}
          </button>
        </div>
      )}

      {/* 🔍 ARAMA VE FİLTRE ÇUBUĞU */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Plaka, araç modeli, gayrimenkul veya sahip adı ile ara..."
            className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setTypeFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              typeFilter === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Tümü ({assets.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("VEHICLE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              typeFilter === "VEHICLE"
                ? "bg-amber-500 text-slate-950 font-black"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Araçlar ({vehicleCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("REAL_ESTATE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              typeFilter === "REAL_ESTATE"
                ? "bg-indigo-600 text-white font-black"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Mülkler ({realEstateCount})</span>
          </button>
          {warningCount > 0 && (
            <button
              type="button"
              onClick={() => setOnlyWarnings(!onlyWarnings)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                onlyWarnings
                  ? "bg-rose-600 text-white font-black"
                  : "bg-rose-100 text-rose-900 hover:bg-rose-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Acil Uyarılılar ({warningCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* 🚗 VARLIK KARTLARI IZGARASI */}
      {loading ? (
        <div className="bg-white p-12 text-center text-slate-500 rounded-2xl border border-slate-200">
          Varlık kayıtları yükleniyor...
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200 space-y-3">
          <Car className="w-10 h-10 mx-auto text-slate-300" />
          <p className="font-bold text-sm text-slate-700">Kayıtlı araç veya mülk bulunamadı.</p>
          <p className="text-xs text-slate-500">
            Arama kriterlerinizi değiştirebilir veya &quot;Yeni Araç / Mülk Ekle&quot; butonuyla ekleme yapabilirsiniz.
          </p>
          <button
            type="button"
            onClick={openNewAssetModal}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
          >
            + Yeni Araç / Mülk Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-5 space-y-4 shadow-xs relative transition-all ${
                item.hasWarning
                  ? "border-rose-400 ring-2 ring-rose-300/30 shadow-rose-100/50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      item.assetType === "VEHICLE"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-indigo-100 text-indigo-900"
                    }`}
                  >
                    {item.assetType === "VEHICLE" ? "🚗 Araç / Servis" : "🏢 Gayrimenkul / Mülk"}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-base mt-1.5">{item.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">Sahibi: {item.owner || "Kurum"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditAssetModal(item)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                    title="Düzenle"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAsset(item.id, item.title)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                {item.assetType === "VEHICLE" ? (
                  <>
                    {/* TÜVTÜRK Muayene */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-600 font-semibold">TÜVTÜRK Muayene:</span>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">
                          {item.inspectionDate ? formatSafeDate(item.inspectionDate) : "Belirtilmedi"}
                        </span>
                        {typeof item.inspDays === "number" && (
                          <span
                            className={`text-[10px] font-black ${
                              item.inspDays <= 10 ? "text-rose-600" : "text-slate-500"
                            }`}
                          >
                            {item.inspDays <= 0 ? "Süresi Doldu!" : `${item.inspDays} gün kaldı`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Kasko Poliçesi */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-600 font-semibold">Kasko Bitiş:</span>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">
                          {item.kaskoDate ? formatSafeDate(item.kaskoDate) : "Belirtilmedi"}
                        </span>
                        {typeof item.kaskoDays === "number" && (
                          <span
                            className={`text-[10px] font-black ${
                              item.kaskoDays <= 10 ? "text-rose-600" : "text-slate-500"
                            }`}
                          >
                            {item.kaskoDays <= 0 ? "Süresi Doldu!" : `${item.kaskoDays} gün kaldı`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Trafik Sigortası */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-600 font-semibold">Trafik Sigortası:</span>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">
                          {item.insuranceDate ? formatSafeDate(item.insuranceDate) : "Belirtilmedi"}
                        </span>
                        {typeof item.insDays === "number" && (
                          <span
                            className={`text-[10px] font-black ${
                              item.insDays <= 10 ? "text-rose-600" : "text-slate-500"
                            }`}
                          >
                            {item.insDays <= 0 ? "Süresi Doldu!" : `${item.insDays} gün kaldı`}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Gayrimenkul / DASK */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-600 font-semibold">DASK / Yangın Sigortası:</span>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">
                          {item.housingDate ? formatSafeDate(item.housingDate) : "Belirtilmedi"}
                        </span>
                        {typeof item.houseDays === "number" && (
                          <span
                            className={`text-[10px] font-black ${
                              item.houseDays <= 10 ? "text-rose-600" : "text-slate-500"
                            }`}
                          >
                            {item.houseDays <= 0 ? "Süresi Doldu!" : `${item.houseDays} gün kaldı`}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {item.notes && (
                  <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-50">
                    {item.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 📝 VARLIK EKLE / DÜZENLE MODALI */}
      {assetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 relative border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-500" />
                <span>{editingAsset ? "Araç / Mülk Kaydını Düzenle" : "Yeni Araç / Mülk Ekle"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setAssetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssetSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Varlık Türü</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-xl border bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="assetType"
                      value="VEHICLE"
                      checked={assetForm.assetType === "VEHICLE"}
                      onChange={() => setAssetForm({ ...assetForm, assetType: "VEHICLE" })}
                    />
                    <span className="font-bold text-slate-800">🚗 Araç / Servis</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl border bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="assetType"
                      value="REAL_ESTATE"
                      checked={assetForm.assetType === "REAL_ESTATE"}
                      onChange={() => setAssetForm({ ...assetForm, assetType: "REAL_ESTATE" })}
                    />
                    <span className="font-bold text-slate-800">🏢 Ev / Bina / Mülk</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {assetForm.assetType === "VEHICLE" ? "Araç Plakası & Modeli *" : "Mülk / Ev Adresi & Tanımı *"}
                </label>
                <input
                  type="text"
                  required
                  value={assetForm.title}
                  onChange={(e) => setAssetForm({ ...assetForm, title: e.target.value })}
                  placeholder={
                    assetForm.assetType === "VEHICLE"
                      ? "Örn: 38 AB 123 - Ford Transit Servis"
                      : "Örn: Kampüs Ana Binası"
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kimin Üzerine / Sahibi</label>
                <input
                  type="text"
                  value={assetForm.owner}
                  onChange={(e) => setAssetForm({ ...assetForm, owner: e.target.value })}
                  placeholder="Örn: Şirket Aracı, Ahmet Bey, Kiralık Mülk"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              {assetForm.assetType === "VEHICLE" ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">TÜVTÜRK Muayene Tarihi</label>
                      <input
                        type="date"
                        value={assetForm.inspectionDate}
                        onChange={(e) => setAssetForm({ ...assetForm, inspectionDate: e.target.value })}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kasko Bitiş Tarihi</label>
                      <input
                        type="date"
                        value={assetForm.kaskoDate}
                        onChange={(e) => setAssetForm({ ...assetForm, kaskoDate: e.target.value })}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Trafik Sigortası Bitiş Tarihi</label>
                    <input
                      type="date"
                      value={assetForm.insuranceDate}
                      onChange={(e) => setAssetForm({ ...assetForm, insuranceDate: e.target.value })}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">DASK / Bina Sigortası Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={assetForm.housingDate}
                    onChange={(e) => setAssetForm({ ...assetForm, housingDate: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notlar / Poliçe No</label>
                <textarea
                  rows={2}
                  value={assetForm.notes}
                  onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
                  placeholder="Opsiyonel notlar, poliçe numarası vb..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssetModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={assetSubmitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {assetSubmitting ? "Kaydediliyor..." : editingAsset ? "Güncelle" : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
