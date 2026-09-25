"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  School,
  Plus,
  Users,
  Search,
  Edit2,
  Trash2,
  X,
  GraduationCap,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Building,
  UserCheck,
} from "lucide-react";

interface Staff {
  id: string;
  fullName: string;
  title: string | null;
  phone: string | null;
}

interface ClassroomStudent {
  id: string;
  studentNo: string | null;
  tcNo: string;
  fullName: string;
  status: string;
  primaryPhone: string;
  photoUrl: string | null;
  netAmount: number;
}

interface Classroom {
  id: string;
  name: string;
  gradeLevel: string;
  branch: string | null;
  capacity: number;
  academicYear: string;
  roomNumber: string | null;
  teacherStaff?: Staff | null;
  activeStudentCount: number;
  occupancyRate: number;
  students?: ClassroomStudent[];
}

export default function SiniflarPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("ALL");

  // Modallar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    gradeLevel: "8",
    branch: "LGS",
    capacity: 16,
    academicYear: "2025-2026",
    roomNumber: "Derslik 101",
    teacherStaffId: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classRes, staffRes] = await Promise.all([
        fetch("/api/siniflar"),
        fetch("/api/personel"),
      ]);

      if (classRes.ok) {
        const data = await classRes.json();
        setClassrooms(data || []);
      }
      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaffList(data.staff || []);
      }
    } catch (err) {
      console.error("Sınıflar yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingClassroom(null);
    setFormData({
      name: "",
      gradeLevel: "8",
      branch: "LGS",
      capacity: 16,
      academicYear: "2025-2026",
      roomNumber: "",
      teacherStaffId: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Classroom) => {
    setEditingClassroom(c);
    setFormData({
      name: c.name,
      gradeLevel: c.gradeLevel,
      branch: c.branch || "",
      capacity: c.capacity,
      academicYear: c.academicYear,
      roomNumber: c.roomNumber || "",
      teacherStaffId: c.teacherStaff?.id || "",
    });
    setIsModalOpen(true);
  };

  const openDetailModal = async (c: Classroom) => {
    try {
      const res = await fetch(`/api/siniflar/${c.id}`);
      if (res.ok) {
        const full = await res.json();
        setSelectedClassroom(full);
      }
    } catch {
      setSelectedClassroom(c);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingClassroom ? `/api/siniflar/${editingClassroom.id}` : "/api/siniflar";
      const method = editingClassroom ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "İşlem başarısız.");
        return;
      }

      setIsModalOpen(false);
      fetchData();
    } catch {
      alert("Sunucu hatası oluştu.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" sınıfını silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/siniflar/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Sınıf silinemedi.");
        return;
      }
      fetchData();
    } catch {
      alert("Hata oluştu.");
    }
  };

  const filteredClassrooms = classrooms.filter((c) => {
    const matchSearch =
      !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.branch && c.branch.toLowerCase().includes(search.toLowerCase())) ||
      (c.teacherStaff && c.teacherStaff.fullName.toLowerCase().includes(search.toLowerCase()));

    const matchGrade = gradeFilter === "ALL" || c.gradeLevel === gradeFilter;

    return matchSearch && matchGrade;
  });

  const totalCapacity = classrooms.reduce((s, c) => s + c.capacity, 0);
  const totalEnrolled = classrooms.reduce((s, c) => s + c.activeStudentCount, 0);
  const overallOccupancy = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-800 text-white shadow-xs">
            <School className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Sınıflar & Şubeler</h1>
            <p className="text-xs text-slate-500 font-medium">
              Eğitim sınıfları, kontenjan takibi ve sınıf rehber öğretmenleri
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Sınıf Oluştur</span>
        </button>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Toplam Sınıf
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-slate-800">{classrooms.length}</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider block">
            Kayıtlı Öğrenci
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-teal-800">{totalEnrolled}</span>
            <GraduationCap className="w-4 h-4 text-teal-600" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Toplam Kontenjan
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-slate-800">{totalCapacity}</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
            Genel Doluluk Oranı
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-blue-700">%{overallOccupancy}</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Arama & Filtre */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Sınıf adı, branş veya rehber öğretmen ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
          />
        </div>

        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none"
        >
          <option value="ALL">Tüm Seviyeler</option>
          <option value="5">5. Sınıf</option>
          <option value="6">6. Sınıf</option>
          <option value="7">7. Sınıf</option>
          <option value="8">8. Sınıf (LGS)</option>
          <option value="9">9. Sınıf</option>
          <option value="10">10. Sınıf</option>
          <option value="11">11. Sınıf</option>
          <option value="12">12. Sınıf (YKS)</option>
          <option value="MEZUN">Mezun Grubu</option>
        </select>
      </div>

      {/* Sınıf Kartları Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredClassrooms.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200">
            <School className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Kayıtlı sınıf bulunamadı.</p>
            <p className="text-xs text-slate-400">Yeni bir sınıf ekleyerek başlayabilirsiniz.</p>
          </div>
        ) : (
          filteredClassrooms.map((c) => {
            const isFull = c.activeStudentCount >= c.capacity;
            return (
              <div
                key={c.id}
                onClick={() => openDetailModal(c)}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                        {c.gradeLevel}. Seviye {c.branch ? `• ${c.branch}` : ""}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-800 group-hover:text-teal-700 transition-colors">
                        {c.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(c);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(c.id, c.name);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Doluluk Çubuğu */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Kontenjan:</span>
                      <span className="font-bold text-slate-800">
                        {c.activeStudentCount} / {c.capacity} Öğrenci
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isFull
                            ? "bg-rose-500"
                            : c.occupancyRate > 75
                            ? "bg-amber-500"
                            : "bg-teal-600"
                        }`}
                        style={{ width: `${Math.min(100, c.occupancyRate)}%` }}
                      />
                    </div>
                  </div>

                  {/* Rehber Öğretmen ve Derslik */}
                  <div className="text-[11px] text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">
                        <strong>Rehber:</strong> {c.teacherStaff?.fullName || "Atanmadı"}
                      </span>
                    </div>
                    {c.roomNumber && (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Building className="w-3.5 h-3.5" />
                        <span>{c.roomNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-teal-700 font-semibold">
                  <span>Öğrencileri İncele</span>
                  <span>&rarr;</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= MODAL: SINIF EKLE / DÜZENLE ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
                  <School className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {editingClassroom ? "Sınıfı Düzenle" : "Yeni Sınıf Tanımla"}
                  </h3>
                  <p className="text-[11px] text-slate-500">Sınıf adı, kapasite ve rehber öğretmenini belirleyin</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sınıf / Şube Adı *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: 8-A LGS, 11-B Sayısal, 12-A EA"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Seviye *</label>
                  <select
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                  >
                    <option value="5">5. Sınıf</option>
                    <option value="6">6. Sınıf</option>
                    <option value="7">7. Sınıf</option>
                    <option value="8">8. Sınıf (LGS)</option>
                    <option value="9">9. Sınıf</option>
                    <option value="10">10. Sınıf</option>
                    <option value="11">11. Sınıf</option>
                    <option value="12">12. Sınıf (YKS)</option>
                    <option value="MEZUN">Mezun Grubu</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branş / Tür</label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="Sayısal, EA, LGS, Dil"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kontenjan (Öğrenci)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 16 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Derslik / Oda No</label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="Derslik 101, Kat 2"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sınıf Rehber Öğretmeni</label>
                <select
                  value={formData.teacherStaffId}
                  onChange={(e) => setFormData({ ...formData, teacherStaffId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                >
                  <option value="">Öğretmen Seçiniz...</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.title || "Öğretmen"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs"
                >
                  {editingClassroom ? "Güncelle" : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SINIF ÖĞRENCİ LİSTESİ ================= */}
      {selectedClassroom && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                  Sınıf Öğrenci Listesi
                </span>
                <h3 className="text-base font-bold text-slate-800">{selectedClassroom.name}</h3>
              </div>
              <button
                onClick={() => setSelectedClassroom(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {!selectedClassroom.students || selectedClassroom.students.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Bu sınıfa henüz kayıtlı öğrenci bulunmuyor.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {selectedClassroom.students.map((st, idx) => (
                    <div
                      key={st.id}
                      className="py-3 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-slate-400 font-bold">{idx + 1}.</span>
                        <div>
                          <p className="font-bold text-slate-800">{st.fullName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            No: {st.studentNo || "-"} • TC: {st.tcNo}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-600">{st.primaryPhone}</span>
                        <Link
                          href={`/ogrenciler?search=${st.fullName}`}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold text-[11px]"
                        >
                          Öğrenci Kartı
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
