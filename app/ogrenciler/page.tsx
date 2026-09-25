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
  Baby,
  Utensils,
  Bus,
  ShieldCheck,
  Key,
  Copy,
  CheckCheck,
  Lock,
  HeartHandshake,
} from "lucide-react";
import * as XLSX from "xlsx";

interface Classroom {
  id: string;
  name: string;
  gradeLevel: string;
  branch: string | null;
  section?: string | null;
}

const DISCOUNT_TYPES = [
  { id: "STANDART", label: "Standart Liste Fiyatı" },
  { id: "KARDES", label: "Kardeş İndirimi (%10)" },
  { id: "PESIN", label: "Peşin Ödeme İndirimi (%10)" },
  { id: "BURSLU", label: "Başarı Bursu (%25 - %100)" },
  { id: "PERSONEL", label: "Kurum Personeli İndirimi" },
  { id: "ERKEN_KAYIT", label: "Erken Kayıt Avantajı" },
];

const PICKUP_RELATIONS = [
  { id: "ANNEANNE", label: "Anneanne" },
  { id: "BABAANNE", label: "Babaanne" },
  { id: "DEDE", label: "Dede" },
  { id: "TEYZE", label: "Teyze" },
  { id: "HALA", label: "Hala" },
  { id: "DAYI", label: "Dayı" },
  { id: "AMCA", label: "Amca" },
  { id: "BAKICI", label: "Bakıcı / Abla" },
  { id: "SERVIS_REHBERI", label: "Servis Rehberi" },
  { id: "AILE_DOSTU", label: "Aile Dostu" },
  { id: "DIGER", label: "Diğer Yakını" },
];

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

interface AuthorizedPickup {
  name: string;
  relation: string;
  phone: string;
  tcNo?: string;
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
  dietNotes?: string | null;
  toiletTrained?: boolean;
  napTime?: boolean;
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
  authorizedPickups?: AuthorizedPickup[] | any;
  emergencyContact?: string | null;
  section?: "ANAOKULU" | "ILKOKUL" | "ORTAOKUL" | "LISE" | "KURS" | null;
  educationType?: "TAM_GUN" | "YARIM_GUN_SABAH" | "YARIM_GUN_OGLE" | null;
  serviceUsed?: boolean;
  mealUsed?: boolean;
  portalUsername?: string | null;
  portalPassword?: string | null;
  kvkkConsent?: boolean;
  photoConsent?: boolean;
  contractDiscountType?: string | null;
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

const SECTIONS = [
  { id: "ALL", label: "Tüm Kademeler", icon: "🏫" },
  { id: "ANAOKULU", label: "Anaokulu (3-5 Yaş)", icon: "🧸" },
  { id: "ILKOKUL", label: "İlkokul (1-4)", icon: "🎒" },
  { id: "ORTAOKUL", label: "Ortaokul (5-8)", icon: "📚" },
  { id: "LISE", label: "Lise (9-12)", icon: "🎓" },
  { id: "KURS", label: "Kurs & Etüt", icon: "🎯" },
];

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
  const [sectionFilter, setSectionFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");
  const [tagFilter, setTagFilter] = useState("ALL");

  // Modallar
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null); // Detay Modalı
  const [detailTab, setDetailTab] = useState<"profile" | "kindergarten" | "payments" | "attendance" | "contract">("profile");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
    dietNotes: "",
    toiletTrained: true,
    napTime: true,
    section: "ANAOKULU" as "ANAOKULU" | "ILKOKUL" | "ORTAOKUL" | "LISE" | "KURS",
    educationType: "TAM_GUN" as "TAM_GUN" | "YARIM_GUN_SABAH" | "YARIM_GUN_OGLE",
    mealUsed: true,
    serviceUsed: false,
    authorizedPickups: [
      { name: "", relation: "ANNEANNE", phone: "", tcNo: "" },
    ] as AuthorizedPickup[],
    emergencyContact: "",
    portalUsername: "",
    portalPassword: "",
    kvkkConsent: true,
    photoConsent: true,
    contractDiscountType: "STANDART",
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

      const matchSection = sectionFilter === "ALL" || s.section === sectionFilter;
      const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
      const matchClass =
        classFilter === "ALL" ||
        (classFilter === "UNASSIGNED" ? !s.classroomId : s.classroomId === classFilter);

      const matchTag = tagFilter === "ALL" || (s.tags && s.tags.includes(tagFilter));

