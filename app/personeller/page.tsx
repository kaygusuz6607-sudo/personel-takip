"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { calculateDuration } from "@/lib/date-utils";

interface Department {
  id: string;
  name: string;
}

interface Staff {
  id: string;
  tcNo: string;
  fullName: string;
  birthDate: string | null;
  phone: string | null;
  email: string | null;
  iban: string | null;
  accountNumber: string | null;
  title: string | null;
  hireDate: string | null;
  mebAssignmentDate: string | null;
  sgkStartDate: string | null;
  unofficialWorkPeriod: string | null;
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
  const [selectedStatus, setSelectedStatus] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [form, setForm] = useState({
    tcNo: "",
    fullName: "",
    birthDate: "",
    phone: "",
    email: "",
    iban: "",
    accountNumber: "",
    title: "",
    hireDate: "",
    mebAssignmentDate: "",
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
      if (selectedDept) queryParams.set("departmentId", selectedDept);
      if (selectedStatus) queryParams.set("status", selectedStatus);

      const [staffRes, deptRes] = await Promise.all([
        fetch(`/api/personel?${queryParams.toString()}`),
        fetch("/api/departmanlar"),
      ]);

      const staffData = await staffRes.json();
      const deptData = await deptRes.json();

      if (Array.isArray(staffData)) setStaffs(staffData);
      if (Array.isArray(deptData)) setDepartments(deptData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedDept, selectedStatus]);

  const openNewModal = () => {
    setEditingStaffId(null);
    setForm({
      tcNo: "",
      fullName: "",
      birthDate: "",
      phone: "",
      email: "",
      iban: "",
      accountNumber: "",
      title: "",
      hireDate: new Date().toISOString().split("T")[0],
      mebAssignmentDate: "",
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
      email: staff.email || "",
      iban: staff.iban || "",
      accountNumber: staff.accountNumber || "",
      title: staff.title || "",
      hireDate: staff.hireDate ? staff.hireDate.split("T")[0] : "",
      mebAssignmentDate: staff.mebAssignmentDate ? staff.mebAssignmentDate.split("T")[0] : "",
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

        <div className="flex items-center gap-2">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 text-slate-700"
          >
            <option value="">Tüm Departmanlar</option>
            {departments.map((d) => (
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
                        <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {staff.fullName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{staff.fullName}</p>
                          <p className="text-xs text-slate-400 font-mono">TC: {staff.tcNo}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="text-slate-800 font-medium">{staff.title || "—"}</p>
                      {calculateDuration(staff.hireDate, staff.sgkStartDate) !== "—" &&
                        calculateDuration(staff.hireDate, staff.sgkStartDate) !== "0 gün" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mt-0.5">
                            <Briefcase className="w-2.5 h-2.5 text-amber-600" />
                            Gayriresmî: {calculateDuration(staff.hireDate, staff.sgkStartDate)}
                          </span>
                        )}
                      <div className="flex flex-wrap gap-1 mt-1">
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
                          {staff.phone}
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
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {staff.status === "ACTIVE"
                          ? "Aktif"
                          : staff.status === "ON_LEAVE"
                          ? "İzinli"
                          : "Pasif"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
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
                      Telefon Numarası
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
                      placeholder="Örn: Matematik Öğretmeni, Muhasebe"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Durum
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                    >
                      <option value="ACTIVE">Aktif</option>
                      <option value="ON_LEAVE">İzinli</option>
                      <option value="PASSIVE">Pasif (Ayrılmış)</option>
                    </select>
                  </div>

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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      MEB Atama Tarihi
                    </label>
                    <input
                      type="date"
                      value={form.mebAssignmentDate}
                      onChange={(e) => setForm({ ...form, mebAssignmentDate: e.target.value })}
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

                  <div>
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
                </div>

                {/* Departman Seçimi */}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Bölüm / Departman Seçimi
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {departments.map((d) => {
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
                              ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {d.name} {selected && "✓"}
                        </button>
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

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Resmî (SGK Banka) Maaş Kısmı (TL)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.officialSalaryPart}
                      onChange={(e) =>
                        setForm({ ...form, officialSalaryPart: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="Banka üzerinden ödenecek resmi tutar"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                    />
                  </div>
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
    </div>
  );
}
