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
  School,
  GraduationCap,
  Utensils,
  Wrench,
  Calculator,
  Briefcase,
  ChevronDown,
  ChevronUp,
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
  _count: {
    staffs: number;
  };
  staffs?: {
    staff: StaffMember;
  }[];
}

export default function DepartmanlarPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State (Hem Ekleme Hem Düzenleme İçin)
  const [modalOpen, setModalOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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

  // Ekleme Modalını Aç
  const openCreateModal = () => {
    setEditDept(null);
    setName("");
    setDescription("");
    setErrorMsg("");
    setModalOpen(true);
  };

  // Düzenleme Modalını Aç
  const openEditModal = (dept: Department) => {
    setEditDept(dept);
    setName(dept.name);
    setDescription(dept.description || "");
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
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
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
  const applyTemplate = (tName: string, tDesc: string) => {
    setName(tName);
    setDescription(tDesc);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 select-none">
      {/* Başlık ve Aksiyon */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Departmanlar & Bölümler</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
              {departments.length} Birim
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            İlkokul, kreş veya özel okul kadro yapınıza göre departmanları dilediğiniz gibi ekleyin, adını değiştirin veya düzenleyin.
          </p>
        </div>

        <button
          onClick={openCreateModal}
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

      {/* Hazır Okul & Kreş Şablonları Öneri Şeridi */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100/80 text-xs text-slate-700 space-y-2">
        <div className="flex items-center gap-2 font-bold text-teal-900">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>Hızlı Kadro Şablonları (Kreş, İlkokul & Kurs):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Öğretmenler", desc: "Sınıf ve Branş Öğretmenleri" },
            { label: "Hizmetli & Temizlik", desc: "Okul Temizlik ve Destek Hizmetleri" },
            { label: "Mutfak & Aşçı", desc: "Yemekhane ve Beslenme Sorumlusu" },
            { label: "Muhasebe & Finans", desc: "Öğrenci Kayıt ve Mali İşler" },
            { label: "Kurum Müdürü", desc: "Okul ve İdari Yönetim" },
            { label: "İdari İşler & Personel", desc: "Personel ve Operasyon Sorumlusu" },
          ].map((t, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                openCreateModal();
                applyTemplate(t.label, t.desc);
              }}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-teal-700 hover:text-white border border-teal-200 text-slate-700 font-medium transition-all shadow-2xs flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3 text-teal-600 group-hover:text-white" />
              <span>+ {t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Departman Kartları Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400">Departmanlar yükleniyor...</div>
        ) : departments.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-semibold">Henüz kayıtlı departman bulunmuyor.</p>
            <p className="text-xs text-slate-400 mt-1">Yukarıdaki "Yeni Departman Ekle" butonu ile hemen birim tanımlayabilirsiniz.</p>
          </div>
        ) : (
          departments.map((dept) => {
            const isExpanded = expandedDeptId === dept.id;
            const staffList = dept.staffs?.map((s) => s.staff) || [];

            return (
              <div
                key={dept.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5 space-y-3">
                  {/* Üst İkon, Sayı ve Aksiyonlar */}
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shadow-2xs group-hover:bg-teal-700 group-hover:text-white transition-colors">
                      <Building2 className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        {dept._count.staffs} Personel
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
                  {editDept ? "Departmanı Düzenle" : "Yeni Departman Ekle"}
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
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Departman Adı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Öğretmenler, Hizmetli Kadrosu, Aşçı / Mutfak"
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
                  rows={3}
                  placeholder="Departmanın kurum içindeki görev ve sorumlulukları"
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
                  {submitting ? "Kaydediliyor..." : editDept ? "Güncelle" : "Departmanı Kaydet"}
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
