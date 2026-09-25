"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  Building2,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  AlertCircle,
  FileText,
  Briefcase,
  ReceiptText,
  Camera,
  QrCode,
  Upload,
  User,
  Image as ImageIcon,
  ExternalLink,
  Sparkles,
  UserCheck,
  UserMinus,
} from "lucide-react";
import QRCode from "qrcode";
import { calculateDuration, parseSafeDate } from "@/lib/date-utils";

interface Department {
  id: string;
  name: string;
  category?: string | null;
}

interface Staff {
  id: string;
  tcNo: string;
  fullName: string;
  birthDate: string | null;
  phone: string | null;
  phone2?: string | null;
  email: string | null;
  iban: string | null;
  accountNumber?: string | null;
  title: string | null;
  hireDate: string | null;
  terminationDate?: string | null;
  mebAssignmentDate: string | null;
  mebAssignmentEndDate: string | null;
  isMebPermanent: boolean;
  isMebEndNotified: boolean;
  sgkStartDate: string | null;
  unofficialWorkPeriod: string | null;
  photoUrl?: string | null;
  status: string;
  departments: { department: Department }[];
  salaryConfig: {
    salaryType: string;
    monthlySalary: number;
    hourlyRate: number;
    dailyRate: number;
    officialSalaryPart: number;
  } | null;
}

