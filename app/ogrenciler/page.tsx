"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  GraduationCap,
  Users,
  Search,
  Plus,
  Filter,
  Phone,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  AlertCircle,
  FileText,
  DollarSign,
  Printer,
  ChevronRight,
  School,
  Tag,
  Clock,
  Heart,
  Home,
  Check,
  Receipt,
  FileSpreadsheet,
  Camera,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import * as XLSX from "xlsx";

interface Classroom {
  id: string;
  name: string;
  gradeLevel: string;
  branch: string | null;
}

interface StudentPayment {
  id: string;
  studentId: string;
  installmentNo: number;
  title: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  isPaid: boolean;
  paidDate: string | null;
  paymentMethod: string | null;
  receiptNo: string | null;
  notes: string | null;
}

interface StudentAttendance {
  id: string;
  studentId: string;
  date: string;
  lessonHour: string | null;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  notes: string | null;
  isNotified: boolean;
}

interface Student {
  id: string;
  studentNo: string | null;
  tcNo: string;
  fullName: string;
  birthDate: string | null;
  gender: string | null;
  bloodGroup: string | null;
  healthNotes: string | null;
  photoUrl: string | null;
  status: "ACTIVE" | "FROZEN" | "TRANSFERRED" | "DROPPED" | "GRADUATED";
  fatherName: string | null;
  fatherPhone: string | null;
  fatherJob: string | null;
  motherName: string | null;
  motherPhone: string | null;
  motherJob: string | null;
  guardianRelation: string;
  primaryPhone: string;
  primaryEmail: string | null;
  homeAddress: string | null;
  cityDistrict: string | null;
  classroomId: string | null;
  classroom?: Classroom | null;
  academicYear: string;
  enrollmentDate: string;
  graduationDate: string | null;
  previousSchool: string | null;
  contractAmount: number;
  discountAmount: number;
  netAmount: number;
  installmentCount: number;
  tags: string | null;
  notes: string | null;
  payments: StudentPayment[];
  attendances?: StudentAttendance[];
  _count?: {
    attendances: number;
  };
  createdAt: string;
}

