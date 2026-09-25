"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Users,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  Briefcase,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Layers,
} from "lucide-react";

interface StaffMember {
  id: string;
  fullName: string;
  title: string | null;
  status: string;
}

interface Department {
  id: string;
  name: string;
  description: string | null;
  category?: string | null;
  _count: {
    staffs: number;
  };
  staffs?: {
    staff: StaffMember;
  }[];
}

type CategoryKey = "ALL" | "TEACHER" | "ADMIN" | "STAFF" | "BRANCH";

const CATEGORY_META = {
  TEACHER: {
    label: "Öğretmen",
    plural: "Öğretmenler",
    icon: GraduationCap,
    badgeBg: "bg-teal-50 border-teal-200 text-teal-800",
    activeTab: "bg-teal-700 text-white shadow-xs",
  },
  ADMIN: {
    label: "İdari Personel",
    plural: "İdari Personel",
    icon: Briefcase,
    badgeBg: "bg-indigo-50 border-indigo-200 text-indigo-800",
    activeTab: "bg-indigo-700 text-white shadow-xs",
  },
  STAFF: {
    label: "Personel",
    plural: "Personel (Destek)",
    icon: Users,
    badgeBg: "bg-amber-50 border-amber-200 text-amber-800",
    activeTab: "bg-amber-700 text-white shadow-xs",
  },
  BRANCH: {
    label: "Branş",
    plural: "Branşlar",
    icon: BookOpen,
    badgeBg: "bg-sky-50 border-sky-200 text-sky-800",
    activeTab: "bg-sky-700 text-white shadow-xs",
  },
};

const TEMPLATE_GROUPS = [
  {
    category: "TEACHER",
    title: "🎓 Öğretmen Kadrosu",
    items: [
      { label: "Öğretmen", desc: "Kreş ve Genel Öğretmen Kadrosu" },
      { label: "Okul Öncesi Öğretmeni", desc: "Kreş / 3-6 Yaş Okul Öncesi Eğitmeni" },
      { label: "Sınıf Öğretmeni", desc: "İlkokul Sınıf Öğretmeni" },
    ],
  },
  {
    category: "ADMIN",
    title: "💼 İdari Personel",
    items: [
      { label: "İdari Personel", desc: "Genel İdari Yönetim Kadrosu" },
      { label: "Müdür", desc: "Kurum Müdürü ve Yönetim" },
      { label: "Müdür Yardımcısı", desc: "Müdür Yardımcısı & Eğitim Koordinatörü" },
      { label: "İdari İşler ve Personel Sorumlusu", desc: "Personel ve İdari Operasyon" },
      { label: "Muhasebe", desc: "Finans, Kayıt ve Muhasebe Yönetimi" },
    ],
  },
  {
    category: "STAFF",
    title: "🧹 Personel & Destek",
    items: [
      { label: "Personel", desc: "Genel Kurum Destek Personeli" },
      { label: "Hizmetli", desc: "Temizlik ve Destek Hizmetleri" },
      { label: "Aşçı", desc: "Mutfak ve Yemekhane Sorumlusu" },
      { label: "Güvenlik", desc: "Kurum ve Kapı Güvenliği" },
      { label: "Servis Şoförü", desc: "Öğrenci ve Personel Servisi" },
    ],
  },
  {
    category: "BRANCH",
    title: "📚 Branşlar",
    items: [
      { label: "Branş Öğretmeni", desc: "Genel Alan / Branş Eğitimi" },
      { label: "Matematik", desc: "Matematik ve Geometri Branşı" },
      { label: "Türkçe", desc: "Türkçe ve Edebiyat Branşı" },
      { label: "Fen Bilimleri", desc: "Fizik, Kimya, Biyoloji ve Fen Bilgisi" },
      { label: "İngilizce", desc: "Yabancı Dil Branşı" },
      { label: "Rehberlik", desc: "Psikolojik Danışmanlık ve Rehberlik" },
    ],
  },
];