export default function PersonellerPage() {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Aktif Personeller vs İşten Ayrılanlar Sekmesi
  const [staffTab, setStaffTab] = useState<"ACTIVE" | "TERMINATED">("ACTIVE");
  const [activeCount, setActiveCount] = useState<number>(0);
  const [terminatedCount, setTerminatedCount] = useState<number>(0);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Fotoğraf Yönetimi Modalı State'leri
  const [photoStaff, setPhotoStaff] = useState<Staff | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [uploadTab, setUploadTab] = useState<"QR" | "FILE">("QR");
  const [localPhotoPreview, setLocalPhotoPreview] = useState<string | null>(null);
  const [uploadingLocal, setUploadingLocal] = useState(false);
  const [qrUploadSuccess, setQrUploadSuccess] = useState(false);

  const openPhotoModal = async (staff: Staff) => {
    setPhotoStaff(staff);
    setLocalPhotoPreview(staff.photoUrl || null);
    setQrUploadSuccess(false);
    setUploadTab("QR");

    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      const mobileUrl = `${origin}/foto-yukle/${staff.id}`;
      try {
        const qr = await QRCode.toDataURL(mobileUrl, {
          width: 280,
          margin: 2,
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        setQrCodeDataUrl(qr);
      } catch (err) {
        console.error("QR Code Error:", err);
      }
    }
  };

  // Telefondan yükleme yapıldığında otomatik algıla
  useEffect(() => {
    if (!photoStaff) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/personel/${photoStaff.id}/foto`);
        const data = await res.json();
        if (res.ok && data.photoUrl && data.photoUrl !== photoStaff.photoUrl) {
          setPhotoStaff((prev) => (prev ? { ...prev, photoUrl: data.photoUrl } : null));
          setLocalPhotoPreview(data.photoUrl);
          setQrUploadSuccess(true);
          fetchData();
        }
      } catch (e) {
        // ignore
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [photoStaff]);

  // Bilgisayardan fotoğraf yükleme işlemi
  const handleLocalImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        const minDim = Math.min(width, height);
        const startX = (width - minDim) / 2;
        const startY = (height - minDim) / 2;

        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, MAX_SIZE, MAX_SIZE);
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          setLocalPhotoPreview(compressed);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLocalPhoto = async () => {
    if (!photoStaff || !localPhotoPreview) return;
    try {
      setUploadingLocal(true);
      const res = await fetch(`/api/personel/${photoStaff.id}/foto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: localPhotoPreview }),
      });
      if (res.ok) {
        setPhotoStaff({ ...photoStaff, photoUrl: localPhotoPreview });
        setQrUploadSuccess(true);
        fetchData();
      } else {
        alert("Fotoğraf kaydedilemedi.");
      }
    } catch (err) {
      alert("Hata oluştu.");
    } finally {
      setUploadingLocal(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!photoStaff) return;
    if (!confirm("Personel fotoğrafını kaldırmak istediğinize emin misiniz?")) return;
    try {
      setUploadingLocal(true);
      const res = await fetch(`/api/personel/${photoStaff.id}/foto`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPhotoStaff({ ...photoStaff, photoUrl: null });
        setLocalPhotoPreview(null);
        fetchData();
      }
    } catch (err) {
      alert("Fotoğraf silinemedi.");
    } finally {
      setUploadingLocal(false);
    }
  };

  // Form State
  const [form, setForm] = useState({
    tcNo: "",
    fullName: "",
    birthDate: "",
    phone: "",
    phone2: "",
    email: "",
    iban: "",
    accountNumber: "",
    title: "",
    hireDate: "",
    terminationDate: "",
    mebAssignmentDate: "",
    mebAssignmentEndDate: "",
    isMebPermanent: true,
    sgkStartDate: "",
    unofficialWorkPeriod: "",
    notes: "",
    status: "ACTIVE",
    departmentIds: [] as string[],
    // Ücret yapılandırması
    salaryType: "MONTHLY",
    monthlySalary: 0,
    hourlyRate: 0,
    dailyRate: 0,
    officialSalaryPart: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.set("search", search);
      if (selectedCategory) queryParams.set("category", selectedCategory);
      if (selectedDept) queryParams.set("departmentId", selectedDept);
      queryParams.set("status", staffTab === "TERMINATED" ? "TERMINATED" : (selectedStatus || "ACTIVE"));

      const [staffRes, deptRes, allRes] = await Promise.all([
        fetch(`/api/personel?${queryParams.toString()}`),
        fetch("/api/departmanlar"),
        fetch("/api/personel?status=ALL"),
      ]);

      const staffData = await staffRes.json();
      const deptData = await deptRes.json();
      const allData = await allRes.json();

      if (Array.isArray(staffData)) setStaffs(staffData);
      if (Array.isArray(deptData)) setDepartments(deptData);
      if (Array.isArray(allData)) {
        const act = allData.filter((s: Staff) => s.status === "ACTIVE" && !s.terminationDate).length;
        const term = allData.filter((s: Staff) => s.status === "PASSIVE" || Boolean(s.terminationDate)).length;
        setActiveCount(act);
        setTerminatedCount(term);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedDept, selectedStatus, selectedCategory, staffTab]);

  const handleRehire = async (staff: Staff) => {
    if (!confirm(`"${staff.fullName}" isimli personeli tekrar aktif çalışan olarak kadroya almak istiyor musunuz?`)) return;
    try {
      const res = await fetch(`/api/personel/${staff.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ACTIVE",
          terminationDate: null,
        }),
      });
      if (!res.ok) throw new Error("İşlem başarısız.");
      fetchData();
      alert(`"${staff.fullName}" başarıyla aktif kadroya alındı.`);
    } catch (e: any) {
      alert("Hata: " + e.message);
    }
  };

  const openNewModal = () => {
    setEditingStaffId(null);
    setForm({
      tcNo: "",
      fullName: "",
      birthDate: "",
      phone: "",
      phone2: "",
      email: "",
      iban: "",
      accountNumber: "",
      title: "",
      hireDate: new Date().toISOString().split("T")[0],
      terminationDate: "",
      mebAssignmentDate: "",
      mebAssignmentEndDate: "",
      isMebPermanent: false,
      sgkStartDate: "",
      unofficialWorkPeriod: "",
      notes: "",
      status: "ACTIVE",
      departmentIds: [],
      salaryType: "MONTHLY",
      monthlySalary: 28075.5,
      hourlyRate: 450,
      dailyRate: 1200,
      officialSalaryPart: 20002.5,
    });
    setErrorMsg("");
    setModalOpen(true);
  };

  const openEditModal = (staff: Staff) => {
    setEditingStaffId(staff.id);
    setForm({
      tcNo: staff.tcNo,
      fullName: staff.fullName,
      birthDate: staff.birthDate ? staff.birthDate.split("T")[0] : "",
      phone: staff.phone || "",
      phone2: staff.phone2 || "",
      email: staff.email || "",
      iban: staff.iban || "",
      accountNumber: staff.accountNumber || "",
      title: staff.title || "",
      hireDate: staff.hireDate ? staff.hireDate.split("T")[0] : "",
      terminationDate: staff.terminationDate ? staff.terminationDate.split("T")[0] : "",
      mebAssignmentDate: staff.mebAssignmentDate ? staff.mebAssignmentDate.split("T")[0] : "",
      mebAssignmentEndDate: staff.mebAssignmentEndDate ? staff.mebAssignmentEndDate.split("T")[0] : "",
      isMebPermanent: staff.mebAssignmentDate ? (staff.isMebPermanent ?? true) : false,
      sgkStartDate: staff.sgkStartDate ? staff.sgkStartDate.split("T")[0] : "",
      unofficialWorkPeriod: staff.unofficialWorkPeriod || "",
      notes: "",
      status: staff.status,
      departmentIds: staff.departments.map((d) => d.department.id),
      salaryType: staff.salaryConfig?.salaryType || "MONTHLY",
      monthlySalary: staff.salaryConfig?.monthlySalary || 0,
      hourlyRate: staff.salaryConfig?.hourlyRate || 0,
      dailyRate: staff.salaryConfig?.dailyRate || 0,
      officialSalaryPart: staff.salaryConfig?.officialSalaryPart || 0,
    });
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const url = editingStaffId ? `/api/personel/${editingStaffId}` : "/api/personel";
      const method = editingStaffId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "İşlem sırasında bir hata oluştu");
      }

      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Kaydedilemedi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" personelini silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/personel/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      alert("Silinemedi");
    }
  };

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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Personeller</h1>
          <p className="text-sm text-slate-500 mt-0.5">Personel kayıtları, iletişim, SGK ve ücret tanımlamaları</p>
        </div>
        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Personel Ekle</span>
        </button>
      </div>

      {/* Aktif Çalışanlar / İşten Ayrılanlar Sekme Butonları */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setStaffTab("ACTIVE");
              setSelectedStatus("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              staffTab === "ACTIVE"
                ? "bg-teal-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Aktif Çalışanlar</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                staffTab === "ACTIVE" ? "bg-white/20 text-white" : "bg-teal-100 text-teal-800"
              }`}
            >
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStaffTab("TERMINATED");
              setSelectedStatus("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              staffTab === "TERMINATED"
                ? "bg-rose-700 text-white shadow-xs"
                : "text-slate-600 hover:text-rose-800 hover:bg-white/60"
            }`}
          >
            <UserMinus className="w-4 h-4" />
            <span>İşten Ayrılanlar</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                staffTab === "TERMINATED" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800"
              }`}
            >
              {terminatedCount}
            </span>
          </button>
        </div>

        {staffTab === "TERMINATED" && (
          <div className="text-xs text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Kurumdan ayrılmış eski çalışanlar listelenmektedir. Dilediğiniz personeli tek tıkla tekrar aktif kadroya alabilirsiniz.</span>
          </div>
        )}
      </div>

      {/* Arama & Filtreleme Çubuğu */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="İsim, TC Kimlik, Telefon veya Mail ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedDept("");
            }}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 text-slate-800 font-medium"
          >
            <option value="">Tüm Kadrolar (Ana Başlıklar)</option>
            <option value="TEACHER">🎓 Öğretmenler</option>
            <option value="ADMIN">💼 İdari Personel</option>
            <option value="STAFF">🧹 Personel (Destek)</option>
            <option value="BRANCH">📚 Branşlar</option>
          </select>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 text-slate-700"
          >
            <option value="">Tüm Departmanlar</option>
            {departments
              .filter((d) => !selectedCategory || (d.category || "TEACHER") === selectedCategory)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 text-slate-700"
          >
            <option value="">Tüm Durumlar</option>
            <option value="ACTIVE">Aktif</option>
            <option value="PASSIVE">Pasif</option>
            <option value="ON_LEAVE">İzinli</option>
          </select>
        </div>
      </div>

      {/* Personel Listesi Tablosu */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Yükleniyor...</div>
        ) : staffs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Aradığınız kriterde personel bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Personel Bilgisi</th>
                  <th className="py-3 px-4">Departman & Görev</th>
                  <th className="py-3 px-4">İletişim & TC</th>
                  <th className="py-3 px-4">Ücret Modeli</th>
                  <th className="py-3 px-4">Durum</th>
                  <th className="py-3 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {staffs.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => openPhotoModal(staff)}
                          className="relative group cursor-pointer w-10 h-10 rounded-full overflow-hidden border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center bg-slate-100 transition-transform hover:scale-105"
                          title="Fotoğrafı Görüntüle / QR ile Yükle"
                        >
                          {staff.photoUrl ? (
                            <img src={staff.photoUrl} alt={staff.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center font-bold text-xs">
                              {staff.fullName.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Camera className="w-4 h-4" />
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{staff.fullName}</p>
                          <p className="text-xs text-slate-400 font-mono">TC: {staff.tcNo}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="text-slate-800 font-medium">{staff.title || "—"}</p>
                      
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {calculateDuration(staff.hireDate, staff.sgkStartDate) !== "—" &&
                          calculateDuration(staff.hireDate, staff.sgkStartDate) !== "0 gün" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                              <Briefcase className="w-2.5 h-2.5 text-amber-600" />
                              Gayriresmî: {calculateDuration(staff.hireDate, staff.sgkStartDate)}
                            </span>
                          )}

                        {/* MEB Atama Durumu */}
                        {!staff.mebAssignmentDate ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                            ⚪ MEB: Atama Yapılmadı
                          </span>
                        ) : staff.isMebPermanent ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                            ♾️ MEB: Süresiz
                          </span>
                        ) : staff.mebAssignmentEndDate ? (
                          (() => {
                            const endD = parseSafeDate(staff.mebAssignmentEndDate);
                            const today = new Date();
                            const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                            const diffDays = endD
                              ? Math.round(
                                  (new Date(endD.getFullYear(), endD.getMonth(), endD.getDate()).getTime() -
                                    dToday.getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )
                              : null;

                            if (diffDays !== null && diffDays < 0) {
                              return (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-300 px-1.5 py-0.5 rounded animate-pulse">
                                  🚨 MEB Bitti ({Math.abs(diffDays)} gün önce)
                                </span>
                              );
                            }
                            if (diffDays !== null && diffDays <= 7) {
                              return (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                                  ⚠️ MEB Bitiş: {diffDays === 0 ? "Bugün" : diffDays === 1 ? "Yarın" : `${diffDays} gün kaldı`}
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                                📅 MEB Bitiş: {new Date(staff.mebAssignmentEndDate).toLocaleDateString("tr-TR")}
                              </span>
                            );
                          })()
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                            📅 MEB: Belirli Süreli
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {staff.departments.map((d) => (
                          <span
                            key={d.department.id}
                            className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium"
                          >
                            {d.department.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 space-y-1">
                      {staff.phone && (
                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{staff.phone}</span>
                        </p>
                      )}
                      {staff.phone2 && (
                        <p className="text-xs text-teal-700 flex items-center gap-1.5 font-medium" title="Kurum İçi / İş Telefonu">
                          <Phone className="w-3.5 h-3.5 text-teal-600" />
                          <span>{staff.phone2}</span>
                          <span className="text-[9px] bg-teal-50 text-teal-700 border border-teal-200 px-1 py-0.2 rounded font-semibold">Kurum</span>
                        </p>
                      )}
                      {staff.email && (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {staff.email}
                        </p>
                      )}
                      {staff.iban && (
                        <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          <span title={staff.iban}>{staff.iban.substring(0, 14)}...</span>
                        </p>
                      )}
                      {staff.accountNumber && (
                        <p className="text-[11px] text-teal-800 font-mono font-medium">
                          Hesap No: {staff.accountNumber}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">
                        {staff.salaryConfig?.salaryType === "MONTHLY" && (
                          <span className="text-teal-700 font-semibold">
                            {formatCurrency(staff.salaryConfig.monthlySalary)} / ay
                          </span>
                        )}
                        {staff.salaryConfig?.salaryType === "HOURLY" && (
                          <span className="text-blue-700 font-semibold">
                            {staff.salaryConfig.hourlyRate} TL / ders saati
                          </span>
                        )}
                        {staff.salaryConfig?.salaryType === "DAILY" && (
                          <span className="text-purple-700 font-semibold">
                            {staff.salaryConfig.dailyRate} TL / gün
                          </span>
                        )}
                        {staff.salaryConfig?.salaryType === "HYBRID" && (
                          <div>
                            <span className="text-teal-700 font-semibold">
                              {formatCurrency(staff.salaryConfig.monthlySalary)}
                            </span>
                            <span className="text-xs text-slate-500 block">
                              + {staff.salaryConfig.hourlyRate} TL/saat
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                        {staff.salaryConfig?.salaryType === "MONTHLY"
                          ? "Aylık Maaşlı"
                          : staff.salaryConfig?.salaryType === "HOURLY"
                          ? "Ders Saatli"
                          : staff.salaryConfig?.salaryType === "DAILY"
                          ? "Günlük Ücretli"
                          : "Karma Model"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          staff.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : staff.status === "ON_LEAVE"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {staff.status === "ACTIVE"
                          ? "Aktif"
                          : staff.status === "ON_LEAVE"
                          ? "İzinli"
                          : "İşten Ayrıldı"}
                      </span>
                      {staff.terminationDate && (
                        <p className="text-[10px] text-rose-600 font-semibold mt-1">
                          Ayrılış: {new Date(staff.terminationDate).toLocaleDateString("tr-TR")}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {staffTab === "TERMINATED" && (
                          <button
                            type="button"
                            onClick={() => handleRehire(staff)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors mr-1"
                            title="Personeli Tekrar Aktif Kadroya Al"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Tekrar Başlat</span>
                          </button>
                        )}
                        <button
                          onClick={() => openPhotoModal(staff)}
                          className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Fotoğraf Yükle (QR Kod / Dosya)"
                        >
                          <Camera className="w-4 h-4 text-teal-700" />
                        </button>
                        <Link
                          href={`/cari?staffId=${staff.id}`}
                          className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Cari Hesap Ekstresi (Banka & Elden Tüm Hareketler)"
                        >
                          <ReceiptText className="w-4 h-4 text-teal-700" />
                        </Link>
                        <button
                          onClick={() => openEditModal(staff)}
                          className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(staff.id, staff.fullName)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Personel Ekle / Düzenle Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingStaffId ? "Personel Bilgilerini Düzenle" : "Yeni Personel Kaydı"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-5">
              {/* Kişisel Bilgiler */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Kişisel & İletişim Bilgileri
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      TC Kimlik Numarası *
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      required
                      value={form.tcNo}
                      onChange={(e) => setForm({ ...form, tcNo: e.target.value })}
                      placeholder="11 haneli TC"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Ad Soyad *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      placeholder="Ad Soyad"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Doğum Tarihi
                    </label>
                    <input
                      type="date"
                      value={form.birthDate}
                      onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      1. Telefon (Kişisel)
                    </label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="05xx xxx xx xx"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
                      <span>2. Telefon (Kurum İçi / İş)</span>
                      <span className="text-[10px] text-teal-600 font-normal">Opsiyonel</span>
                    </label>
                    <input
                      type="text"
                      value={form.phone2}
                      onChange={(e) => setForm({ ...form, phone2: e.target.value })}
                      placeholder="Kurum dahili veya iş cep no"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      E-Posta Adresi
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="ornek@okul.com"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      IBAN Numarası
                    </label>
                    <input
                      type="text"
                      value={form.iban}
                      onChange={(e) => setForm({ ...form, iban: e.target.value })}
                      placeholder="TR00 0000 0000 0000 0000 0000 00"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Banka Hesap Numarası
                    </label>
                    <input
                      type="text"
                      value={form.accountNumber}
                      onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                      placeholder="Örn: 6200-1234567"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Kurum & Görev Bilgileri */}
              <div className="pt-2 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Kurum & Görev Bilgileri
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Görev / Ünvan
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Örn: Öğretmen, Hizmetli, Aşçı, Müdür, Muhasebe"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-medium"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        "Öğretmen",
                        "Müdür",
                        "İdari İşler ve Personel Sorumlusu",
                        "Muhasebe",
                        "Hizmetli",
                        "Aşçı",
                        "Güvenlik",
                      ].map((presetTitle) => (
                        <button
                          key={presetTitle}
                          type="button"
                          onClick={() => setForm({ ...form, title: presetTitle })}
                          className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 border border-slate-200 text-slate-600 rounded-md transition-colors"
                        >
                          + {presetTitle}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Çalışma Durumu
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setForm({
                          ...form,
                          status: newStatus,
                          terminationDate:
                            newStatus === "PASSIVE" && !form.terminationDate
                              ? new Date().toISOString().split("T")[0]
                              : newStatus === "ACTIVE"
                              ? ""
                              : form.terminationDate,
                        });
                      }}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-medium"
                    >
                      <option value="ACTIVE">Aktif Çalışıyor</option>
                      <option value="ON_LEAVE">İzinli / Askıda</option>
                      <option value="PASSIVE">İşten Ayrıldı / Pasif</option>
                    </select>
                  </div>

                  {(form.status === "PASSIVE" || Boolean(form.terminationDate)) && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                      <label className="block text-xs font-bold text-rose-800 flex items-center justify-between">
                        <span>🚪 İşten Ayrılış Tarihi</span>
                        <span className="text-[10px] text-rose-600 font-semibold bg-rose-100 px-1.5 py-0.5 rounded">
                          Tahakkuk Engellenir
                        </span>
                      </label>
                      <input
                        type="date"
                        value={form.terminationDate}
                        onChange={(e) => setForm({ ...form, terminationDate: e.target.value, status: "PASSIVE" })}
                        className="w-full px-3 py-2 text-sm border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white font-semibold text-rose-900"
                      />
                      <p className="text-[11px] text-rose-600 leading-tight">
                        * Bu personelin ayrıldığı aydan sonraki aylarda maaş tahakkuk ekranında listelenmesi engellenir.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      İşe Giriş Tarihi
                    </label>
                    <input
                      type="date"
                      value={form.hireDate}
                      onChange={(e) => {
                        const newHire = e.target.value;
                        const autoDur = calculateDuration(newHire, form.sgkStartDate);
                        setForm({
                          ...form,
                          hireDate: newHire,
                          unofficialWorkPeriod: autoDur !== "—" ? autoDur : form.unofficialWorkPeriod,
                        });
                      }}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
                      <span>MEB Atama Başlangıç Tarihi</span>
                      {!form.mebAssignmentDate && (
                        <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                          Atama Yapılmadı
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={form.mebAssignmentDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm({
                          ...form,
                          mebAssignmentDate: val,
                          isMebPermanent: val ? (form.mebAssignmentDate ? form.isMebPermanent : true) : false,
                          mebAssignmentEndDate: val ? form.mebAssignmentEndDate : "",
                        });
                      }}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Resmî SGK Başlangıç Tarihi
                    </label>
                    <input
                      type="date"
                      value={form.sgkStartDate}
                      onChange={(e) => {
                        const newSgk = e.target.value;
                        const autoDur = calculateDuration(form.hireDate, newSgk);
                        setForm({
                          ...form,
                          sgkStartDate: newSgk,
                          unofficialWorkPeriod: autoDur !== "—" ? autoDur : form.unofficialWorkPeriod,
                        });
                      }}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
                      <span>Gayriresmî Çalışma Süresi</span>
                      <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.5 rounded">
                        Otomatik Hesaplanır
                      </span>
                    </label>
                    <input
                      type="text"
                      value={form.unofficialWorkPeriod}
                      onChange={(e) => setForm({ ...form, unofficialWorkPeriod: e.target.value })}
                      placeholder="Örn: 3 yıl 9 gün"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-semibold text-amber-900 bg-amber-50/40"
                    />
                  </div>

                  {/* MEB Atama Bitiş & Süresiz & Yapılmadı Seçeneği Kartı */}
                  <div className="sm:col-span-2 p-3.5 bg-gradient-to-r from-teal-50/70 to-slate-50 border border-teal-200/80 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-teal-700 font-bold text-xs">🏛️ MEB Atama Durumu & Süre Türü:</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Personelin MEB ataması var mı? Süresiz mi yoksa belirli bir bitiş tarihine mi tabi?
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              mebAssignmentDate: "",
                              mebAssignmentEndDate: "",
                              isMebPermanent: false,
                            })
                          }
                          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                            !form.mebAssignmentDate
                              ? "bg-slate-700 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          }`}
                        >
                          <span>🚫</span>
                          <span>MEB Ataması Yapılmadı</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              isMebPermanent: true,
                              mebAssignmentEndDate: "",
                              mebAssignmentDate:
                                form.mebAssignmentDate || form.hireDate || new Date().toISOString().split("T")[0],
                            })
                          }
                          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                            form.mebAssignmentDate && form.isMebPermanent
                              ? "bg-teal-700 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          }`}
                        >
                          <span>♾️</span>
                          <span>Süresiz Atama</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              isMebPermanent: false,
                              mebAssignmentDate:
                                form.mebAssignmentDate || form.hireDate || new Date().toISOString().split("T")[0],
                            })
                          }
                          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                            form.mebAssignmentDate && !form.isMebPermanent
                              ? "bg-teal-700 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          }`}
                        >
                          <span>📅</span>
                          <span>Tarihli Atama</span>
                        </button>
                      </div>
                    </div>

                    {!form.mebAssignmentDate ? (
                      <div className="pt-2 text-xs text-slate-500 flex items-center gap-2 border-t border-slate-200/50">
                        <span className="inline-block w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
                        <span>Bu personel için henüz MEB atama kaydı bulunmuyor. Atama yapıldığında <strong>Süresiz</strong> veya <strong>Tarihli</strong> butonunu seçebilirsiniz.</span>
                      </div>
                    ) : !form.isMebPermanent ? (
                      <div className="pt-3 border-t border-teal-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            MEB Atama Bitiş Tarihi *
                          </label>
                          <input
                            type="date"
                            required={!form.isMebPermanent && !!form.mebAssignmentDate}
                            value={form.mebAssignmentEndDate}
                            onChange={(e) => setForm({ ...form, mebAssignmentEndDate: e.target.value })}
                            className="w-full px-3 py-2 text-sm bg-white border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-semibold text-slate-900"
                          />
                        </div>
                        <div className="p-2.5 rounded-lg bg-amber-50/90 border border-amber-200 text-[11px] text-amber-900 leading-snug">
                          <span className="font-bold text-amber-950 block mb-0.5">🔔 1 Hafta Önce Hatırlatma Aktif</span>
                          Atama bitişine <strong>7 gün (1 hafta)</strong> kala ve süre dolduğunda sistem ana sayfada bildirim çubuğunda hatırlatacaktır.
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 text-xs text-teal-700 flex items-center gap-2 border-t border-teal-200/50">
                        <span className="inline-block w-2 h-2 rounded-full bg-teal-500 shrink-0"></span>
                        <span>Süresiz atama aktif. Belirli bir bitiş tarihi aranmaz ve atama süresi dolum bildirimi üretilmez.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Departman Seçimi - Ana Başlıklara Göre Gruplandırılmış */}
                <div className="mt-4 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Bölüm / Departman Seçimi (Ana Başlıklara Göre)
                  </label>
                  
                  <div className="space-y-3 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80">
                    {[
                      { key: "TEACHER", label: "🎓 Öğretmen Kadrosu" },
                      { key: "ADMIN", label: "💼 İdari Personel" },
                      { key: "STAFF", label: "🧹 Personel & Destek" },
                      { key: "BRANCH", label: "📚 Branşlar" },
                    ].map((group) => {
                      const groupDepts = departments.filter((d) => {
                        const cat = d.category || (
                          d.name.toLowerCase().includes("öğretmen") || d.name.toLowerCase().includes("okul öncesi") ? "TEACHER" :
                          d.name.toLowerCase().includes("müdür") || d.name.toLowerCase().includes("idari") || d.name.toLowerCase().includes("muhasebe") ? "ADMIN" :
                          d.name.toLowerCase().includes("hizmetli") || d.name.toLowerCase().includes("aşçı") || d.name.toLowerCase().includes("personel") ? "STAFF" : "BRANCH"
                        );
                        return cat === group.key;
                      });

                      if (groupDepts.length === 0) return null;

                      return (
                        <div key={group.key} className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            {group.label}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {groupDepts.map((d) => {
                              const selected = form.departmentIds.includes(d.id);
                              return (
                                <button
                                  key={d.id}
                                  type="button"
                                  onClick={() => {
                                    if (selected) {
                                      setForm({
                                        ...form,
                                        departmentIds: form.departmentIds.filter((id) => id !== d.id),
                                      });
                                    } else {
                                      setForm({ ...form, departmentIds: [...form.departmentIds, d.id] });
                                    }
                                  }}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                                    selected
                                      ? "bg-teal-700 text-white border-teal-700 shadow-xs font-semibold"
                                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {d.name} {selected && "✓"}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Ücret Modeli ve Hesaplama Parametreleri */}
              <div className="pt-2 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Ücret & Maaş Modeli
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {[
                    { id: "MONTHLY", label: "Aylık Maaşlı" },
                    { id: "HOURLY", label: "Ders Saatli" },
                    { id: "DAILY", label: "Günlük Ücretli" },
                    { id: "HYBRID", label: "Karma (Maaş+Saat)" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setForm({ ...form, salaryType: t.id })}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                        form.salaryType === t.id
                          ? "bg-teal-50 border-teal-600 text-teal-800 ring-2 ring-teal-600/20"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  {(form.salaryType === "MONTHLY" || form.salaryType === "HYBRID") && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Aylık Sabit Maaş (TL)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.monthlySalary}
                        onChange={(e) =>
                          setForm({ ...form, monthlySalary: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-semibold"
                      />
                    </div>
                  )}

                  {(form.salaryType === "HOURLY" || form.salaryType === "HYBRID") && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Ders Saati Başına Ücret (TL/saat)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.hourlyRate}
                        onChange={(e) =>
                          setForm({ ...form, hourlyRate: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-semibold"
                      />
                    </div>
                  )}

                  {form.salaryType === "DAILY" && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Günlük Çalışma Ücreti (TL/gün)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.dailyRate}
                        onChange={(e) =>
                          setForm({ ...form, dailyRate: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-semibold"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Butonlar */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  {submitting ? "Kaydediliyor..." : editingStaffId ? "Güncelle" : "Personeli Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Personel Fotoğrafı Yönetimi & QR Kod Modalı */}
      {photoStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 relative">
            {/* Modal Başlık */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">
                    Personel Fotoğrafı
                  </h3>
                  <p className="text-xs text-slate-500">{photoStaff.fullName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPhotoStaff(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Canlı Önizleme Alanı */}
              <div className="flex items-center justify-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center ring-2 ring-teal-500/30">
                    {photoStaff.photoUrl ? (
                      <img
                        src={photoStaff.photoUrl}
                        alt={photoStaff.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-teal-700 to-slate-800 text-white flex flex-col items-center justify-center">
                        <User className="w-12 h-12 text-slate-300 mb-1" />
                        <span className="text-[11px] font-semibold text-slate-200">Fotoğraf Yok</span>
                      </div>
                    )}
                  </div>

                  {photoStaff.photoUrl && (
                    <button
                      type="button"
                      onClick={handleDeletePhoto}
                      disabled={uploadingLocal}
                      className="absolute -top-1 -right-1 p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md transition-transform hover:scale-110"
                      title="Fotoğrafı Kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sekme Seçimi: QR Kod vs Bilgisayardan */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setUploadTab("QR")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    uploadTab === "QR"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <QrCode className="w-4 h-4 text-teal-700" />
                  <span>📱 Telefon ile QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadTab("FILE")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    uploadTab === "FILE"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Upload className="w-4 h-4 text-teal-700" />
                  <span>💻 Bilgisayardan</span>
                </button>
              </div>

              {/* QR Kod Sekmesi */}
              {uploadTab === "QR" && (
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-white border-2 border-dashed border-teal-300 rounded-2xl shadow-sm">
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="QR Kod"
                        className="w-48 h-48 rounded-xl"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                        QR oluşturuluyor...
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800">
                      Telefonunuzun kamerasını bu QR koda tutun
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                      Kamerayla fotoğraf çekebilir veya galerinizden seçebilirsiniz. Telefondan kaydedildiğinde bu ekran otomatik güncellenecektir.
                    </p>
                  </div>

                  {qrUploadSuccess && (
                    <div className="w-full p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>🎉 Fotoğraf başarıyla yüklendi ve güncellendi!</span>
                    </div>
                  )}

                  <a
                    href={`/foto-yukle/${photoStaff.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-teal-700 hover:text-teal-800 font-semibold underline mt-1"
                  >
                    <span>Yükleme sayfasını bu ekranda aç</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Bilgisayardan Dosya Yükleme Sekmesi */}
              {uploadTab === "FILE" && (
                <div className="space-y-4">
                  <div
                    onClick={() => {
                      const input = document.getElementById("file-photo-input") as HTMLInputElement;
                      if (input) input.click();
                    }}
                    className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-teal-50/20"
                  >
                    <input
                      id="file-photo-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleLocalImageSelect(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">Fotoğraf seçmek için tıklayın</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, JPEG (Otomatik kare kırpılır)</p>
                  </div>

                  {localPhotoPreview && localPhotoPreview !== photoStaff.photoUrl && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={localPhotoPreview}
                          alt="Seçilen Fotoğraf"
                          className="w-10 h-10 rounded-full object-cover border border-slate-300"
                        />
                        <span className="text-xs font-semibold text-slate-700">Yeni Fotoğraf Seçildi</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveLocalPhoto}
                        disabled={uploadingLocal}
                        className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                      >
                        {uploadingLocal ? "Kaydediliyor..." : "Kaydet ve Uygula"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Alt Kapat Butonu */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setPhotoStaff(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