const STATUS_MAP: { [key: string]: { label: string; color: string } } = {
  ACTIVE: { label: "Aktif Kayıtlı", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  FROZEN: { label: "Donduruldu", color: "bg-amber-50 text-amber-700 border-amber-200" },
  TRANSFERRED: { label: "Nakil Gitti", color: "bg-blue-50 text-blue-700 border-blue-200" },
  DROPPED: { label: "Ayrıldı / İptal", color: "bg-rose-50 text-rose-700 border-rose-200" },
  GRADUATED: { label: "Mezun", color: "bg-purple-50 text-purple-700 border-purple-200" },
};

const ATTENDANCE_STATUS: { [key: string]: { label: string; color: string } } = {
  PRESENT: { label: "Geldi", color: "bg-emerald-100 text-emerald-800" },
  ABSENT: { label: "Gelmedi", color: "bg-rose-100 text-rose-800" },
  LATE: { label: "Geç Kaldı", color: "bg-amber-100 text-amber-800" },
  EXCUSED: { label: "İzinli / Raporlu", color: "bg-blue-100 text-blue-800" },
};

export default function OgrencilerPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  // Arama & Filtreler
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");
  const [tagFilter, setTagFilter] = useState("ALL");

  // Modallar
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null); // Detay Modalı
  const [detailTab, setDetailTab] = useState<"profile" | "payments" | "attendance" | "contract">("profile");

  // Ödeme Al Modalı
  const [payingInstallment, setPayingInstallment] = useState<StudentPayment | null>(null);
  const [payFormData, setPayFormData] = useState({
    paidAmount: "",
    paymentMethod: "CASH",
    receiptNo: "",
    notes: "",
  });

  // Yeni Yoklama Formu
  const [attFormData, setAttFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    lessonHour: "Tüm Gün",
    status: "ABSENT" as const,
    notes: "",
  });

  // Yeni Öğrenci Formu
  const [formData, setFormData] = useState({
    studentNo: "",
    tcNo: "",
    fullName: "",
    birthDate: "",
    gender: "UNSPECIFIED",
    bloodGroup: "",
    healthNotes: "",
    fatherName: "",
    fatherPhone: "",
    fatherJob: "",
    motherName: "",
    motherPhone: "",
    motherJob: "",
    guardianRelation: "FATHER",
    primaryPhone: "",
    primaryEmail: "",
    homeAddress: "",
    cityDistrict: "",
    classroomId: "",
    academicYear: "2025-2026",
    previousSchool: "",
    contractAmount: "",
    discountAmount: "0",
    installmentCount: "10",
    firstInstallmentDate: new Date().toISOString().split("T")[0],
    tags: [] as string[],
    notes: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stuRes, classRes] = await Promise.all([
        fetch("/api/ogrenciler"),
        fetch("/api/siniflar"),
      ]);

      if (stuRes.ok) {
        const data = await stuRes.json();
        setStudents(data.students || []);
      }
      if (classRes.ok) {
        const data = await classRes.json();
        setClassrooms(data || []);
      }
    } catch (err) {
      console.error("Öğrenciler yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtreleme
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        !search.trim() ||
        s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.tcNo.includes(search) ||
        (s.studentNo && s.studentNo.includes(search)) ||
        s.primaryPhone.includes(search) ||
        (s.fatherName && s.fatherName.toLowerCase().includes(search.toLowerCase())) ||
        (s.motherName && s.motherName.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
      const matchClass =
        classFilter === "ALL" ||
        (classFilter === "UNASSIGNED" ? !s.classroomId : s.classroomId === classFilter);

      const matchTag = tagFilter === "ALL" || (s.tags && s.tags.includes(tagFilter));

      return matchSearch && matchStatus && matchClass && matchTag;
    });
  }, [students, search, statusFilter, classFilter, tagFilter]);

  // Finansal KPI Hesaplama
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.status === "ACTIVE").length;

    let totalContractSum = 0;
    let totalPaidSum = 0;
    let totalRemainingSum = 0;

    students.forEach((s) => {
      totalContractSum += s.netAmount || 0;
      s.payments?.forEach((p) => {
        totalPaidSum += p.paidAmount || (p.isPaid ? p.amount : 0);
        if (!p.isPaid) {
          totalRemainingSum += Math.max(0, p.amount - (p.paidAmount || 0));
        }
      });
    });

    return { total, active, totalContractSum, totalPaidSum, totalRemainingSum };
  }, [students]);

  // Öğrenci Detayını Getir
  const openStudentDetail = async (studentId: string, initialTab: typeof detailTab = "profile") => {
    try {
      const res = await fetch(`/api/ogrenciler/${studentId}`);
      if (res.ok) {
        const full = await res.json();
        setSelectedStudent(full);
        setDetailTab(initialTab);
      }
    } catch {
      alert("Öğrenci detayları alınamadı.");
    }
  };

  // Yeni Öğrenci Kaydı / Güncelleme
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingStudent ? `/api/ogrenciler/${editingStudent.id}` : "/api/ogrenciler";
      const method = editingStudent ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Öğrenci kaydedilemedi.");
        return;
      }

      setIsAddModalOpen(false);
      setEditingStudent(null);
      resetForm();
      fetchData();
    } catch {
      alert("Sunucu hatası oluştu.");
    }
  };

  const resetForm = () => {
    setFormData({
      studentNo: "",
      tcNo: "",
      fullName: "",
      birthDate: "",
      gender: "UNSPECIFIED",
      bloodGroup: "",
      healthNotes: "",
      fatherName: "",
      fatherPhone: "",
      fatherJob: "",
      motherName: "",
      motherPhone: "",
      motherJob: "",
      guardianRelation: "FATHER",
      primaryPhone: "",
      primaryEmail: "",
      homeAddress: "",
      cityDistrict: "",
      classroomId: "",
      academicYear: "2025-2026",
      previousSchool: "",
      contractAmount: "",
      discountAmount: "0",
      installmentCount: "10",
      firstInstallmentDate: new Date().toISOString().split("T")[0],
      tags: [],
      notes: "",
    });
  };

  // Taksit Tahsilatı Kaydet
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !payingInstallment) return;

    try {
      const res = await fetch(`/api/ogrenciler/${selectedStudent.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: payingInstallment.id,
          paidAmount: parseFloat(payFormData.paidAmount || payingInstallment.amount.toString()),
          isPaid: true,
          paymentMethod: payFormData.paymentMethod,
          receiptNo: payFormData.receiptNo,
          notes: payFormData.notes,
        }),
      });

      if (!res.ok) {
        alert("Tahsilat kaydedilemedi.");
        return;
      }

      setPayingInstallment(null);
      openStudentDetail(selectedStudent.id, "payments");
      fetchData();
    } catch {
      alert("Hata oluştu.");
    }
  };

  // Yoklama Ekle
  const handleAddAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const res = await fetch(`/api/ogrenciler/${selectedStudent.id}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attFormData),
      });

      if (!res.ok) {
        alert("Yoklama eklenemedi.");
        return;
      }

      setAttFormData({
        date: new Date().toISOString().split("T")[0],
        lessonHour: "Tüm Gün",
        status: "ABSENT",
        notes: "",
      });

      openStudentDetail(selectedStudent.id, "attendance");
      fetchData();
    } catch {
      alert("Hata oluştu.");
    }
  };

  // Excel Dışa Aktar
  const handleExportExcel = () => {
    const rows = filteredStudents.map((s) => ({
      "Öğrenci No": s.studentNo || "-",
      "TC Kimlik No": s.tcNo,
      "Adı Soyadı": s.fullName,
      "Sınıfı": s.classroom?.name || "Atanmadı",
      "Durum": STATUS_MAP[s.status]?.label || s.status,
      "Veli İletişim": s.primaryPhone,
      "Toplam Anlaşma (TL)": s.netAmount || 0,
      "Taksit Sayısı": s.installmentCount || 1,
      "Kayıt Tarihi": new Date(s.enrollmentDate).toLocaleDateString("tr-TR"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Öğrenciler");
    XLSX.writeFile(workbook, `Cosmos_Ogrenci_Listesi_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-800 text-white shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Öğrenci Kütüğü & Yönetimi</h1>
            <p className="text-xs text-slate-500 font-medium">
              Öğrenci özlük dosyaları, sınıf atamaları, taksit planları ve MEB sözleşme basımı
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel İndir</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingStudent(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Öğrenci Kaydı</span>
          </button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Toplam Kayıt
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-slate-800">{stats.total}</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
            Aktif Öğrenci
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-emerald-700">{stats.active}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider block">
            Toplam Eğitim Cirosu
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-teal-800 font-mono">
              {stats.totalContractSum.toLocaleString("tr-TR")} ₺
            </span>
            <DollarSign className="w-4 h-4 text-teal-600" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
            Tahsil Edilen Tutar
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-blue-700 font-mono">
              {stats.totalPaidSum.toLocaleString("tr-TR")} ₺
            </span>
            <Receipt className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
            Kalan Alacak / Taksit
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-amber-700 font-mono">
              {stats.totalRemainingSum.toLocaleString("tr-TR")} ₺
            </span>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Arama & Filtre Çubuğu */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Öğrenci adı, no, TC Kimlik, veli adı veya telefon ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Tüm Durumlar</option>
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Tüm Sınıflar</option>
              <option value="UNASSIGNED">Sınıfsız Öğrenciler</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Tüm Etiketler</option>
              <option value="BURSLU">Burslu Öğrenci</option>
              <option value="SERVIS">Okul Servisi</option>
              <option value="YEMEK">Yemek Hizmeti</option>
              <option value="ETUT">Etüt Alan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Öğrenci Tablosu */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Öğrenci Bilgileri</th>
                <th className="py-3 px-4">Sınıf & Seviye</th>
                <th className="py-3 px-4">Veli & İletişim</th>
                <th className="py-3 px-4">Eğitim Ücreti</th>
                <th className="py-3 px-4">Tahsilat Durumu</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm">Kayıtlı öğrenci bulunamadı.</p>
                    <p className="text-xs">Arama kriterlerinizi değiştirebilir veya yeni kayıt ekleyebilirsiniz.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const paidTotal = s.payments.reduce(
                    (sum, p) => sum + (p.paidAmount || (p.isPaid ? p.amount : 0)),
                    0
                  );
                  const remaining = Math.max(0, (s.netAmount || 0) - paidTotal);
                  const statusInfo = STATUS_MAP[s.status] || STATUS_MAP.ACTIVE;

                  return (
                    <tr
                      key={s.id}
                      onClick={() => openStudentDetail(s.id, "profile")}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {s.fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
                              {s.fullName}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              No: {s.studentNo || "-"} • TC: {s.tcNo}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {s.classroom ? (
                          <div>
                            <span className="font-bold text-slate-800">{s.classroom.name}</span>
                            <span className="block text-[11px] text-slate-400">{s.classroom.gradeLevel}. Seviye</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sınıf Atanmadı</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">
                          {s.guardianRelation === "MOTHER"
                            ? s.motherName || s.fatherName
                            : s.fatherName || s.motherName || "Veli"}
                        </p>
                        <p className="font-mono text-teal-700 text-[11px]">{s.primaryPhone}</p>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <p className="font-bold text-slate-800">{s.netAmount.toLocaleString("tr-TR")} ₺</p>
                        <p className="text-[10px] text-slate-400">{s.installmentCount} Taksit</p>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        <p className="text-emerald-700 font-semibold">Ödenen: {paidTotal.toLocaleString("tr-TR")} ₺</p>
                        <p className="text-amber-700">Kalan: {remaining.toLocaleString("tr-TR")} ₺</p>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openStudentDetail(s.id, "payments")}
                            title="Taksit & Finans Defteri"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-teal-50"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openStudentDetail(s.id, "contract")}
                            title="Resmî MEB Sözleşmesi Yazdır"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-purple-700 hover:bg-purple-50"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openStudentDetail(s.id, "attendance")}
                            title="Yoklama & Devamsızlık"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-amber-700 hover:bg-amber-50"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL 1: ÖĞRENCİ DETAY, TAKSİTLER, YOKLAMA & MEB SÖZLEŞMESİ ================= */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-sm">
                  {selectedStudent.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{selectedStudent.fullName}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Öğrenci No: {selectedStudent.studentNo || "-"} • TC: {selectedStudent.tcNo}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openStudentDetail(selectedStudent.id, "contract")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Sözleşme Yazdır</span>
                </button>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Sekmeleri */}
            <div className="flex items-center gap-2 px-5 border-b border-slate-200 bg-white">
              <button
                onClick={() => setDetailTab("profile")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all ${
                  detailTab === "profile"
                    ? "border-teal-700 text-teal-800"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                Özlük & Aile Bilgileri
              </button>
              <button
                onClick={() => setDetailTab("payments")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all ${
                  detailTab === "payments"
                    ? "border-teal-700 text-teal-800"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                Taksit & Finans Defteri ({selectedStudent.payments.length})
              </button>
              <button
                onClick={() => setDetailTab("attendance")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all ${
                  detailTab === "attendance"
                    ? "border-teal-700 text-teal-800"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                Devamsızlık & Yoklama
              </button>
              <button
                onClick={() => setDetailTab("contract")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all ${
                  detailTab === "contract"
                    ? "border-purple-700 text-purple-800"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                📄 Resmî MEB Kayıt Sözleşmesi
              </button>
            </div>

            {/* Modal Gövdesi */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* TAB 1: ÖZLÜK & AİLE */}
              {detailTab === "profile" && (
                <div className="space-y-6">
                  {/* Özet Kartlar */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-semibold">Sınıfı</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {selectedStudent.classroom?.name || "Atanmadı"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-semibold">Kan Grubu</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedStudent.bloodGroup || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-semibold">Doğum Tarihi</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {selectedStudent.birthDate
                          ? new Date(selectedStudent.birthDate).toLocaleDateString("tr-TR")
                          : "-"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-semibold">Kayıt Tarihi</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {new Date(selectedStudent.enrollmentDate).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                  </div>

                  {/* Veli Kartları */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Anne */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-pink-600" /> Anne Bilgileri
                      </h4>
                      <p><strong>Ad Soyad:</strong> {selectedStudent.motherName || "-"}</p>
                      <p><strong>Telefon:</strong> {selectedStudent.motherPhone || "-"}</p>
                      <p><strong>Meslek:</strong> {selectedStudent.motherJob || "-"}</p>
                    </div>

                    {/* Baba */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-600" /> Baba Bilgileri
                      </h4>
                      <p><strong>Ad Soyad:</strong> {selectedStudent.fatherName || "-"}</p>
                      <p><strong>Telefon:</strong> {selectedStudent.fatherPhone || "-"}</p>
                      <p><strong>Meslek:</strong> {selectedStudent.fatherJob || "-"}</p>
                    </div>
                  </div>

                  {/* İletişim & Adres */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Home className="w-4 h-4 text-teal-700" /> İkametgah & Birincil İletişim
                    </h4>
                    <p><strong>SMS & İletişim Tel:</strong> {selectedStudent.primaryPhone}</p>
                    <p><strong>E-Posta:</strong> {selectedStudent.primaryEmail || "-"}</p>
                    <p><strong>İlçe / Bölge:</strong> {selectedStudent.cityDistrict || "-"}</p>
                    <p><strong>Ev Adresi:</strong> {selectedStudent.homeAddress || "Adres girilmemiş"}</p>
                    {selectedStudent.healthNotes && (
                      <p className="text-rose-700 bg-rose-50 p-2 rounded-lg mt-2">
                        <strong>⚠️ Sağlık / Alerji Notları:</strong> {selectedStudent.healthNotes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: TAKSİT & FİNANS DEFTERİ */}
              {detailTab === "payments" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-teal-800 font-semibold block">Sözleşme Tutarı</span>
                      <span className="text-xl font-extrabold text-teal-900 font-mono">
                        {selectedStudent.netAmount.toLocaleString("tr-TR")} ₺
                      </span>
                    </div>
                    <div>
                      <span className="text-teal-800 font-semibold block">Taksit Adedi</span>
                      <span className="text-base font-bold text-teal-900">
                        {selectedStudent.installmentCount} Taksit
                      </span>
                    </div>
                  </div>

                  {/* Taksit Tablosu */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Taksit</th>
                          <th className="py-2.5 px-3">Vade Tarihi</th>
                          <th className="py-2.5 px-3">Tutar</th>
                          <th className="py-2.5 px-3">Tahsilat Durumu</th>
                          <th className="py-2.5 px-3">Ödeme Tarihi</th>
                          <th className="py-2.5 px-3 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {selectedStudent.payments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-bold text-slate-800">{p.title}</td>
                            <td className="py-2.5 px-3 font-mono">
                              {new Date(p.dueDate).toLocaleDateString("tr-TR")}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                              {p.amount.toLocaleString("tr-TR")} ₺
                            </td>
                            <td className="py-2.5 px-3">
                              {p.isPaid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  <Check className="w-3 h-3" /> Ödendi ({p.paidAmount.toLocaleString("tr-TR")} ₺)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                  Bekliyor
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">
                              {p.paidDate ? new Date(p.paidDate).toLocaleDateString("tr-TR") : "-"}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {!p.isPaid ? (
                                <button
                                  onClick={() => {
                                    setPayingInstallment(p);
                                    setPayFormData({
                                      paidAmount: p.amount.toString(),
                                      paymentMethod: "CASH",
                                      receiptNo: `MAK-${new Date().getFullYear()}-${p.installmentNo}`,
                                      notes: "",
                                    });
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-[11px]"
                                >
                                  Tahsil Et
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[11px]">
                                  {p.paymentMethod || "Nakit"}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: DEVAMSIZLIK & YOKLAMA */}
              {detailTab === "attendance" && (
                <div className="space-y-4">
                  {/* Yeni Yoklama Formu */}
                  <form
                    onSubmit={handleAddAttendance}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-end gap-3 text-xs"
                  >
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Tarih</label>
                      <input
                        type="date"
                        value={attFormData.date}
                        onChange={(e) => setAttFormData({ ...attFormData, date: e.target.value })}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Ders / Saat</label>
                      <input
                        type="text"
                        value={attFormData.lessonHour}
                        onChange={(e) => setAttFormData({ ...attFormData, lessonHour: e.target.value })}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Durum</label>
                      <select
                        value={attFormData.status}
                        onChange={(e) => setAttFormData({ ...attFormData, status: e.target.value as any })}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                      >
                        <option value="ABSENT">Gelmedi (Yok)</option>
                        <option value="LATE">Geç Kaldı</option>
                        <option value="EXCUSED">İzinli / Raporlu</option>
                        <option value="PRESENT">Geldi (Var)</option>
                      </select>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                      <label className="block font-semibold text-slate-700 mb-1">Gerekçe / Not</label>
                      <input
                        type="text"
                        placeholder="Örn: Grip raporu var"
                        value={attFormData.notes}
                        onChange={(e) => setAttFormData({ ...attFormData, notes: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs"
                    >
                      Yoklama Ekle
                    </button>
                  </form>

                  {/* Geçmiş Yoklama Listesi */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Tarih</th>
                          <th className="py-2.5 px-3">Ders / Saat</th>
                          <th className="py-2.5 px-3">Durum</th>
                          <th className="py-2.5 px-3">Açıklama</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {!selectedStudent.attendances || selectedStudent.attendances.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-slate-400">
                              Kayıtlı devamsızlık bulunmuyor.
                            </td>
                          </tr>
                        ) : (
                          selectedStudent.attendances.map((att) => {
                            const attInfo = ATTENDANCE_STATUS[att.status] || ATTENDANCE_STATUS.PRESENT;
                            return (
                              <tr key={att.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-mono">
                                  {new Date(att.date).toLocaleDateString("tr-TR")}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600">{att.lessonHour || "Tüm Gün"}</td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${attInfo.color}`}
                                  >
                                    {attInfo.label}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600">{att.notes || "-"}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: MEB KAYIT SÖZLEŞMESİ & TAAHHÜTNAME (PRINTABLE) */}
              {detailTab === "contract" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-purple-50 p-3 rounded-xl border border-purple-200">
                    <span className="text-xs font-bold text-purple-900">
                      📄 Millî Eğitim Bakanlığı Özel Öğretim Kurumları Standart Sözleşmesi
                    </span>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Yazıcıya Gönder (Baskı Al)</span>
                    </button>
                  </div>

                  {/* Sözleşme Belgesi Görünümü */}
                  <div
                    id="printable-contract"
                    className="p-8 bg-white border border-slate-300 rounded-xl shadow-xs text-slate-900 font-serif leading-relaxed text-xs space-y-4"
                  >
                    <div className="text-center border-b pb-4 space-y-1">
                      <h2 className="text-base font-bold uppercase tracking-wider">
                        T.C. MİLLÎ EĞİTİM BAKANLIĞI
                      </h2>
                      <h3 className="text-sm font-semibold uppercase">
                        ÖZEL ÖĞRETİM KURUMLARI ÖĞRENCİ KAYIT SÖZLEŞMESİ VE ÖDEME TAAHHÜTNAMESİ
                      </h3>
                      <p className="text-[10px] text-slate-500 font-sans">
                        Akademik Dönem: {selectedStudent.academicYear} • Sözleşme Tarihi:{" "}
                        {new Date(selectedStudent.enrollmentDate).toLocaleDateString("tr-TR")}
                      </p>
                    </div>

                    {/* Taraflar Tablosu */}
                    <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                      <div className="border border-slate-300 p-3 rounded-lg space-y-1">
                        <span className="font-bold block border-b pb-1 text-slate-800">ÖĞRENCİ BİLGİLERİ</span>
                        <p><strong>Adı Soyadı:</strong> {selectedStudent.fullName}</p>
                        <p><strong>T.C. Kimlik No:</strong> {selectedStudent.tcNo}</p>
                        <p><strong>Öğrenci No:</strong> {selectedStudent.studentNo || "-"}</p>
                        <p><strong>Sınıfı / Şubesi:</strong> {selectedStudent.classroom?.name || "-"}</p>
                      </div>

                      <div className="border border-slate-300 p-3 rounded-lg space-y-1">
                        <span className="font-bold block border-b pb-1 text-slate-800">VELİ / VASİ BİLGİLERİ</span>
                        <p>
                          <strong>Adı Soyadı:</strong>{" "}
                          {selectedStudent.guardianRelation === "MOTHER"
                            ? selectedStudent.motherName
                            : selectedStudent.fatherName || "Veli"}
                        </p>
                        <p><strong>İletişim Tel:</strong> {selectedStudent.primaryPhone}</p>
                        <p><strong>İkametgah:</strong> {selectedStudent.homeAddress || "-"}</p>
                        <p><strong>İl / İlçe:</strong> {selectedStudent.cityDistrict || "-"}</p>
                      </div>
                    </div>

                    {/* Ücret ve Taksit Çizelgesi */}
                    <div className="font-sans space-y-2">
                      <span className="font-bold text-xs block text-slate-800">
                        EĞİTİM ÜCRETİ VE ÖDEME PLANI
                      </span>
                      <div className="border border-slate-300 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 font-bold border-b border-slate-300">
                            <tr>
                              <th className="p-2">Taksit No</th>
                              <th className="p-2">Açıklama</th>
                              <th className="p-2">Vade Tarihi</th>
                              <th className="p-2 text-right">Tutar (TL)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {selectedStudent.payments.map((p) => (
                              <tr key={p.id}>
                                <td className="p-2">{p.installmentNo}</td>
                                <td className="p-2">{p.title}</td>
                                <td className="p-2 font-mono">
                                  {new Date(p.dueDate).toLocaleDateString("tr-TR")}
                                </td>
                                <td className="p-2 font-mono font-bold text-right">
                                  {p.amount.toLocaleString("tr-TR")} ₺
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-slate-50 font-bold">
                              <td colSpan={3} className="p-2 text-right">TOPLAM NET ÜCRET:</td>
                              <td className="p-2 text-right font-mono">
                                {selectedStudent.netAmount.toLocaleString("tr-TR")} ₺
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Hukuki Hükümler */}
                    <div className="text-[10px] text-slate-700 space-y-1 text-justify pt-2">
                      <p>
                        1. İşbu sözleşme 5580 sayılı Özel Öğretim Kurumları Kanunu ve ilgili yönetmelik hükümlerine tabidir.
                      </p>
                      <p>
                        2. Öğrenci velisi, yukarıda vade ve tutarları belirtilen taksitleri zamanında ve eksiksiz olarak ödemeyi gayrikabili rücu kabul ve taahhüt eder.
                      </p>
                      <p>
                        3. Kurum tarafından sağlanan eğitim ve öğretim hizmetlerinin aksamaması esastır. Kayıt iptal ve iade koşullarında Millî Eğitim Bakanlığı Özel Öğretim Kurumları Yönetmeliği hükümleri geçerlidir.
                      </p>
                    </div>

                    {/* İmzalar */}
                    <div className="grid grid-cols-2 pt-8 text-center font-sans font-bold text-xs">
                      <div className="space-y-12">
                        <p>KURUM YETKİLİSİ<br /><span className="text-[10px] font-normal">İmza / Mühür</span></p>
                        <p>_______________________</p>
                      </div>

                      <div className="space-y-12">
                        <p>VELİ / ÖDEME YÜKÜMLÜSÜ<br /><span className="text-[10px] font-normal">Okudum, Anladım, Kabul Ediyorum</span></p>
                        <p>_______________________</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: YENİ ÖĞRENCİ EKLEME ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {editingStudent ? "Öğrenciyi Düzenle" : "Yeni Öğrenci Kesin Kaydı"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Öğrenci özlük bilgileri, veli iletişim ve taksitlendirme sihirbazı
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Temel Bilgiler */}
              <div className="space-y-3">
                <span className="font-bold text-slate-800 block text-xs">1. Öğrenci Özlük Bilgileri</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">T.C. Kimlik No *</label>
                    <input
                      type="text"
                      required
                      maxLength={11}
                      value={formData.tcNo}
                      onChange={(e) => setFormData({ ...formData, tcNo: e.target.value })}
                      placeholder="11 haneli T.C. No"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Öğrenci Adı Soyadı *</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Ad Soyad"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Öğrenci No</label>
                    <input
                      type="text"
                      value={formData.studentNo}
                      onChange={(e) => setFormData({ ...formData, studentNo: e.target.value })}
                      placeholder="Boş bırakılırsa otomatik"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Doğum Tarihi</label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kan Grubu</label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    >
                      <option value="">Seçiniz...</option>
                      <option value="A+">A Rh (+)</option>
                      <option value="A-">A Rh (-)</option>
                      <option value="B+">B Rh (+)</option>
                      <option value="B-">B Rh (-)</option>
                      <option value="AB+">AB Rh (+)</option>
                      <option value="AB-">AB Rh (-)</option>
                      <option value="0+">0 Rh (+)</option>
                      <option value="0-">0 Rh (-)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Sınıf / Şube</label>
                    <select
                      value={formData.classroomId}
                      onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    >
                      <option value="">Sınıf Seçiniz...</option>
                      {classrooms.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Veli & Aile */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <span className="font-bold text-slate-800 block text-xs">2. Veli & Aile İletişim</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Anne Adı</label>
                    <input
                      type="text"
                      value={formData.motherName}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Anne Telefonu</label>
                    <input
                      type="tel"
                      value={formData.motherPhone}
                      onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Baba Adı</label>
                    <input
                      type="text"
                      value={formData.fatherName}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Baba Telefonu</label>
                    <input
                      type="tel"
                      value={formData.fatherPhone}
                      onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Birincil İletişim Tel (SMS Gidecek) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.primaryPhone}
                      onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                      placeholder="05XX XXX XX XX"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">İkametgâh İlçe</label>
                    <input
                      type="text"
                      value={formData.cityDistrict}
                      onChange={(e) => setFormData({ ...formData, cityDistrict: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Finans & Taksit */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <span className="font-bold text-slate-800 block text-xs">3. Eğitim Ücreti & Taksit Planı</span>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Eğitim Ücreti (TL) *</label>
                    <input
                      type="number"
                      required
                      value={formData.contractAmount}
                      onChange={(e) => setFormData({ ...formData, contractAmount: e.target.value })}
                      placeholder="Örn: 90000"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">İndirim (TL)</label>
                    <input
                      type="number"
                      value={formData.discountAmount}
                      onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Taksit Sayısı</label>
                    <select
                      value={formData.installmentCount}
                      onChange={(e) => setFormData({ ...formData, installmentCount: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                    >
                      <option value="1">1 (Peşin)</option>
                      <option value="3">3 Taksit</option>
                      <option value="6">6 Taksit</option>
                      <option value="8">8 Taksit</option>
                      <option value="10">10 Taksit</option>
                      <option value="12">12 Taksit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">İlk Vade Tarihi</label>
                    <input
                      type="date"
                      value={formData.firstInstallmentDate}
                      onChange={(e) => setFormData({ ...formData, firstInstallmentDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-xs"
                >
                  Kaydı Tamamla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: TAHSİLAT AL / MAKBUZ ================= */}
      {payingInstallment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100">
            <div className="p-4 border-b border-slate-100 bg-teal-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">
                Taksit Tahsilatı Al ({payingInstallment.title})
              </h3>
              <button onClick={() => setPayingInstallment(null)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tahsil Edilen Tutar (TL)</label>
                <input
                  type="number"
                  required
                  value={payFormData.paidAmount}
                  onChange={(e) => setPayFormData({ ...payFormData, paidAmount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ödeme Yöntemi</label>
                <select
                  value={payFormData.paymentMethod}
                  onChange={(e) => setPayFormData({ ...payFormData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                >
                  <option value="CASH">Nakit / Elden</option>
                  <option value="BANK_TRANSFER">Banka Havalesi / EFT</option>
                  <option value="CREDIT_CARD">Kredi Kartı / POS</option>
                  <option value="CHEQUE">Çek</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Makbuz / Dekont No</label>
                <input
                  type="text"
                  value={payFormData.receiptNo}
                  onChange={(e) => setPayFormData({ ...payFormData, receiptNo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingInstallment(null)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                >
                  Ödemeyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