      return matchSearch && matchSection && matchStatus && matchClass && matchTag;
    });
  }, [students, search, sectionFilter, statusFilter, classFilter, tagFilter]);

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
        if (full.authorizedPickups && typeof full.authorizedPickups === "string") {
          try {
            full.authorizedPickups = JSON.parse(full.authorizedPickups);
          } catch {}
        }
        setSelectedStudent(full);
        setDetailTab(initialTab);
      }
    } catch {
      alert("Öğrenci detayları alınamadı.");
    }
  };

  const addAuthorizedPickup = () => {
    setFormData((prev) => ({
      ...prev,
      authorizedPickups: [
        ...prev.authorizedPickups,
        { name: "", relation: "ANNEANNE", phone: "", tcNo: "" },
      ],
    }));
  };

  const removeAuthorizedPickup = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      authorizedPickups: prev.authorizedPickups.filter((_, idx) => idx !== index),
    }));
  };

  const updateAuthorizedPickup = (index: number, field: keyof AuthorizedPickup, val: string) => {
    setFormData((prev) => {
      const list = [...prev.authorizedPickups];
      list[index] = { ...list[index], [field]: val };
      return { ...prev, authorizedPickups: list };
    });
  };

  const generateRandomPin = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setFormData((prev) => ({ ...prev, portalPassword: pin }));
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
    const defaultPin = Math.floor(100000 + Math.random() * 900000).toString();
    setFormData({
      studentNo: "",
      tcNo: "",
      fullName: "",
      birthDate: "",
      gender: "UNSPECIFIED",
      bloodGroup: "",
      healthNotes: "",
      dietNotes: "",
      toiletTrained: true,
      napTime: true,
      section: "ANAOKULU",
      educationType: "TAM_GUN",
      mealUsed: true,
      serviceUsed: false,
      authorizedPickups: [{ name: "", relation: "ANNEANNE", phone: "", tcNo: "" }],
      emergencyContact: "",
      portalUsername: "",
      portalPassword: defaultPin,
      kvkkConsent: true,
      photoConsent: true,
      contractDiscountType: "STANDART",
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

  const openEditModal = (s: Student) => {
    setEditingStudent(s);
    let parsedPickups = [];
    if (s.authorizedPickups) {
      if (typeof s.authorizedPickups === "string") {
        try { parsedPickups = JSON.parse(s.authorizedPickups); } catch {}
      } else if (Array.isArray(s.authorizedPickups)) {
        parsedPickups = s.authorizedPickups;
      }
    }
    if (parsedPickups.length === 0) {
      parsedPickups = [{ name: "", relation: "ANNEANNE", phone: "", tcNo: "" }];
    }

    setFormData({
      studentNo: s.studentNo || "",
      tcNo: s.tcNo,
      fullName: s.fullName,
      birthDate: s.birthDate ? s.birthDate.split("T")[0] : "",
      gender: s.gender || "UNSPECIFIED",
      bloodGroup: s.bloodGroup || "",
      healthNotes: s.healthNotes || "",
      dietNotes: s.dietNotes || "",
      toiletTrained: s.toiletTrained ?? true,
      napTime: s.napTime ?? true,
      section: (s.section as any) || "ANAOKULU",
      educationType: (s.educationType as any) || "TAM_GUN",
      mealUsed: s.mealUsed ?? true,
      serviceUsed: s.serviceUsed ?? false,
      authorizedPickups: parsedPickups,
      emergencyContact: s.emergencyContact || "",
      portalUsername: s.portalUsername || `veli.${s.tcNo.slice(-6)}`,
      portalPassword: s.portalPassword || Math.floor(100000 + Math.random() * 900000).toString(),
      kvkkConsent: s.kvkkConsent ?? true,
      photoConsent: s.photoConsent ?? true,
      contractDiscountType: s.contractDiscountType || "STANDART",
      fatherName: s.fatherName || "",
      fatherPhone: s.fatherPhone || "",
      fatherJob: s.fatherJob || "",
      motherName: s.motherName || "",
      motherPhone: s.motherPhone || "",
      motherJob: s.motherJob || "",
      guardianRelation: s.guardianRelation || "FATHER",
      primaryPhone: s.primaryPhone,
      primaryEmail: s.primaryEmail || "",
      homeAddress: s.homeAddress || "",
      cityDistrict: s.cityDistrict || "",
      classroomId: s.classroomId || "",
      academicYear: s.academicYear || "2025-2026",
      previousSchool: s.previousSchool || "",
      contractAmount: s.contractAmount ? s.contractAmount.toString() : "",
      discountAmount: s.discountAmount ? s.discountAmount.toString() : "0",
      installmentCount: s.installmentCount ? s.installmentCount.toString() : "10",
      firstInstallmentDate: new Date().toISOString().split("T")[0],
      tags: s.tags ? s.tags.split(",") : [],
      notes: s.notes || "",
    });
    setIsAddModalOpen(true);
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

        {/* Kademe Filtre Butonları */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <School className="w-3.5 h-3.5 text-teal-700" /> Kademe:
          </span>
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setSectionFilter(sec.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                sectionFilter === sec.id
                  ? "bg-teal-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{sec.icon}</span>
              <span>{sec.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Öğrenci Tablosu */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Öğrenci Bilgileri</th>
                <th className="py-3 px-4">Kademe & Sınıf</th>
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
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {s.section && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                  {s.section === "ANAOKULU" ? "🧸 Anaokulu" :
                                   s.section === "ILKOKUL" ? "🎒 İlkokul" :
                                   s.section === "ORTAOKUL" ? "📚 Ortaokul" :
                                   s.section === "LISE" ? "🎓 Lise" : "🎯 Kurs"}
                                </span>
                              )}
                              {s.educationType && (
                                <span className="text-[9px] font-medium px-1 rounded bg-teal-50 text-teal-700">
                                  {s.educationType === "TAM_GUN" ? "Tam Gün" : "Yarım Gün"}
                                </span>
                              )}
                            </div>
                            <p className="font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
                              {s.fullName}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              No: {s.studentNo || "-"} • TC: {s.tcNo}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              {s.mealUsed && <span title="Yemek Hizmeti Alıyor" className="text-[9px] px-1 rounded bg-amber-50 text-amber-700 border border-amber-200">🥗 Yemek</span>}
                              {s.serviceUsed && <span title="Okul Servisi Kullanıyor" className="text-[9px] px-1 rounded bg-blue-50 text-blue-700 border border-blue-200">🚌 Servis</span>}
                              {s.section === "ANAOKULU" && s.toiletTrained && <span title="Tuvalet Eğitimi Var" className="text-[9px] px-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">🚽 Tuvalet</span>}
                              {s.section === "ANAOKULU" && s.napTime && <span title="Dinlenme / Uyku Odası Var" className="text-[9px] px-1 rounded bg-purple-50 text-purple-700 border border-purple-200">🛏️ Uyku</span>}
                            </div>
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
                            onClick={() => openEditModal(s)}
                            title="Öğrenci Bilgilerini Düzenle"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
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
            <div className="flex items-center gap-2 px-5 border-b border-slate-200 bg-white overflow-x-auto">
              <button
                onClick={() => setDetailTab("profile")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  detailTab === "profile"
                    ? "border-teal-700 text-teal-800"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                Özlük & Aile Bilgileri
              </button>
              <button
                onClick={() => setDetailTab("kindergarten")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  detailTab === "kindergarten"
                    ? "border-amber-600 text-amber-800"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                <Baby className="w-3.5 h-3.5 text-amber-600" />
                <span>Anaokulu & Sağlık / Güvenlik</span>
              </button>
              <button
                onClick={() => setDetailTab("payments")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  detailTab === "payments"
                    ? "border-teal-700 text-teal-800"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                Taksit & Finans Defteri ({selectedStudent.payments.length})
              </button>
              <button
                onClick={() => setDetailTab("attendance")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  detailTab === "attendance"
                    ? "border-teal-700 text-teal-800"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                Devamsızlık & Yoklama
              </button>
              <button
                onClick={() => setDetailTab("contract")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
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
                      <span className="text-slate-400 block font-semibold">Kademe & Sınıf</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                          {selectedStudent.section === "ANAOKULU" ? "🧸 Anaokulu" :
                           selectedStudent.section === "ILKOKUL" ? "🎒 İlkokul" :
                           selectedStudent.section === "ORTAOKUL" ? "📚 Ortaokul" :
                           selectedStudent.section === "LISE" ? "🎓 Lise" : "🎯 Kurs"}
                        </span>
                      </div>
                      <span className="font-bold text-slate-800 text-sm block mt-0.5">
                        {selectedStudent.classroom?.name || "Sınıf Atanmadı"}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-semibold">Öğrenim Şekli</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {selectedStudent.educationType === "TAM_GUN"
                          ? "Tam Gün (08:30 - 17:30)"
                          : selectedStudent.educationType === "YARIM_GUN_SABAH"
                          ? "Yarım Gün (Sabah)"
                          : selectedStudent.educationType === "YARIM_GUN_OGLE"
                          ? "Yarım Gün (Öğle)"
                          : "Tam Gün"}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-semibold">Kan Grubu & Doğum</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {selectedStudent.bloodGroup || "-"} •{" "}
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

              {/* TAB 1.5: ANAOKULU, SAĞLIK, YETKİLİ TESLİM VE VELİ PORTALI */}
              {detailTab === "kindergarten" && (
                <div className="space-y-6 text-xs">
                  {/* Okul Öncesi & Hizmet Durumu */}
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                    <h4 className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                      <Baby className="w-4 h-4 text-amber-700" /> Okul Öncesi Gelişim & Temel İhtiyaçlar
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-white rounded-xl border border-amber-200/70">
                        <span className="text-slate-400 font-semibold block text-[11px]">Tuvalet Eğitimi</span>
                        <span className="font-bold text-slate-800 text-xs">
                          {selectedStudent.toiletTrained ? "✅ Tamamlandı" : "⚠️ Destekleniyor"}
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-amber-200/70">
                        <span className="text-slate-400 font-semibold block text-[11px]">Öğle Uykusu / Dinlenme</span>
                        <span className="font-bold text-slate-800 text-xs">
                          {selectedStudent.napTime ? "✅ Uyku Odası Var" : "❌ Uyku Almıyor"}
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-amber-200/70">
                        <span className="text-slate-400 font-semibold block text-[11px]">Yemek / Öğün Hizmeti</span>
                        <span className="font-bold text-slate-800 text-xs">
                          {selectedStudent.mealUsed ? "🥗 3 Öğün Dahil" : "❌ Hariç"}
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-amber-200/70">
                        <span className="text-slate-400 font-semibold block text-[11px]">Servis Ulaşımı</span>
                        <span className="font-bold text-slate-800 text-xs">
                          {selectedStudent.serviceUsed ? "🚌 Okul Servisi" : "Ailesi Getiriyor"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Özel Diyet & Beslenme Hassasiyetleri */}
                  <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
                    <h4 className="font-bold text-rose-900 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                      <Utensils className="w-4 h-4 text-rose-700" /> Özel Diyet, Gıda Alerjileri ve Beslenme Notları
                    </h4>
                    <p className="text-slate-700 bg-white p-3 rounded-xl border border-rose-100 font-medium">
                      {selectedStudent.dietNotes || "Öğrenci için kayıtlı herhangi bir gıda alerjisi veya özel diyet kısıtlaması bulunmamaktadır."}
                    </p>
                  </div>

                  {/* Yetkili Teslim Kişileri */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                        <ShieldCheck className="w-4 h-4 text-teal-700" /> Okuldan Teslim Almaya Yetkili Şahıslar (Anne & Baba Harici)
                      </h4>
                      <span className="text-[10px] text-slate-400">Kimlik ve telefon teyidi zorunludur</span>
                    </div>

                    {(!selectedStudent.authorizedPickups || (Array.isArray(selectedStudent.authorizedPickups) && selectedStudent.authorizedPickups.length === 0)) ? (
                      <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400">
                        Anne ve baba haricinde öğrenciyi teslim almaya yetkili başka bir şahıs tanımlanmamış.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(Array.isArray(selectedStudent.authorizedPickups)
                          ? selectedStudent.authorizedPickups
                          : []
                        ).map((p: any, idx: number) => (
                          <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">{p.name || "İsimsiz Yetkili"}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                                  {p.relation || "Yakını"}
                                </span>
                              </div>
                              <p className="font-mono text-teal-700 mt-1">📞 {p.phone || "Tel yok"}</p>
                              {p.tcNo && <p className="font-mono text-slate-500 text-[10px]">T.C: {p.tcNo}</p>}
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                              Onaylı
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Veli Bilgilendirme Portalı Giriş Bilgileri */}
                  <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-indigo-700" />
                        <div>
                          <h4 className="font-bold text-indigo-950 text-xs">Veli & Öğrenci Bilgilendirme Portalı</h4>
                          <p className="text-[10px] text-indigo-700">Mobil ve web üzerinden devamsızlık, yemek listesi ve bülten takibi</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedStudent.kvkkConsent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            KVKK Onaylı
                          </span>
                        )}
                        {selectedStudent.photoConsent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            Fotoğraf İzni Var
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-indigo-100 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Giriş Adresi</span>
                        <span className="font-mono font-bold text-slate-800">https://veli.cosmos.k12.tr</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Kullanıcı Adı</span>
                        <span className="font-mono font-bold text-indigo-900">
                          {selectedStudent.portalUsername || `veli.${selectedStudent.tcNo.slice(-6)}`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Geçici PIN / Şifre</span>
                          <span className="font-mono font-extrabold text-slate-900 text-sm tracking-widest">
                            {selectedStudent.portalPassword || "123456"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const creds = `COSMOS Veli Portalı Bilgileri:\nWeb: https://veli.cosmos.k12.tr\nKullanıcı: ${selectedStudent.portalUsername || `veli.${selectedStudent.tcNo.slice(-6)}`}\nŞifre: ${selectedStudent.portalPassword || "123456"}`;
                            navigator.clipboard.writeText(creds);
                            setCopiedKey(selectedStudent.id);
                            setTimeout(() => setCopiedKey(null), 2000);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-all shadow-xs"
                        >
                          {copiedKey === selectedStudent.id ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === selectedStudent.id ? "Kopyalandı" : "Bilgileri Kopyala"}</span>
                        </button>
                      </div>
                    </div>
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
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-700" />
                      <div>
                        <span className="text-xs font-bold text-purple-950 block">
                          T.C. Millî Eğitim Bakanlığı Standart Öğrenci Kayıt Sözleşmesi & Taahhütnamesi (Ek-1)
                        </span>
                        <span className="text-[10px] text-purple-700">
                          Resmî MEB sözleşmesi, okul öncesi güvenlik taahhütleri, yetkili teslim tutanağı ve veli portal fişi
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Yazıcıya Gönder (Baskı Al / PDF)</span>
                    </button>
                  </div>

                  {/* Sözleşme Belgesi Görünümü */}
                  <div
                    id="printable-contract"
                    className="p-8 bg-white border border-slate-300 rounded-xl shadow-xs text-slate-900 font-serif leading-relaxed text-xs space-y-5"
                  >
                    {/* Kurum & Başlık */}
                    <div className="text-center border-b-2 border-slate-800 pb-4 space-y-1">
                      <div className="flex items-center justify-between font-sans text-[11px] text-slate-500 font-bold mb-1">
                        <span>T.C. MİLLÎ EĞİTİM BAKANLIĞI</span>
                        <span className="font-mono">SÖZ-NO: {selectedStudent.academicYear}-{(selectedStudent.studentNo || selectedStudent.tcNo.slice(-6))}</span>
                      </div>
                      <h2 className="text-base font-extrabold uppercase tracking-wider font-sans text-slate-950">
                        ÖZEL COSMOS EĞİTİM KURUMLARI
                      </h2>
                      <h3 className="text-xs font-bold uppercase font-sans text-slate-800">
                        ÖZEL ÖĞRETİM KURUMLARI ÖĞRENCİ KAYIT SÖZLEŞMESİ, SERVİS/YEMEK VE YETKİLİ TESLİM TAAHHÜTNAMESİ
                      </h3>
                      <p className="text-[10px] text-slate-500 font-sans">
                        Akademik Dönem: <strong>{selectedStudent.academicYear}</strong> • Kayıt / Sözleşme Tarihi:{" "}
                        <strong>{new Date(selectedStudent.enrollmentDate).toLocaleDateString("tr-TR")}</strong>
                      </p>
                    </div>

                    {/* Taraflar Tablosu */}
                    <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                      <div className="border border-slate-300 p-3.5 rounded-lg space-y-1.5 bg-slate-50/50">
                        <span className="font-bold block border-b pb-1 text-slate-800 text-[11px] uppercase tracking-wide">
                          1. ÖĞRENCİ ÖZLÜK VE KADEME BİLGİLERİ
                        </span>
                        <div className="space-y-1 text-[11px]">
                          <p><strong>Adı Soyadı:</strong> {selectedStudent.fullName}</p>
                          <p><strong>T.C. Kimlik No:</strong> {selectedStudent.tcNo}</p>
                          <p><strong>Öğrenci No:</strong> {selectedStudent.studentNo || "Atanacak"}</p>
                          <p><strong>Doğum Tarihi & Kan:</strong> {selectedStudent.birthDate ? new Date(selectedStudent.birthDate).toLocaleDateString("tr-TR") : "-"} ({selectedStudent.bloodGroup || "Belirtilmedi"})</p>
                          <p>
                            <strong>Eğitim Kademesi:</strong>{" "}
                            {selectedStudent.section === "ANAOKULU"
                              ? "🧸 Okul Öncesi / Anaokulu"
                              : selectedStudent.section === "ILKOKUL"
                              ? "🎒 İlkokul"
                              : selectedStudent.section === "ORTAOKUL"
                              ? "📚 Ortaokul"
                              : selectedStudent.section === "LISE"
                              ? "🎓 Lise"
                              : selectedStudent.section === "KURS"
                              ? "🎯 Kurs & Etüt"
                              : "Anaokulu"}
                          </p>
                          <p><strong>Sınıf / Şube:</strong> {selectedStudent.classroom?.name || "Belirlenmedi"}</p>
                          <p>
                            <strong>Öğrenim Türü:</strong>{" "}
                            {selectedStudent.educationType === "TAM_GUN"
                              ? "Tam Gün (08:30 - 17:30)"
                              : selectedStudent.educationType === "YARIM_GUN_SABAH"
                              ? "Yarım Gün (Sabah: 08:30 - 12:30)"
                              : selectedStudent.educationType === "YARIM_GUN_OGLE"
                              ? "Yarım Gün (Öğle: 13:00 - 17:30)"
                              : "Tam Gün"}
                          </p>
                        </div>
                      </div>

                      <div className="border border-slate-300 p-3.5 rounded-lg space-y-1.5 bg-slate-50/50">
                        <span className="font-bold block border-b pb-1 text-slate-800 text-[11px] uppercase tracking-wide">
                          2. VELİ / VASİ / ÖDEME YÜKÜMLÜSÜ
                        </span>
                        <div className="space-y-1 text-[11px]">
                          <p>
                            <strong>Veli Adı Soyadı:</strong>{" "}
                            {selectedStudent.guardianRelation === "MOTHER"
                              ? selectedStudent.motherName || "Anne"
                              : selectedStudent.fatherName || selectedStudent.motherName || "Baba"}
                          </p>
                          <p><strong>Yakınlık Derecesi:</strong> {selectedStudent.guardianRelation === "MOTHER" ? "Anne" : selectedStudent.guardianRelation === "FATHER" ? "Baba" : "Vasi"}</p>
                          <p><strong>SMS & İletişim Tel:</strong> {selectedStudent.primaryPhone}</p>
                          <p><strong>E-Posta:</strong> {selectedStudent.primaryEmail || "-"}</p>
                          <p><strong>Anne İletişim:</strong> {selectedStudent.motherName ? `${selectedStudent.motherName} (${selectedStudent.motherPhone || "Tel yok"})` : "-"}</p>
                          <p><strong>Baba İletişim:</strong> {selectedStudent.fatherName ? `${selectedStudent.fatherName} (${selectedStudent.fatherPhone || "Tel yok"})` : "-"}</p>
                          <p><strong>İkametgah Adresi:</strong> {selectedStudent.homeAddress || selectedStudent.cityDistrict || "Kurum kayıtlarında saklıdır."}</p>
                        </div>
                      </div>
                    </div>

                    {/* Okul Öncesi Güvenlik, Beslenme ve Sağlık Taahhütleri */}
                    <div className="border border-slate-300 p-3.5 rounded-lg space-y-2 text-[11px] font-sans bg-amber-50/30">
                      <span className="font-bold block text-slate-800 text-[11px] uppercase tracking-wide border-b pb-1 border-slate-200">
                        3. OKUL ÖNCESİ BAKIM, BESLENME, SERVİS VE SAĞLIK PROTOKOLÜ
                      </span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <span className="text-slate-400 block text-[9px] font-bold uppercase">Yemek Hizmeti</span>
                          <span className="font-bold text-slate-800">
                            {selectedStudent.mealUsed ? "✅ 3 Öğün Dahil" : "❌ Yemek Hariç"}
                          </span>
                        </div>
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <span className="text-slate-400 block text-[9px] font-bold uppercase">Servis Ulaşımı</span>
                          <span className="font-bold text-slate-800">
                            {selectedStudent.serviceUsed ? "🚌 Okul Servisi" : "Ailesi Teslim Eder"}
                          </span>
                        </div>
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <span className="text-slate-400 block text-[9px] font-bold uppercase">Tuvalet Alışkanlığı</span>
                          <span className="font-bold text-slate-800">
                            {selectedStudent.toiletTrained ? "✅ Tamamlandı" : "⚠️ Destekleniyor"}
                          </span>
                        </div>
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <span className="text-slate-400 block text-[9px] font-bold uppercase">Öğle Uykusu Odası</span>
                          <span className="font-bold text-slate-800">
                            {selectedStudent.napTime ? "✅ Uyku Odası Var" : "❌ Uyku Almıyor"}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <strong className="text-rose-700">⚠️ Özel Diyet & Beslenme Alerjileri:</strong>{" "}
                          <span className="text-slate-700 font-medium">
                            {selectedStudent.dietNotes || "Öğrenciye ait herhangi bir gıda alerjisi veya beslenme kısıtlaması bulunmamaktadır."}
                          </span>
                        </div>
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <strong className="text-blue-700">🩺 Sağlık / Kronik Durum Beyanı:</strong>{" "}
                          <span className="text-slate-700 font-medium">
                            {selectedStudent.healthNotes || "Düzenli ilaç kullanımı veya kronik bir sağlık engeli beyan edilmemiştir."}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Yetkili Teslim Tutanağı */}
                    <div className="border border-slate-300 p-3.5 rounded-lg space-y-2 text-[11px] font-sans">
                      <div className="flex items-center justify-between border-b pb-1 border-slate-200">
                        <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                          4. ÖĞRENCİYİ OKULDAN TESLİM ALMAYA YETKİLİ KİŞİLER (ANNE VE BABA HARİCİ)
                        </span>
                        <span className="text-[9px] text-rose-700 font-bold">
                          * Kimlik teyidi yapılmadan bu şahıslar haricinde kimseye teslim edilmez.
                        </span>
                      </div>

                      {(() => {
                        let pickups: any[] = [];
                        if (Array.isArray(selectedStudent.authorizedPickups)) {
                          pickups = selectedStudent.authorizedPickups;
                        } else if (typeof selectedStudent.authorizedPickups === "string") {
                          try { pickups = JSON.parse(selectedStudent.authorizedPickups); } catch {}
                        }
                        if (pickups.length === 0) {
                          return (
                            <p className="text-slate-500 italic p-2 bg-slate-50 rounded border border-dashed border-slate-200 text-center">
                              Anne ve baba haricinde öğrenciyi okuldan teslim almaya yetkili 3. şahıs tanımlanmamıştır.
                            </p>
                          );
                        }
                        return (
                          <table className="w-full text-left text-xs border border-slate-200 rounded">
                            <thead className="bg-slate-100 font-bold border-b border-slate-200 text-[10px]">
                              <tr>
                                <th className="p-1.5">Sıra</th>
                                <th className="p-1.5">Adı Soyadı</th>
                                <th className="p-1.5">Yakınlık Derecesi</th>
                                <th className="p-1.5">T.C. Kimlik No</th>
                                <th className="p-1.5">İletişim Telefonu</th>
                                <th className="p-1.5 text-center">Durum</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-[11px]">
                              {pickups.map((p, idx) => (
                                <tr key={idx}>
                                  <td className="p-1.5 font-mono text-slate-500">{idx + 1}</td>
                                  <td className="p-1.5 font-bold text-slate-800">{p.name || "-"}</td>
                                  <td className="p-1.5">{p.relation || "Yakını"}</td>
                                  <td className="p-1.5 font-mono">{p.tcNo || "-"}</td>
                                  <td className="p-1.5 font-mono text-teal-800 font-bold">{p.phone || "-"}</td>
                                  <td className="p-1.5 text-center">
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                      Yetkili
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>

                    {/* Ücret ve Taksit Çizelgesi */}
                    <div className="font-sans space-y-2">
                      <div className="flex items-center justify-between border-b pb-1 border-slate-300">
                        <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                          5. EĞİTİM ÜCRETİ VE ÖDEME TAAHHÜTNAMESİ
                        </span>
                        <span className="text-[10px] text-slate-600 font-medium">
                          Uygulanan Tarife: <strong>{selectedStudent.contractDiscountType ? (DISCOUNT_TYPES.find(d => d.id === selectedStudent.contractDiscountType)?.label || selectedStudent.contractDiscountType) : "Standart Tarife"}</strong>
                        </span>
                      </div>

                      <div className="border border-slate-300 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 font-bold border-b border-slate-300 text-[11px]">
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
                                <td className="p-2 font-mono">{p.installmentNo}</td>
                                <td className="p-2">{p.title}</td>
                                <td className="p-2 font-mono">
                                  {new Date(p.dueDate).toLocaleDateString("tr-TR")}
                                </td>
                                <td className="p-2 font-mono font-bold text-right">
                                  {p.amount.toLocaleString("tr-TR")} ₺
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-slate-50 font-bold text-[11px]">
                              <td colSpan={3} className="p-2 text-right">TOPLAM NET SÖZLEŞME BEDELİ:</td>
                              <td className="p-2 text-right font-mono text-teal-900 text-sm">
                                {selectedStudent.netAmount.toLocaleString("tr-TR")} ₺
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Hukuki Hükümler & KVKK Metni */}
                    <div className="text-[10px] text-slate-700 space-y-1 text-justify pt-1 border-t border-slate-200">
                      <p>
                        <strong>1. Mevzuat Hükümleri:</strong> İşbu sözleşme 5580 sayılı Özel Öğretim Kurumları Kanunu, Millî Eğitim Bakanlığı Özel Öğretim Kurumları Yönetmeliği ve ilgili mevzuat hükümlerine tabidir.
                      </p>
                      <p>
                        <strong>2. Ödeme Taahhüdü:</strong> Öğrenci velisi/vasisi, yukarıdaki taksit tablosunda belirlenen vadelerde kurumun banka hesabına veya yetkili veznesine ödemeleri eksiksiz ifa etmeyi gayrikabili rücu kabul ve taahhüt eder.
                      </p>
                      <p>
                        <strong>3. KVKK ve Görsel Paylaşım İzni:</strong> 6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca öğrenci ve veliye ait verilerin eğitim-öğretim takibi amacıyla işlenmesi kabul edilmiştir. (Fotoğraf & Etkinlik Paylaşım İzni: <strong>{selectedStudent.photoConsent ? "ONAYLANDI" : "ONAYLANMADI"}</strong>).
                      </p>
                    </div>

                    {/* Kesilebilir Veli Portalı Bilgilendirme Fişi */}
                    <div className="border-t-2 border-dashed border-slate-400 pt-3 text-[10px] font-sans">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-bold text-slate-900 text-[11px]">
                            <Key className="w-3.5 h-3.5 text-indigo-700" />
                            <span>VELİ BİLGİLENDİRME PORTALI ERİŞİM FİŞİ (Bu kısmı kesip veliye teslim ediniz)</span>
                          </div>
                          <p className="text-slate-500">Mobil uygulama ve web üzerinden devamsızlık, yemek bülteni ve taksit takibi</p>
                        </div>
                        <div className="text-right font-mono text-[11px]">
                          <p>Web: <strong>https://veli.cosmos.k12.tr</strong></p>
                          <p>Kullanıcı: <strong>{selectedStudent.portalUsername || `veli.${selectedStudent.tcNo.slice(-6)}`}</strong> • PIN: <strong>{selectedStudent.portalPassword || "123456"}</strong></p>
                        </div>
                      </div>
                    </div>

                    {/* İmzalar */}
                    <div className="grid grid-cols-2 pt-4 text-center font-sans font-bold text-xs">
                      <div className="space-y-12">
                        <p>KURUM MÜDÜRÜ / TEMSİLCİSİ<br /><span className="text-[10px] font-normal">İmza / Resmî Kurum Mührü</span></p>
                        <p>_______________________</p>
                      </div>

                      <div className="space-y-12">
                        <p>VELİ / ÖDEME YÜKÜMLÜSÜ<br /><span className="text-[10px] font-normal">Okudum, anladım, bir nüshasını elden teslim aldım</span></p>
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

      {/* ================= MODAL 2: YENİ ÖĞRENCİ EKLEME & DÜZENLEME ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-teal-50/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm md:text-base">
                    {editingStudent ? `Öğrenci Kaydını Güncelle: ${editingStudent.fullName}` : "Yeni Öğrenci Kesin Kayıt Sihirbazı"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Okul öncesi / anaokulu, kütük özlük, veli portalı, yetkili teslim tutanağı ve MEB sözleşmesi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* BÖLÜM 1: EĞİTİM KADEMESİ & ÖĞRENİM ŞEKLİ */}
              <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-950 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                    <School className="w-4 h-4 text-teal-700" /> 1. Eğitim Kademesi, Öğrenim Şekli & Şube
                  </span>
                  <span className="text-[11px] text-teal-700 font-medium">Kademeye göre gelişim ve beslenme alanları açılır</span>
                </div>

                {/* Kademe Seçici Butonlar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {SECTIONS.filter((sec) => sec.id !== "ALL").map((sec) => {
                    const isSelected = formData.section === sec.id;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, section: sec.id as any })}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span>{sec.icon}</span>
                        <span>{sec.label.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Öğrenim Şekli</label>
                    <select
                      value={formData.educationType}
                      onChange={(e) => setFormData({ ...formData, educationType: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    >
                      <option value="TAM_GUN">Tam Gün (08:30 - 17:30)</option>
                      <option value="YARIM_GUN_SABAH">Yarım Gün Sabah (08:30 - 12:30)</option>
                      <option value="YARIM_GUN_OGLE">Yarım Gün Öğle (13:00 - 17:30)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Sınıf / Şube Ataması</label>
                    <select
                      value={formData.classroomId}
                      onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    >
                      <option value="">Atanmadı (Sonra Ata)</option>
                      {classrooms
                        .filter((c) => !c.section || c.section === formData.section)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.branch ? `(${c.branch} Şubesi)` : ""}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* BÖLÜM 2: ÖĞRENCİ ÖZLÜK BİLGİLERİ */}
              <div className="space-y-3">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                  <Users className="w-4 h-4 text-slate-600" /> 2. Öğrenci Resmî Özlük Bilgileri
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">T.C. Kimlik No *</label>
                    <input
                      type="text"
                      required
                      maxLength={11}
                      value={formData.tcNo}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setFormData({
                          ...formData,
                          tcNo: val,
                          portalUsername: formData.portalUsername || (val.length >= 6 ? `veli.${val.slice(-6)}` : ""),
                        });
                      }}
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
                      placeholder="Örn: Yusuf Ziya Kaya"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Öğrenci No</label>
                    <input
                      type="text"
                      value={formData.studentNo}
                      onChange={(e) => setFormData({ ...formData, studentNo: e.target.value })}
                      placeholder="Boş bırakılırsa otomatik üretilir"
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
                    <label className="block font-semibold text-slate-700 mb-1">Cinsiyet</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    >
                      <option value="UNSPECIFIED">Belirtilmedi</option>
                      <option value="MALE">Erkek</option>
                      <option value="FEMALE">Kız</option>
                    </select>
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
                </div>
              </div>

              {/* BÖLÜM 3: OKUL ÖNCESİ BAKIM, BESLENME, SERVİS VE SAĞLIK PROTOKOLÜ */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                    <Baby className="w-4 h-4 text-amber-700" /> 3. Okul Öncesi Gelişim, Sağlık, Beslenme & Servis
                  </span>
                  <span className="text-[10px] text-amber-800 font-semibold">Anaokulu & İlkokul Güvenlik Protokolü</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-amber-200">
                    <label className="block font-semibold text-slate-700 mb-1.5 text-[11px]">Tuvalet Eğitimi</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, toiletTrained: true })}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                          formData.toiletTrained ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Tamamlandı
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, toiletTrained: false })}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                          !formData.toiletTrained ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Destekleniyor
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-amber-200">
                    <label className="block font-semibold text-slate-700 mb-1.5 text-[11px]">Öğle Uykusu Odası</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, napTime: true })}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                          formData.napTime ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Uyku Var
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, napTime: false })}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                          !formData.napTime ? "bg-slate-400 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Uyku Yok
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-amber-200">
                    <label className="block font-semibold text-slate-700 mb-1.5 text-[11px]">Yemek / Öğün Hizmeti</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, mealUsed: true })}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                          formData.mealUsed ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        3 Öğün Dahil
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, mealUsed: false })}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                          !formData.mealUsed ? "bg-slate-400 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Hariç
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-amber-200">
                    <label className="block font-semibold text-slate-700 mb-1.5 text-[11px]">Servis Ulaşımı</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, serviceUsed: true })}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                          formData.serviceUsed ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Okul Servisi
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, serviceUsed: false })}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                          !formData.serviceUsed ? "bg-slate-400 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Ailesi Alır
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Özel Diyet, Gıda Alerjisi & Beslenme Hassasiyetleri
                    </label>
                    <input
                      type="text"
                      value={formData.dietNotes}
                      onChange={(e) => setFormData({ ...formData, dietNotes: e.target.value })}
                      placeholder="Örn: Laktozsuz süt, yumurta alerjisi, çilek hassasiyeti..."
                      className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Kronik Rahatsızlık, İlaç & Sağlık Notları
                    </label>
                    <input
                      type="text"
                      value={formData.healthNotes}
                      onChange={(e) => setFormData({ ...formData, healthNotes: e.target.value })}
                      placeholder="Örn: Astım spreyi var, ateşlendiğinde derhal aransın..."
                      className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* BÖLÜM 4: VELİ & AİLE İLETİŞİM BİLGİLERİ */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                    <Phone className="w-4 h-4 text-slate-600" /> 4. Veli & Aile İletişim Bilgileri
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-slate-500 font-semibold">Resmî Veli / Vasi:</label>
                    <select
                      value={formData.guardianRelation}
                      onChange={(e) => setFormData({ ...formData, guardianRelation: e.target.value })}
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-bold"
                    >
                      <option value="FATHER">Baba</option>
                      <option value="MOTHER">Anne</option>
                      <option value="GUARDIAN">Yasal Vasi</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Anne Adı Soyadı</label>
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
                    <label className="block font-semibold text-slate-700 mb-1">Anne Mesleği</label>
                    <input
                      type="text"
                      value={formData.motherJob}
                      onChange={(e) => setFormData({ ...formData, motherJob: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Baba Adı Soyadı</label>
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
                    <label className="block font-semibold text-slate-700 mb-1">Baba Mesleği</label>
                    <input
                      type="text"
                      value={formData.fatherJob}
                      onChange={(e) => setFormData({ ...formData, fatherJob: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-teal-800 mb-1">
                      Birincil İletişim / SMS Hattı *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.primaryPhone}
                      onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                      placeholder="05XX XXX XX XX"
                      className="w-full px-3 py-2 rounded-xl border border-teal-300 bg-teal-50/50 text-xs font-mono font-bold focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Veli E-Posta</label>
                    <input
                      type="email"
                      value={formData.primaryEmail}
                      onChange={(e) => setFormData({ ...formData, primaryEmail: e.target.value })}
                      placeholder="veli@cosmos.k12.tr"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">İlçe / Bölge</label>
                    <input
                      type="text"
                      value={formData.cityDistrict}
                      onChange={(e) => setFormData({ ...formData, cityDistrict: e.target.value })}
                      placeholder="Örn: Çankaya / Ankara"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Açık Ev / İkametgâh Adresi</label>
                  <input
                    type="text"
                    value={formData.homeAddress}
                    onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                    placeholder="Mahalle, Cadde, Sokak, No, Daire..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>
              </div>

              {/* BÖLÜM 5: OKULDAN TESLİM ALMAYA YETKİLİ KİŞİLER (ANNE & BABA HARİCİ) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                      <ShieldCheck className="w-4 h-4 text-teal-700" /> 5. Okuldan Teslim Almaya Yetkili Kişiler (Anne & Baba Harici)
                    </span>
                    <p className="text-[10px] text-slate-500">Güvenlik gereği kimlik teyidi yapılmadan teslim edilmez.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addAuthorizedPickup}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-[11px] shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Yetkili Ekle</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.authorizedPickups.map((pickup, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center gap-2 text-xs"
                    >
                      <div className="w-6 text-slate-400 font-bold text-center font-mono">{idx + 1}.</div>
                      <div className="flex-1 min-w-[140px]">
                        <input
                          type="text"
                          placeholder="Yetkili Adı Soyadı"
                          value={pickup.name}
                          onChange={(e) => updateAuthorizedPickup(idx, "name", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium"
                        />
                      </div>

                      <div className="w-36">
                        <select
                          value={pickup.relation}
                          onChange={(e) => updateAuthorizedPickup(idx, "relation", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold"
                        >
                          {PICKUP_RELATIONS.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-36">
                        <input
                          type="tel"
                          placeholder="Telefon No"
                          value={pickup.phone}
                          onChange={(e) => updateAuthorizedPickup(idx, "phone", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono"
                        />
                      </div>

                      <div className="w-32">
                        <input
                          type="text"
                          maxLength={11}
                          placeholder="T.C. Kimlik No"
                          value={pickup.tcNo || ""}
                          onChange={(e) => updateAuthorizedPickup(idx, "tcNo", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono"
                        />
                      </div>

                      {formData.authorizedPickups.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAuthorizedPickup(idx)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* BÖLÜM 6: VELİ BİLGİLENDİRME PORTALI & KVKK / MEDYA İZİNLERİ */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                <span className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                  <Key className="w-4 h-4 text-indigo-700" /> 6. Veli Bilgilendirme Portalı & KVKK Muvafakatnameleri
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-indigo-900 mb-1">Portal Kullanıcı Adı</label>
                    <input
                      type="text"
                      value={formData.portalUsername}
                      onChange={(e) => setFormData({ ...formData, portalUsername: e.target.value })}
                      placeholder="veli.123456"
                      className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-xs font-mono font-bold text-indigo-950"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-indigo-900 mb-1">Geçici PIN / Giriş Şifresi</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.portalPassword}
                        onChange={(e) => setFormData({ ...formData, portalPassword: e.target.value })}
                        placeholder="6 haneli PIN"
                        className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-xs font-mono font-extrabold tracking-widest text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={generateRandomPin}
                        className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] whitespace-nowrap shadow-xs"
                      >
                        PIN Üret
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1 flex flex-col justify-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.kvkkConsent}
                        onChange={(e) => setFormData({ ...formData, kvkkConsent: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-indigo-950 text-xs">KVKK Aydınlatma Metni Onaylandı</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.photoConsent}
                        onChange={(e) => setFormData({ ...formData, photoConsent: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-indigo-950 text-xs">Etkinlik & Fotoğraf Paylaşım İzni Var</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* BÖLÜM 7: FİNANS, SÖZLEŞME TARİFESİ & TAKSİT PLANLAMA SİHİRBAZI */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                    <DollarSign className="w-4 h-4 text-emerald-700" /> 7. Eğitim Ücreti, İndirim & Taksit Planı
                  </span>
                  <span className="text-[11px] font-bold font-mono text-emerald-800">
                    Net Tutar:{" "}
                    {(
                      Math.max(0, (parseFloat(formData.contractAmount) || 0) - (parseFloat(formData.discountAmount) || 0))
                    ).toLocaleString("tr-TR")}{" "}
                    ₺
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Brüt Eğitim Ücreti (TL) *</label>
                    <input
                      type="number"
                      required
                      value={formData.contractAmount}
                      onChange={(e) => setFormData({ ...formData, contractAmount: e.target.value })}
                      placeholder="Örn: 90000"
                      className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">İndirim Türü</label>
                    <select
                      value={formData.contractDiscountType}
                      onChange={(e) => setFormData({ ...formData, contractDiscountType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-xs font-semibold"
                    >
                      {DISCOUNT_TYPES.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">İndirim Tutarı (TL)</label>
                    <input
                      type="number"
                      value={formData.discountAmount}
                      onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Taksit Sayısı</label>
                    <select
                      value={formData.installmentCount}
                      onChange={(e) => setFormData({ ...formData, installmentCount: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-xs font-semibold"
                    >
                      <option value="1">1 (Peşin)</option>
                      <option value="3">3 Taksit</option>
                      <option value="6">6 Taksit</option>
                      <option value="8">8 Taksit</option>
                      <option value="9">9 Taksit (Eğitim Dönemi)</option>
                      <option value="10">10 Taksit (Standart)</option>
                      <option value="12">12 Taksit</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">İlk Taksit / Peşinat Vade Tarihi</label>
                    <input
                      type="date"
                      value={formData.firstInstallmentDate}
                      onChange={(e) => setFormData({ ...formData, firstInstallmentDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-xs"
                    />
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Hesaplanan Aylık Taksit</span>
                      <span className="text-base font-extrabold text-emerald-900 font-mono">
                        {(
                          Math.round(
                            (Math.max(0, (parseFloat(formData.contractAmount) || 0) - (parseFloat(formData.discountAmount) || 0)) /
                              Math.max(1, parseInt(formData.installmentCount) || 1)) *
                              100
                          ) / 100
                        ).toLocaleString("tr-TR")}{" "}
                        ₺ / ay
                      </span>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      {formData.installmentCount} Ay Eşit Taksit
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Butonları */}
              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md shadow-teal-700/20 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingStudent ? "Değişiklikleri Kaydet" : "Kesin Kaydı Tamamla & Sözleşmeyi Üret"}</span>
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