export default function DepartmanlarPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CategoryKey>("ALL");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"TEACHER" | "ADMIN" | "STAFF" | "BRANCH">("TEACHER");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Silme Onay Modalı
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Genişletilmiş Personel Listesi
  const [expandedDeptId, setExpandedDeptId] = useState<string | null>(null);

  const fetchDepts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/departmanlar");
      const data = await res.json();
      if (Array.isArray(data)) setDepartments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const getDeptCategory = (dept: Department): "TEACHER" | "ADMIN" | "STAFF" | "BRANCH" => {
    if (dept.category && ["TEACHER", "ADMIN", "STAFF", "BRANCH"].includes(dept.category)) {
      return dept.category as any;
    }
    const n = dept.name.toLowerCase();
    if (n.includes("öğretmen") || n.includes("ogretmen") || n.includes("okul öncesi")) return "TEACHER";
    if (n.includes("müdür") || n.includes("idari") || n.includes("muhasebe") || n.includes("sekreter")) return "ADMIN";
    if (n.includes("hizmetli") || n.includes("aşçı") || n.includes("temizlik") || n.includes("güvenlik") || n.includes("şoför") || n.includes("personel")) return "STAFF";
    return "BRANCH";
  };

  // Ekleme Modalını Aç
  const openCreateModal = (presetCategory: "TEACHER" | "ADMIN" | "STAFF" | "BRANCH" = "TEACHER") => {
    setEditDept(null);
    setName("");
    setDescription("");
    setCategory(presetCategory);
    setErrorMsg("");
    setModalOpen(true);
  };

  // Düzenleme Modalını Aç
  const openEditModal = (dept: Department) => {
    setEditDept(dept);
    setName(dept.name);
    setDescription(dept.description || "");
    setCategory(getDeptCategory(dept));
    setErrorMsg("");
    setModalOpen(true);
  };

  // Form Gönderimi (Ekle veya Güncelle)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Departman adı zorunludur.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const url = editDept ? `/api/departmanlar/${editDept.id}` : "/api/departmanlar";
      const method = editDept ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "İşlem başarısız.");

      setSuccessMsg(
        editDept
          ? `"${data.name}" departmanı başarıyla güncellendi.`
          : `"${data.name}" departmanı başarıyla eklendi.`
      );
      setModalOpen(false);
      fetchDepts();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  // Silme Onay Modalını Aç
  const openDeleteModal = (dept: Department) => {
    setDeptToDelete(dept);
    setDeleteModalOpen(true);
  };

  // Silme İşlemini Gerçekleştir
  const handleDelete = async () => {
    if (!deptToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/departmanlar/${deptToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Silinemedi.");

      setSuccessMsg(data.message || `"${deptToDelete.name}" silindi.`);
      setDeleteModalOpen(false);
      setDeptToDelete(null);
      fetchDepts();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Hızlı Kurum Şablonu Ekle
  const applyTemplate = (tName: string, tDesc: string, tCat: "TEACHER" | "ADMIN" | "STAFF" | "BRANCH") => {
    openCreateModal(tCat);
    setName(tName);
    setDescription(tDesc);
    setCategory(tCat);
  };

  // Filtreleme
  const filteredDepartments = departments.filter((d) => {
    if (activeTab === "ALL") return true;
    return getDeptCategory(d) === activeTab;
  });

  const countByCat = {
    TEACHER: departments.filter((d) => getDeptCategory(d) === "TEACHER").length,
    ADMIN: departments.filter((d) => getDeptCategory(d) === "ADMIN").length,
    STAFF: departments.filter((d) => getDeptCategory(d) === "STAFF").length,
    BRANCH: departments.filter((d) => getDeptCategory(d) === "BRANCH").length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 select-none">
      {/* Başlık ve Aksiyon */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Departmanlar & Branşlar</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
              {departments.length} Birim
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Öğretmen, İdari Personel, Personel ve Branşları ana başlıklara göre düzenleyin veya yeni birim ekleyin.
          </p>
        </div>

        <button
          onClick={() => openCreateModal("TEACHER")}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Departman Ekle</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 4 Ana Başlık Sekmeleri (Filter Tabs) */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "ALL"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Tümü</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-semibold">
            {departments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TEACHER")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "TEACHER"
              ? CATEGORY_META.TEACHER.activeTab
              : "text-slate-600 hover:text-teal-800 hover:bg-white/50"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>🎓 Öğretmen</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
            activeTab === "TEACHER" ? "bg-white/20 text-white" : "bg-teal-100 text-teal-800"
          }`}>
            {countByCat.TEACHER}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ADMIN")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "ADMIN"
              ? CATEGORY_META.ADMIN.activeTab
              : "text-slate-600 hover:text-indigo-800 hover:bg-white/50"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>💼 İdari Personel</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
            activeTab === "ADMIN" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-800"
          }`}>
            {countByCat.ADMIN}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("STAFF")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "STAFF"
              ? CATEGORY_META.STAFF.activeTab
              : "text-slate-600 hover:text-amber-800 hover:bg-white/50"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>🧹 Personel</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
            activeTab === "STAFF" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
          }`}>
            {countByCat.STAFF}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("BRANCH")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "BRANCH"
              ? CATEGORY_META.BRANCH.activeTab
              : "text-slate-600 hover:text-sky-800 hover:bg-white/50"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>📚 Branşlar</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
            activeTab === "BRANCH" ? "bg-white/20 text-white" : "bg-sky-100 text-sky-800"
          }`}>
            {countByCat.BRANCH}
          </span>
        </button>
      </div>

      {/* Ana Başlıklara Göre Hızlı Kadro Şablonları */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>Ana Başlıklara Göre Tek Tıkla Departman & Branş Ekle:</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {TEMPLATE_GROUPS.map((group, gIdx) => (
            <div
              key={gIdx}
              className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2 flex flex-col justify-between"
            >
              <span className="text-[11px] font-bold text-slate-700 tracking-tight block">
                {group.title}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item, iIdx) => (
                  <button
                    key={iIdx}
                    type="button"
                    onClick={() =>
                      applyTemplate(
                        item.label,
                        item.desc,
                        group.category as "TEACHER" | "ADMIN" | "STAFF" | "BRANCH"
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-teal-700 hover:text-white border border-slate-200 text-slate-700 text-[11px] font-medium transition-all shadow-2xs flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-teal-600 group-hover:text-white" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Departman Kartları Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400">Departmanlar yükleniyor...</div>
        ) : filteredDepartments.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-semibold">Bu kategoride departman bulunamadı.</p>
            <p className="text-xs text-slate-400 mt-1">Yukarıdaki şablonlardan veya "Yeni Departman Ekle" butonu ile hemen ekleyebilirsiniz.</p>
          </div>
        ) : (
          filteredDepartments.map((dept) => {
            const isExpanded = expandedDeptId === dept.id;
            const staffList = (dept.staffs?.map((s) => s.staff) || []).filter(
              (s) => s && s.status === "ACTIVE"
            );
            const activeStaffCount = staffList.length;
            const catKey = getDeptCategory(dept);
            const catMeta = CATEGORY_META[catKey];
            const CatIcon = catMeta.icon;

            return (
              <div
                key={dept.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5 space-y-3">
                  {/* Üst Kategori Rozeti ve Aksiyonlar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${catMeta.badgeBg}`}
                      >
                        <CatIcon className="w-3.5 h-3.5" />
                        <span>{catMeta.label}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        {activeStaffCount} Aktif Personel
                      </span>

                      {/* Düzenle Butonu */}
                      <button
                        onClick={() => openEditModal(dept)}
                        title="Departmanı Düzenle / Adını Değiştir"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Sil Butonu */}
                      <button
                        onClick={() => openDeleteModal(dept)}
                        title="Departmanı Sil"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Departman Adı ve Açıklaması */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{dept.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {dept.description || "Açıklama belirtilmemiş"}
                    </p>
                  </div>

                  {/* Personel Önizleme / Genişletme */}
                  {dept._count.staffs > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setExpandedDeptId(isExpanded ? null : dept.id)}
                        className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center justify-between w-full"
                      >
                        <span>Personelleri Gör ({dept._count.staffs})</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-1.5 animate-in fade-in duration-150">
                          {staffList.map((s) => (
                            <div
                              key={s.id}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                            >
                              <span className="font-medium text-slate-800">{s.fullName}</span>
                              <span className="text-[11px] text-slate-400">{s.title || "Personel"}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Departman Ekleme / Düzenleme Modalı */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 relative border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
                  {editDept ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <h3 className="font-bold text-slate-900">
                  {editDept ? "Departmanı / Branşı Düzenle" : "Yeni Departman / Branş Ekle"}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {/* Ana Başlık (Kategori) Seçimi */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Ana Başlık (Kategori) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "TEACHER", label: "🎓 Öğretmen", desc: "Kreş ve Genel Öğretmen" },
                    { key: "ADMIN", label: "💼 İdari Personel", desc: "Müdür, Muhasebe, İdare" },
                    { key: "STAFF", label: "🧹 Personel", desc: "Hizmetli, Aşçı, Destek" },
                    { key: "BRANCH", label: "📚 Branşlar", desc: "Ders Alanları (Fen, Mat vb.)" },
                  ].map((catOption) => {
                    const isSelected = category === catOption.key;
                    return (
                      <button
                        key={catOption.key}
                        type="button"
                        onClick={() => setCategory(catOption.key as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-teal-600 bg-teal-50/80 text-teal-900 ring-2 ring-teal-600/20 font-bold"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="block text-xs">{catOption.label}</span>
                        <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                          {catOption.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Departman / Branş Adı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Öğretmen, Hizmetli, Aşçı, Müdür, Matematik"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Açıklama / Görev Alanı
                </label>
                <textarea
                  rows={2}
                  placeholder="Birim veya branşın kurum içindeki görev ve sorumlulukları"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-800 text-white rounded-xl font-semibold hover:bg-teal-900 disabled:opacity-50 shadow-sm transition-all"
                >
                  {submitting ? "Kaydediliyor..." : editDept ? "Güncelle" : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Silme Onay Modalı */}
      {deleteModalOpen && deptToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 relative border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Departmanı Sil</h3>
                <p className="text-xs text-slate-500">Bu işlem geri alınamaz.</p>
              </div>
            </div>

            <p className="text-sm text-slate-700">
              <strong className="text-slate-900">"{deptToDelete.name}"</strong> departmanını silmek istediğinize emin misiniz?
            </p>

            {deptToDelete._count.staffs > 0 && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                ⚠️ <strong>Dikkat:</strong> Bu departmanda şu an <strong>{deptToDelete._count.staffs} personel</strong> kayıtlıdır. Departman silindiğinde personelleriniz silinmez, sadece departman ilişkisi kaldırılır.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-xs"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                {deleting ? "Siliniyor..." : "Evet, Departmanı Sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
