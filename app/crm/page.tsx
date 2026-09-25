"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Target,
  Search,
  Plus,
  Filter,
  Phone,
  PhoneCall,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  Users,
  GraduationCap,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Tag,
  DollarSign,
  CalendarClock,
  Layers,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  Building,
  School,
  Share2,
  Printer,
  FileText,
  Baby,
  Smile,
  BadgePercent,
  Clock3,
} from "lucide-react";
import * as XLSX from "xlsx";

interface Staff {
  id: string;
  fullName: string;
  title: string | null;
  phone: string | null;
}

interface LeadInteraction {
  id: string;
  leadId: string;
  type: string;
  result: string;
  notes: string | null;
  followUpDate: string | null;
  followUpTime?: string | null;
  createdAt: string;
  staff?: {
    id: string;
    fullName: string;
    title: string | null;
  } | null;
}

interface Lead {
  id: string;
  studentName: string;
  birthDate: string | null;
  gender: string | null;
  currentSchool: string | null;
  targetGrade: string | null;
  programInterest: string | null;
  section?: "ANAOKULU" | "ILKOKUL" | "ORTAOKUL" | "LISE" | "KURS" | null;
  educationType?: "TAM_GUN" | "YARIM_GUN_SABAH" | "YARIM_GUN_OGLE" | null;
  campaignType?: string | null;
  followUpTime?: string | null;
  source: string;
  sourceDetail: string | null;
  status: "NEW" | "CONTACTED" | "APPOINTMENT" | "OFFER_SENT" | "REGISTERED" | "LOST";
  lostReason: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  parentName: string;
  parentRelation: string;
  parentPhone: string;
  parentPhone2: string | null;
  parentEmail: string | null;
  parentJob: string | null;
  cityDistrict: string | null;
  address: string | null;
  assignedStaffId: string | null;
  assignedStaff?: Staff | null;
  offeredPrice: number | null;
  discountNote: string | null;
  notes: string | null;
  interactions: LeadInteraction[];
  registeredStudent?: {
    id: string;
    studentNo: string | null;
    fullName: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface Classroom {
  id: string;
  name: string;
  gradeLevel: string;
  branch: string | null;
  capacity: number;
}

const SECTIONS = [
  { id: "ALL", label: "Tüm Kademeler", icon: "🏫" },
  { id: "ANAOKULU", label: "Anaokulu (3-5 Yaş)", icon: "🧸" },
  { id: "ILKOKUL", label: "İlkokul (1-4)", icon: "🎒" },
  { id: "ORTAOKUL", label: "Ortaokul (5-8)", icon: "📚" },
  { id: "LISE", label: "Lise (9-12)", icon: "🎓" },
  { id: "KURS", label: "Kurs / Etüt / Sınav", icon: "🎯" },
];

const SECTION_GRADES: Record<string, string[]> = {
  ANAOKULU: ["3 Yaş (Oyun Grubu)", "4 Yaş (Küçük Yaş)", "5 Yaş (Hazırlık Sınıfı)"],
  ILKOKUL: ["1. Sınıf", "2. Sınıf", "3. Sınıf", "4. Sınıf"],
  ORTAOKUL: ["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf (LGS)"],
  LISE: ["9. Sınıf", "10. Sınıf", "11. Sınıf", "12. Sınıf (YKS)"],
  KURS: ["Mezun (YKS Kursu)", "8. Sınıf LGS Kursu", "Ders Takviye / Özel Ders"],
};

const EDUCATION_TYPES: Record<string, string> = {
  TAM_GUN: "Tam Gün (08:30 - 17:30)",
  YARIM_GUN_SABAH: "Yarım Gün Sabah (08:30 - 12:30)",
  YARIM_GUN_OGLE: "Yarım Gün Öğle (13:00 - 17:30)",
};

const CAMPAIGN_PRESETS = [
  "Erken Kayıt İndirimi",
  "Kardeş İndirimi (%10)",
  "Bursluluk Sınavı Başarı İndirimi",
  "Öğretmen / Kamu Personeli İndirimi",
  "Veli Tavsiyesi / Referans Kampanyası",
  "Özel Kurumsal Anlaşma",
];

const STAGES = [
  { id: "NEW", label: "Yeni Aday", color: "bg-blue-50 text-blue-700 border-blue-200", badgeColor: "bg-blue-600" },
  { id: "CONTACTED", label: "İletişimde", color: "bg-amber-50 text-amber-700 border-amber-200", badgeColor: "bg-amber-600" },
  { id: "APPOINTMENT", label: "Randevu Verildi", color: "bg-purple-50 text-purple-700 border-purple-200", badgeColor: "bg-purple-600" },
  { id: "OFFER_SENT", label: "Teklif / Düşünüyor", color: "bg-indigo-50 text-indigo-700 border-indigo-200", badgeColor: "bg-indigo-600" },
  { id: "REGISTERED", label: "Kayıt Oldu (Kazanıldı)", color: "bg-emerald-50 text-emerald-700 border-emerald-200", badgeColor: "bg-emerald-600" },
  { id: "LOST", label: "Kaybedildi / Olumsuz", color: "bg-rose-50 text-rose-700 border-rose-200", badgeColor: "bg-rose-600" },
];

const SOURCES: { [key: string]: string } = {
  INSTAGRAM: "Instagram / Meta Reklamı",
  GOOGLE: "Google Arama / SEO",
  RECOMMENDATION: "Veli Tavsiyesi / Referans",
  BROCHURE: "Broşür / Afiş / Dış Tanıtım",
  WALK_IN: "Kapıdan Giriş / Ziyaret",
  PHONE_IN: "Telefonla Arayan",
  OTHER: "Diğer",
};

const PRIORITIES: { [key: string]: { label: string; color: string } } = {
  LOW: { label: "Düşük", color: "bg-slate-100 text-slate-600" },
  MEDIUM: { label: "Normal", color: "bg-blue-100 text-blue-700" },
  HIGH: { label: "Yüksek", color: "bg-amber-100 text-amber-800" },
  URGENT: { label: "Acil", color: "bg-rose-100 text-rose-700" },
};

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"kanban" | "table" | "calls" | "stats">("kanban");

  // Arama & Filtreler
  const [search, setSearch] = useState("");
  const [filterSection, setFilterSection] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterStaff, setFilterStaff] = useState("ALL");
  const [filterSource, setFilterSource] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");

  // Modallar
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null); // Detay & Timeline
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null); // Kesin Kayıt
  const [lostModalLead, setLostModalLead] = useState<Lead | null>(null); // Kayıp Nedeni
  const [proformaLead, setProformaLead] = useState<Lead | null>(null); // Proforma Teklif Yazdırma

  // Yeni Aday Form Durumu
  const [formData, setFormData] = useState({
    studentName: "",
    birthDate: "",
    gender: "UNSPECIFIED",
    currentSchool: "",
    section: "ORTAOKUL" as "ANAOKULU" | "ILKOKUL" | "ORTAOKUL" | "LISE" | "KURS",
    targetGrade: "8. Sınıf (LGS)",
    educationType: "TAM_GUN" as "TAM_GUN" | "YARIM_GUN_SABAH" | "YARIM_GUN_OGLE",
    programInterest: "Tam Zamanlı Grup",
    campaignType: "",
    source: "INSTAGRAM",
    sourceDetail: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    parentName: "",
    parentRelation: "MOTHER",
    parentPhone: "",
    parentPhone2: "",
    parentEmail: "",
    parentJob: "",
    cityDistrict: "",
    address: "",
    assignedStaffId: "",
    offeredPrice: "",
    discountNote: "",
    notes: "",
    initialInteractionNote: "",
  });

  // Yeni Görüşme Formu (Timeline içinde)
  const [interactionForm, setInteractionForm] = useState({
    type: "PHONE_CALL",
    result: "APPOINTMENT_SET",
    notes: "",
    followUpDate: "",
    followUpTime: "",
    newLeadStatus: "",
  });
  const [submittingInteraction, setSubmittingInteraction] = useState(false);

  // Kesin Kayıt Formu
  const [convertForm, setConvertForm] = useState({
    tcNo: "",
    studentNo: "",
    fullName: "",
    classroomId: "",
    academicYear: "2025-2026",
    contractAmount: "",
    discountAmount: "0",
    installmentCount: "10",
    firstInstallmentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [converting, setConverting] = useState(false);

  // Kayıp Nedeni Formu
  const [lostReason, setLostReason] = useState("Fiyat yüksek bulundu");
  const [lostNotes, setLostNotes] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leadsRes, staffRes, classRes] = await Promise.all([
        fetch("/api/crm/leads"),
        fetch("/api/personel"),
        fetch("/api/siniflar"),
      ]);

      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data.leads || []);
      }
      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaffList(data.staff || []);
      }
      if (classRes.ok) {
        const data = await classRes.json();
        setClassrooms(data || []);
      }
    } catch (err) {
      console.error("CRM veri çekme hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrelenmiş Adaylar
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchSearch =
        !search.trim() ||
        lead.studentName.toLowerCase().includes(search.toLowerCase()) ||
        lead.parentName.toLowerCase().includes(search.toLowerCase()) ||
        lead.parentPhone.includes(search) ||
        (lead.currentSchool && lead.currentSchool.toLowerCase().includes(search.toLowerCase())) ||
        (lead.cityDistrict && lead.cityDistrict.toLowerCase().includes(search.toLowerCase()));

      const matchSection = filterSection === "ALL" || lead.section === filterSection;
      const matchStatus = filterStatus === "ALL" || lead.status === filterStatus;
      const matchStaff =
        filterStaff === "ALL" ||
        (filterStaff === "UNASSIGNED" ? !lead.assignedStaffId : lead.assignedStaffId === filterStaff);
      const matchSource = filterSource === "ALL" || lead.source === filterSource;
      const matchPriority = filterPriority === "ALL" || lead.priority === filterPriority;

      return matchSearch && matchSection && matchStatus && matchStaff && matchSource && matchPriority;
    });
  }, [leads, search, filterSection, filterStatus, filterStaff, filterSource, filterPriority]);

  // Aranacaklar Listesi (Follow-up takibi)
  const callList = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return leads
      .filter((lead) => {
        if (lead.status === "REGISTERED" || lead.status === "LOST") return false;
        // Son interaction'daki followUpDate
        const lastInterWithFollowUp = lead.interactions.find((i) => i.followUpDate);
        if (lastInterWithFollowUp && lastInterWithFollowUp.followUpDate) {
          const followStr = lastInterWithFollowUp.followUpDate.split("T")[0];
          return followStr <= todayStr;
        }
        // Hiç görüşme yapılmamış yeni adaylar da çağrı listesine düşer
        return lead.interactions.length === 0;
      })
      .sort((a, b) => (b.priority === "URGENT" ? 1 : -1));
  }, [leads]);

  // İstatistikler
  const stats = useMemo(() => {
    const total = leads.length;
    const registered = leads.filter((l) => l.status === "REGISTERED").length;
    const lost = leads.filter((l) => l.status === "LOST").length;
    const activePipeline = total - registered - lost;
    const conversionRate = total > 0 ? Math.round((registered / total) * 100) : 0;
    const totalOfferedValue = leads.reduce((sum, l) => sum + (l.offeredPrice || 0), 0);

    return { total, registered, lost, activePipeline, conversionRate, totalOfferedValue };
  }, [leads]);

  // Yeni Aday Kaydet / Düzenle
  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingLead ? `/api/crm/leads/${editingLead.id}` : "/api/crm/leads";
      const method = editingLead ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Aday kaydedilemedi.");
        return;
      }

      setIsAddModalOpen(false);
      setEditingLead(null);
      resetForm();
      fetchData();
    } catch {
      alert("İşlem sırasında sunucu hatası oluştu.");
    }
  };

  const resetForm = () => {
    setFormData({
      studentName: "",
      birthDate: "",
      gender: "UNSPECIFIED",
      currentSchool: "",
      section: "ORTAOKUL",
      targetGrade: "8. Sınıf (LGS)",
      educationType: "TAM_GUN",
      programInterest: "Tam Zamanlı Grup",
      campaignType: "",
      source: "INSTAGRAM",
      sourceDetail: "",
      priority: "MEDIUM",
      parentName: "",
      parentRelation: "MOTHER",
      parentPhone: "",
      parentPhone2: "",
      parentEmail: "",
      parentJob: "",
      cityDistrict: "",
      address: "",
      assignedStaffId: "",
      offeredPrice: "",
      discountNote: "",
      notes: "",
      initialInteractionNote: "",
    });
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      studentName: lead.studentName,
      birthDate: lead.birthDate ? lead.birthDate.split("T")[0] : "",
      gender: lead.gender || "UNSPECIFIED",
      currentSchool: lead.currentSchool || "",
      section: (lead.section as any) || "ORTAOKUL",
      targetGrade: lead.targetGrade || "8. Sınıf (LGS)",
      educationType: (lead.educationType as any) || "TAM_GUN",
      programInterest: lead.programInterest || "Tam Zamanlı Grup",
      campaignType: lead.campaignType || "",
      source: lead.source || "INSTAGRAM",
      sourceDetail: lead.sourceDetail || "",
      priority: lead.priority || "MEDIUM",
      parentName: lead.parentName,
      parentRelation: lead.parentRelation || "MOTHER",
      parentPhone: lead.parentPhone,
      parentPhone2: lead.parentPhone2 || "",
      parentEmail: lead.parentEmail || "",
      parentJob: lead.parentJob || "",
      cityDistrict: lead.cityDistrict || "",
      address: lead.address || "",
      assignedStaffId: lead.assignedStaffId || "",
      offeredPrice: lead.offeredPrice ? lead.offeredPrice.toString() : "",
      discountNote: lead.discountNote || "",
      notes: lead.notes || "",
      initialInteractionNote: "",
    });
    setIsAddModalOpen(true);
  };

  // Aşama Değiştirme
  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus as any } : l))
        );
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead((prev) => (prev ? { ...prev, status: newStatus as any } : null));
        }
      }
    } catch {
      alert("Aşama güncellenemedi.");
    }
  };

  // Yeni Görüşme Ekle
  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      setSubmittingInteraction(true);
      const res = await fetch(`/api/crm/leads/${selectedLead.id}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...interactionForm,
          staffId: selectedLead.assignedStaffId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Görüşme eklenemedi.");
        return;
      }

      setInteractionForm({
        type: "PHONE_CALL",
        result: "APPOINTMENT_SET",
        notes: "",
        followUpDate: "",
        followUpTime: "",
        newLeadStatus: "",
      });

      // Detayı ve listeyi tazele
      const detailRes = await fetch(`/api/crm/leads/${selectedLead.id}`);
      if (detailRes.ok) {
        const fresh = await detailRes.json();
        setSelectedLead(fresh);
        setLeads((prev) => prev.map((l) => (l.id === fresh.id ? fresh : l)));
      }
    } catch {
      alert("Hata oluştu.");
    } finally {
      setSubmittingInteraction(false);
    }
  };

  // Kesin Kayda Dönüştür
  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingLead) return;

    try {
      setConverting(true);
      const res = await fetch(`/api/crm/leads/${convertingLead.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(convertForm),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Dönüştürme başarısız oldu.");
        return;
      }

      alert("Tebrikler! Aday başarıyla kesin kayda dönüştürüldü ve öğrenci kütüğüne eklendi.");
      setConvertingLead(null);
      setSelectedLead(null);
      fetchData();
    } catch {
      alert("Sunucu hatası oluştu.");
    } finally {
      setConverting(false);
    }
  };

  // Kayıp / Olumsuz Olarak İşaretle
  const handleMarkLost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lostModalLead) return;

    try {
      await fetch(`/api/crm/leads/${lostModalLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "LOST",
          lostReason: `${lostReason} - ${lostNotes}`.trim(),
        }),
      });

      setLostModalLead(null);
      setSelectedLead(null);
      fetchData();
    } catch {
      alert("Hata oluştu.");
    }
  };

  // Excel Dışa Aktar
  const handleExportExcel = () => {
    const rows = filteredLeads.map((l) => ({
      "Öğrenci Adı": l.studentName,
      "Hedef Sınıf": l.targetGrade || "-",
      "Mevcut Okul": l.currentSchool || "-",
      "Veli Adı": l.parentName,
      "Veli Telefonu": l.parentPhone,
      "Aşama": STAGES.find((s) => s.id === l.status)?.label || l.status,
      "Kaynak": SOURCES[l.source] || l.source,
      "Öncelik": PRIORITIES[l.priority]?.label || l.priority,
      "Danışman": l.assignedStaff?.fullName || "Atanmadı",
      "Teklif Tutarı (TL)": l.offeredPrice || 0,
      "Kayıt Tarihi": new Date(l.createdAt).toLocaleDateString("tr-TR"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Adaylar");
    XLSX.writeFile(workbook, `Cosmos_CRM_Adaylar_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 lg:p-8 space-y-6">
      {/* Header & KPI Paneli */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-800 text-white shadow-xs">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">CRM & Aday Öğrenci Yönetimi</h1>
              <p className="text-xs text-slate-500 font-medium">
                Potansiyel veli havuzu, çağrı listeleri, danışman takibi ve satış hunisi
              </p>
            </div>
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
              setEditingLead(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Aday Ekle</span>
          </button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Toplam Aday</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-slate-800">{stats.total}</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-600 block uppercase tracking-wider">Aktif İletişim</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-blue-700">{stats.activePipeline}</span>
            <PhoneCall className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 block uppercase tracking-wider">Kesin Kayıt</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-emerald-700">{stats.registered}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-teal-600 block uppercase tracking-wider">Dönüşüm Oranı</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-teal-800">%{stats.conversionRate}</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-purple-600 block uppercase tracking-wider">Bugün Aranacak</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-purple-700">{callList.length}</span>
            <CalendarClock className="w-4 h-4 text-purple-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-rose-600 block uppercase tracking-wider">Kayıp / Olumsuz</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-rose-700">{stats.lost}</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
        </div>
      </div>

      {/* Görünüm Sekmeleri ve Arama Filtre Barı */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Sekmeler */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl max-w-fit">
            <button
              onClick={() => setActiveTab("kanban")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "kanban"
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Kanban Panosu</span>
            </button>
            <button
              onClick={() => setActiveTab("calls")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "calls"
                  ? "bg-white text-purple-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Arama Listesi ({callList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("table")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "table"
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Aday Listesi ({filteredLeads.length})</span>
            </button>
          </div>

          {/* Hızlı Arama */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Öğrenci adı, veli adı, telefon, okul veya ilçe ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Kademe Filtre Butonları */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <School className="w-3.5 h-3.5 text-teal-700" /> Kademe:
          </span>
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setFilterSection(sec.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterSection === sec.id
                  ? "bg-teal-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{sec.icon}</span>
              <span>{sec.label}</span>
            </button>
          ))}
        </div>

        {/* Filtre Açılır Menüleri */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">Tüm Aşamalar</option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">Tüm Danışmanlar</option>
            <option value="UNASSIGNED">Atanmamış Adaylar</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.title || "Personel"})
              </option>
            ))}
          </select>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">Tüm Kaynaklar</option>
            {Object.entries(SOURCES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">Tüm Öncelikler</option>
            {Object.entries(PRIORITIES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ================= TAB 1: KANBAN GÖRÜNÜMÜ ================= */}
      {activeTab === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.status === stage.id);
            return (
              <div
                key={stage.id}
                className="bg-slate-100/70 rounded-2xl p-3 border border-slate-200/80 min-w-[260px] flex flex-col max-h-[calc(100vh-280px)]"
              >
                {/* Sütun Başlığı */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${stage.badgeColor}`} />
                    <span className="text-xs font-bold text-slate-800">{stage.label}</span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 shadow-xs">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Sütun Kartları */}
                <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
                  {stageLeads.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center">
                      <p className="text-[11px] text-slate-400 font-medium">Bu aşamada aday yok</p>
                    </div>
                  ) : (
                    stageLeads.map((lead) => {
                      const priorityInfo = PRIORITIES[lead.priority] || PRIORITIES.MEDIUM;
                      return (
                        <div
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          className="bg-white rounded-xl p-3.5 border border-slate-200 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer group space-y-2.5 relative"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
                                {lead.studentName}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-medium">
                                {lead.targetGrade || "Sınıf belirtilmedi"}
                              </p>
                            </div>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${priorityInfo.color}`}
                            >
                              {priorityInfo.label}
                            </span>
                          </div>

                          {/* Veli & İletişim */}
                          <div className="space-y-1 text-[11px] text-slate-600 bg-slate-50/80 p-2 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold truncate">{lead.parentName}</span>
                              <span className="text-[10px] text-slate-400">
                                {lead.parentRelation === "MOTHER"
                                  ? "Anne"
                                  : lead.parentRelation === "FATHER"
                                  ? "Baba"
                                  : "Vasi"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-teal-700 font-mono text-[10px]">
                              <Phone className="w-3 h-3" />
                              <span>{lead.parentPhone}</span>
                            </div>
                          </div>

                          {/* Danışman ve Kaynak */}
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                            <span className="truncate max-w-[120px]">
                              👤 {lead.assignedStaff?.fullName || "Danışman Yok"}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {SOURCES[lead.source] ? SOURCES[lead.source].split("/")[0] : lead.source}
                            </span>
                          </div>

                          {/* Hızlı Aşama Değiştirme Butonları */}
                          <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-[10px]">
                            {stage.id !== "REGISTERED" && stage.id !== "LOST" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConvertingLead(lead);
                                  setConvertForm((prev) => ({
                                    ...prev,
                                    fullName: lead.studentName,
                                    contractAmount: lead.offeredPrice ? lead.offeredPrice.toString() : "",
                                  }));
                                }}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold"
                              >
                                <GraduationCap className="w-3 h-3" />
                                <span>Kayıt Yap</span>
                              </button>
                            )}

                            {stage.id === "REGISTERED" && (
                              <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Kayıtlı Öğrenci
                              </span>
                            )}

                            <span className="text-slate-400 group-hover:text-teal-600 ml-auto flex items-center gap-0.5">
                              İncele <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= TAB 2: BUGÜN ARANACAKLAR / ÇAĞRI LİSTESİ ================= */}
      {activeTab === "calls" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-purple-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-600 text-white">
                <CalendarClock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Günlük Arama ve Takip Listesi</h3>
                <p className="text-xs text-slate-500">
                  Bugün aranması gereken, takip tarihi geçmiş veya hiç aranmamış adaylar
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
              {callList.length} Aday Bekliyor
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {callList.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-700">Tebrikler! Bekleyen aramanız bulunmuyor.</p>
                <p className="text-xs text-slate-400">Tüm takipler ve görüşmeler başarıyla tamamlandı.</p>
              </div>
            ) : (
              callList.map((lead) => {
                const lastInter = lead.interactions[0];
                return (
                  <div
                    key={lead.id}
                    className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800">{lead.studentName}</span>
                        <span className="text-xs text-slate-500">({lead.targetGrade || "Sınıf Yok"})</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            PRIORITIES[lead.priority]?.color
                          }`}
                        >
                          {PRIORITIES[lead.priority]?.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span>
                          <strong>Veli:</strong> {lead.parentName} ({lead.parentRelation === "MOTHER" ? "Anne" : "Baba"})
                        </span>
                        <span className="font-mono text-teal-700 font-semibold flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {lead.parentPhone}
                        </span>
                        {lead.cityDistrict && <span>📍 {lead.cityDistrict}</span>}
                        <span>👤 Danışman: {lead.assignedStaff?.fullName || "Atanmadı"}</span>
                      </div>
                      {lastInter && (
                        <p className="text-[11px] text-slate-500 bg-slate-100 p-1.5 rounded-lg max-w-xl">
                          <strong>Son Not:</strong> {lastInter.notes || "Not girilmemiş"}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:${lead.parentPhone}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Hemen Ara</span>
                      </a>
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
                      >
                        Görüşme Kaydet
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: TABLO GÖRÜNÜMÜ ================= */}
      {activeTab === "table" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Öğrenci & Okul</th>
                  <th className="py-3 px-4">Veli & İletişim</th>
                  <th className="py-3 px-4">Aşama / Durum</th>
                  <th className="py-3 px-4">Öncelik</th>
                  <th className="py-3 px-4">Kaynak</th>
                  <th className="py-3 px-4">Danışman</th>
                  <th className="py-3 px-4">Teklif (TL)</th>
                  <th className="py-3 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Arama kriterlerine uygun aday bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const stage = STAGES.find((s) => s.id === lead.status) || STAGES[0];
                    return (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800">{lead.studentName}</p>
                          <p className="text-[11px] text-slate-400">{lead.targetGrade || lead.currentSchool || "-"}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800">{lead.parentName}</p>
                          <p className="font-mono text-teal-700 text-[11px]">{lead.parentPhone}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${stage.color}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${stage.badgeColor}`} />
                            {stage.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                              PRIORITIES[lead.priority]?.color
                            }`}
                          >
                            {PRIORITIES[lead.priority]?.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-600">
                          {SOURCES[lead.source] || lead.source}
                        </td>
                        <td className="py-3.5 px-4 text-[11px]">
                          {lead.assignedStaff?.fullName ? (
                            <span className="font-semibold text-slate-700">👤 {lead.assignedStaff.fullName}</span>
                          ) : (
                            <span className="text-slate-400 italic">Atanmadı</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {lead.offeredPrice ? `${lead.offeredPrice.toLocaleString("tr-TR")} ₺` : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedLead(lead)}
                              title="Detay & Zaman Çizelgesi"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditModal(lead)}
                              title="Düzenle"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {lead.status !== "REGISTERED" && (
                              <button
                                onClick={() => {
                                  setConvertingLead(lead);
                                  setConvertForm((prev) => ({
                                    ...prev,
                                    fullName: lead.studentName,
                                    contractAmount: lead.offeredPrice ? lead.offeredPrice.toString() : "",
                                  }));
                                }}
                                title="Kesin Kayda Dönüştür"
                                className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              >
                                <GraduationCap className="w-3.5 h-3.5" />
                              </button>
                            )}
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
      )}

      {/* ================= MODAL 1: YENİ ADAY / ADAY DÜZENLEME ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {editingLead ? "Aday Öğrenciyi Güncelle" : "Yeni Aday Öğrenci Girişi"}
                  </h3>
                  <p className="text-[11px] text-slate-500">Öğrenci, veli ve kayıt potansiyeli bilgilerini giriniz</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Öğrenci Bilgileri */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-teal-700" /> Aday Öğrenci Bilgileri & Kademe
                </h4>

                {/* Kademe Seçimi */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Okul Kademesi *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {SECTIONS.filter(s => s.id !== "ALL").map((sec) => (
                      <button
                        type="button"
                        key={sec.id}
                        onClick={() => {
                          const grades = SECTION_GRADES[sec.id] || [];
                          setFormData({
                            ...formData,
                            section: sec.id as any,
                            targetGrade: grades[0] || formData.targetGrade,
                          });
                        }}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all ${
                          formData.section === sec.id
                            ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span>{sec.icon}</span>
                        <span>{sec.label.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Öğrenci Adı Soyadı *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      placeholder="Örn: Deniz Kaya"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Eğitim Şekli / Zamanı
                    </label>
                    <select
                      value={formData.educationType}
                      onChange={(e) => setFormData({ ...formData, educationType: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none font-semibold text-slate-800"
                    >
                      <option value="TAM_GUN">Tam Gün (08:30 - 17:30)</option>
                      <option value="YARIM_GUN_SABAH">Yarım Gün Sabah (08:30 - 12:30)</option>
                      <option value="YARIM_GUN_OGLE">Yarım Gün Öğle (13:00 - 17:30)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hedef Sınıf / Yaş Grubu *
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(SECTION_GRADES[formData.section] || []).map((grade) => (
                        <button
                          type="button"
                          key={grade}
                          onClick={() => setFormData({ ...formData, targetGrade: grade })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                            formData.targetGrade === grade
                              ? "bg-teal-50 border-teal-600 text-teal-800 font-bold"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {grade}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.targetGrade}
                      onChange={(e) => setFormData({ ...formData, targetGrade: e.target.value })}
                      placeholder="Örn: 3 Yaş (Oyun Grubu), 8. Sınıf (LGS), vb."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mevcut Okulu / Yuvası
                    </label>
                    <input
                      type="text"
                      value={formData.currentSchool}
                      onChange={(e) => setFormData({ ...formData, currentSchool: e.target.value })}
                      placeholder="Örn: Minik Kalpler Anaokulu"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      İlgilendiği Program / Beklenti
                    </label>
                    <input
                      type="text"
                      value={formData.programInterest}
                      onChange={(e) => setFormData({ ...formData, programInterest: e.target.value })}
                      placeholder="Örn: İngilizce Ağırlıklı, Oyun Tabanlı, Etüt"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Veli Bilgileri */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-teal-700" /> Veli & İletişim Bilgileri
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Veli Adı Soyadı *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      placeholder="Örn: Mehmet Kaya"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Yakınlık Derecesi
                    </label>
                    <select
                      value={formData.parentRelation}
                      onChange={(e) => setFormData({ ...formData, parentRelation: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                    >
                      <option value="MOTHER">Anne</option>
                      <option value="FATHER">Baba</option>
                      <option value="GUARDIAN">Yasal Vasi</option>
                      <option value="OTHER">Diğer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Veli Telefonu *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      placeholder="05XX XXX XX XX"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Veli Mesleği
                    </label>
                    <input
                      type="text"
                      value={formData.parentJob}
                      onChange={(e) => setFormData({ ...formData, parentJob: e.target.value })}
                      placeholder="Örn: Mühendis, Doktor, Esnaf"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      İlçe / Bölge
                    </label>
                    <input
                      type="text"
                      value={formData.cityDistrict}
                      onChange={(e) => setFormData({ ...formData, cityDistrict: e.target.value })}
                      placeholder="Örn: Kadıköy / Moda"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Veli E-Posta
                    </label>
                    <input
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                      placeholder="veli@example.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Pazarlama, Danışman & Teklif */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-teal-700" /> Kaynak, Danışman & Fiyat Teklifi
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Aday Kaynağı
                    </label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                    >
                      {Object.entries(SOURCES).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kaynak Detayı / Referans Veli
                    </label>
                    <input
                      type="text"
                      value={formData.sourceDetail}
                      onChange={(e) => setFormData({ ...formData, sourceDetail: e.target.value })}
                      placeholder="Örn: Ahmet Bey'in tavsiyesi"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kayıt Danışmanı (Personel)
                    </label>
                    <select
                      value={formData.assignedStaffId}
                      onChange={(e) => setFormData({ ...formData, assignedStaffId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                    >
                      <option value="">Danışman Seçin...</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({s.title || "Personel"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Öncelik Seviyesi
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                    >
                      {Object.entries(PRIORITIES).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kampanya Türü
                    </label>
                    <select
                      value={formData.campaignType}
                      onChange={(e) => setFormData({ ...formData, campaignType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                    >
                      <option value="">Standart Fiyat / Kampanyasız</option>
                      {CAMPAIGN_PRESETS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Önerilen Teklif Tutarı (TL)
                    </label>
                    <input
                      type="number"
                      value={formData.offeredPrice}
                      onChange={(e) => setFormData({ ...formData, offeredPrice: e.target.value })}
                      placeholder="Örn: 95000"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none font-mono"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      İndirim / Kampanya Açıklaması
                    </label>
                    <input
                      type="text"
                      value={formData.discountNote}
                      onChange={(e) => setFormData({ ...formData, discountNote: e.target.value })}
                      placeholder="Örn: Erken Kayıt %10 İndirimi + Peşin Ödeme Avantajı"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {!editingLead && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      İlk Görüşme Notu (Opsiyonel)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.initialInteractionNote}
                      onChange={(e) => setFormData({ ...formData, initialInteractionNote: e.target.value })}
                      placeholder="Veli ile yapılan ilk temas özeti..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs"
                >
                  {editingLead ? "Değişiklikleri Kaydet" : "Adayı Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ADAY DETAY & ZAMAN ÇİZELGESİ (TIMELINE) ================= */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                  Aday Detayı & Görüşme Geçmişi
                </span>
                <h3 className="text-base font-bold text-slate-800">{selectedLead.studentName}</h3>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* İçerik */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Durum & Aksiyon Butonları */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Mevcut Aşama:</span>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => handleUpdateStatus(selectedLead.id, e.target.value)}
                    className="mt-0.5 px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setProformaLead(selectedLead)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
                    title="Veliye sunulacak resmi proforma fiyat teklifini yazdır"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Fiyat Teklifi / Proforma</span>
                  </button>

                  {selectedLead.status !== "REGISTERED" && (
                    <button
                      onClick={() => {
                        setConvertingLead(selectedLead);
                        setConvertForm((prev) => ({
                          ...prev,
                          fullName: selectedLead.studentName,
                          contractAmount: selectedLead.offeredPrice ? selectedLead.offeredPrice.toString() : "",
                        }));
                      }}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Kesin Kayda Dönüştür</span>
                    </button>
                  )}

                  {selectedLead.status !== "LOST" && selectedLead.status !== "REGISTERED" && (
                    <button
                      onClick={() => setLostModalLead(selectedLead)}
                      className="px-2.5 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold"
                    >
                      Kaybedildi
                    </button>
                  )}
                </div>
              </div>

              {/* Temel Bilgiler Kartı */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium">Kademe & Sınıf</span>
                  <div className="flex items-center gap-1">
                    {selectedLead.section && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                        {selectedLead.section === "ANAOKULU" ? "🧸 Anaokulu" :
                         selectedLead.section === "ILKOKUL" ? "🎒 İlkokul" :
                         selectedLead.section === "ORTAOKUL" ? "📚 Ortaokul" :
                         selectedLead.section === "LISE" ? "🎓 Lise" : "🎯 Kurs"}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-slate-800">{selectedLead.targetGrade || "Belirtilmedi"}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium">Eğitim Şekli</span>
                  <p className="font-bold text-slate-800">
                    {selectedLead.educationType === "TAM_GUN"
                      ? "Tam Gün (08:30 - 17:30)"
                      : selectedLead.educationType === "YARIM_GUN_SABAH"
                      ? "Yarım Gün (Sabah)"
                      : selectedLead.educationType === "YARIM_GUN_OGLE"
                      ? "Yarım Gün (Öğle)"
                      : "Tam Gün"}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium">Veli İletişim</span>
                  <p className="font-bold text-slate-800">{selectedLead.parentName}</p>
                  <p className="font-mono text-teal-700">{selectedLead.parentPhone}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium">Kayıt Danışmanı</span>
                  <p className="font-bold text-slate-800">{selectedLead.assignedStaff?.fullName || "Atanmadı"}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium">Teklif Tutarı</span>
                  <p className="font-bold text-slate-800">
                    {selectedLead.offeredPrice ? `${selectedLead.offeredPrice.toLocaleString("tr-TR")} ₺` : "Teklif yok"}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium">Uygulanan Kampanya</span>
                  <p className="font-semibold text-slate-800 truncate">
                    {selectedLead.campaignType || selectedLead.discountNote || "Standart"}
                  </p>
                </div>
              </div>

              {/* Yeni Görüşme / Etkileşim Ekleme Formu */}
              <form onSubmit={handleAddInteraction} className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-3">
                <h4 className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                  <PhoneCall className="w-4 h-4 text-teal-700" /> Yeni Görüşme / Arama Kaydet
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Görüşme Türü</label>
                    <select
                      value={interactionForm.type}
                      onChange={(e) => setInteractionForm({ ...interactionForm, type: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                    >
                      <option value="PHONE_CALL">Telefon Araması</option>
                      <option value="VISIT">Kurum Ziyareti / Kampüs Turu</option>
                      <option value="WHATSAPP">WhatsApp Mesajlaşması</option>
                      <option value="SMS">SMS Gönderimi</option>
                      <option value="EXAM">Bursluluk / Deneme Sınavı</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Sonuç</label>
                    <select
                      value={interactionForm.result}
                      onChange={(e) => setInteractionForm({ ...interactionForm, result: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                    >
                      <option value="APPOINTMENT_SET">Randevu Alındı</option>
                      <option value="OFFER_GIVEN">Fiyat Teklifi Verildi</option>
                      <option value="THINKING">Düşünüyor / Karar Aşamasında</option>
                      <option value="NO_ANSWER">Cevap Vermedi / Meşgul</option>
                      <option value="POSITIVE">Olumlu / Kesin Kayda Yakın</option>
                      <option value="NEGATIVE">Olumsuz</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Görüşme Notları *</label>
                  <textarea
                    required
                    rows={2}
                    value={interactionForm.notes}
                    onChange={(e) => setInteractionForm({ ...interactionForm, notes: e.target.value })}
                    placeholder="Veli ne söyledi? Hangi konulara odaklanıldı?..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Takip Tarihi
                    </label>
                    <input
                      type="date"
                      value={interactionForm.followUpDate}
                      onChange={(e) => setInteractionForm({ ...interactionForm, followUpDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Takip Saati
                    </label>
                    <input
                      type="time"
                      value={interactionForm.followUpTime}
                      onChange={(e) => setInteractionForm({ ...interactionForm, followUpTime: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Aşamayı Otomatik Güncelle
                    </label>
                    <select
                      value={interactionForm.newLeadStatus}
                      onChange={(e) => setInteractionForm({ ...interactionForm, newLeadStatus: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                    >
                      <option value="">Aşama Değişmesin</option>
                      {STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label} Yap
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-right pt-1">
                  <button
                    type="submit"
                    disabled={submittingInteraction}
                    className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                  >
                    {submittingInteraction ? "Kaydediliyor..." : "Görüşmeyi Kaydet"}
                  </button>
                </div>
              </form>

              {/* Görüşme Zaman Tüneli (Timeline) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-700" /> Görüşme Geçmişi ({selectedLead.interactions.length})
                </h4>

                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {selectedLead.interactions.length === 0 ? (
                    <p className="text-xs text-slate-400 italic pl-6">Henüz görüşme kaydı girilmedi.</p>
                  ) : (
                    selectedLead.interactions.map((interaction) => (
                      <div key={interaction.id} className="relative pl-6 space-y-1">
                        <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-white" />
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800">
                              {interaction.type === "PHONE_CALL"
                                ? "📞 Telefon Araması"
                                : interaction.type === "VISIT"
                                ? "🏫 Kurum Ziyareti"
                                : interaction.type === "WHATSAPP"
                                ? "💬 WhatsApp"
                                : "📋 Görüşme"}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {new Date(interaction.createdAt).toLocaleString("tr-TR")}
                            </span>
                          </div>

                          <p className="text-slate-700 whitespace-pre-wrap">{interaction.notes}</p>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                            <span>Sonuç: <strong>{interaction.result}</strong></span>
                            {interaction.followUpDate && (
                              <span className="text-purple-700 font-semibold flex items-center gap-1">
                                <Clock3 className="w-3 h-3" /> Takip: {new Date(interaction.followUpDate).toLocaleDateString("tr-TR")}
                                {interaction.followUpTime && ` • ${interaction.followUpTime}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: KESİN KAYDA DÖNÜŞTÜR (ADAY -> ÖĞRENCİ) ================= */}
      {convertingLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Kesin Kayıt & Sözleşme Oluştur</h3>
                  <p className="text-[11px] text-slate-500">
                    {convertingLead.studentName} için öğrenci kütüğü ve taksit planı oluşturun
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConvertingLead(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConvertLead} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">T.C. Kimlik No *</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={convertForm.tcNo}
                    onChange={(e) => setConvertForm({ ...convertForm, tcNo: e.target.value })}
                    placeholder="11 haneli T.C. No"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Öğrenci No (Opsiyonel)</label>
                  <input
                    type="text"
                    value={convertForm.studentNo}
                    onChange={(e) => setConvertForm({ ...convertForm, studentNo: e.target.value })}
                    placeholder="Otomatik üretilir"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Öğrenci Adı Soyadı *</label>
                <input
                  type="text"
                  required
                  value={convertForm.fullName}
                  onChange={(e) => setConvertForm({ ...convertForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sınıf / Şube Ataması</label>
                  <select
                    value={convertForm.classroomId}
                    onChange={(e) => setConvertForm({ ...convertForm, classroomId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                  >
                    <option value="">Sınıf Seçiniz...</option>
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.gradeLevel}. Seviye - Kapasite: {c.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Akademik Yıl</label>
                  <input
                    type="text"
                    value={convertForm.academicYear}
                    onChange={(e) => setConvertForm({ ...convertForm, academicYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Taksit ve Fiyatlandırma */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <span className="font-bold text-slate-800 block text-xs">Finans & Taksit Planı</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Eğitim Ücreti (TL)</label>
                    <input
                      type="number"
                      required
                      value={convertForm.contractAmount}
                      onChange={(e) => setConvertForm({ ...convertForm, contractAmount: e.target.value })}
                      placeholder="Örn: 90000"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">İndirim (TL)</label>
                    <input
                      type="number"
                      value={convertForm.discountAmount}
                      onChange={(e) => setConvertForm({ ...convertForm, discountAmount: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Taksit Sayısı</label>
                    <select
                      value={convertForm.installmentCount}
                      onChange={(e) => setConvertForm({ ...convertForm, installmentCount: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                    >
                      <option value="1">1 (Peşin)</option>
                      <option value="3">3 Taksit</option>
                      <option value="6">6 Taksit</option>
                      <option value="8">8 Taksit</option>
                      <option value="10">10 Taksit</option>
                      <option value="12">12 Taksit</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">İlk Taksit Vade Tarihi</label>
                  <input
                    type="date"
                    value={convertForm.firstInstallmentDate}
                    onChange={(e) => setConvertForm({ ...convertForm, firstInstallmentDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConvertingLead(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={converting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {converting ? "Dönüştürülüyor..." : "Kesin Kaydı Tamamla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: KAYIP NEDENİ ================= */}
      {lostModalLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-100 bg-rose-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-800 text-sm">Aday Kaybedildi Olarak İşaretlensin mi?</h3>
              </div>
              <button
                onClick={() => setLostModalLead(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMarkLost} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kaybetme Nedeni</label>
                <select
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                >
                  <option value="Fiyat yüksek bulundu">Fiyat yüksek bulundu / Bütçe yetersiz</option>
                  <option value="Rakip kuruma yazıldı">Rakip kuruma kayıt yaptırdı</option>
                  <option value="Ulaşım / Mesafe uzak">Ulaşım / Mesafe uzak bulundu</option>
                  <option value="Program saatleri uymadı">Program / Ders saatleri uymadı</option>
                  <option value="Veli erteledi / Vazgeçti">Veli bu dönem için vazgeçti</option>
                  <option value="Ulaşılamadı">Veliye defalarca ulaşılamadı</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ek Açıklama / Not</label>
                <textarea
                  rows={2}
                  value={lostNotes}
                  onChange={(e) => setLostNotes(e.target.value)}
                  placeholder="Detaylı gerekçe..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLostModalLead(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
                >
                  Kaydet ve Kapat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: PROFORMA FİYAT TEKLİFİ YAZDIRMA (PDF) ================= */}
      {proformaLead && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 my-8">
            {/* Üst Eylem Çubuğu (Yazdırmada Gizli) */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                  <Printer className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-800 text-xs">
                  Resmi Fiyat Teklifi & Proforma Önizleme
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Yazdır / PDF Kaydet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProformaLead(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Baskı Gövdesi */}
            <div className="p-8 space-y-6 text-slate-800 bg-white">
              {/* Kurum Başlığı */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center font-extrabold text-sm">
                      C
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                        COSMOS EĞİTİM KURUMLARI
                      </h2>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                        Okul Öncesi • İlkokul • Ortaokul • Lise • Özel Öğretim Kursları
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] space-y-0.5 font-mono">
                  <p className="font-bold text-slate-900">
                    TEKLİF NO: <span className="text-teal-800">PRF-{proformaLead.id.slice(-6).toUpperCase()}</span>
                  </p>
                  <p className="text-slate-500">
                    Tarih: {new Date().toLocaleDateString("tr-TR")}
                  </p>
                  <p className="text-rose-600 font-semibold text-[10px]">
                    * 7 Gün Süreyle Geçerlidir
                  </p>
                </div>
              </div>

              {/* Teklif Başlığı */}
              <div className="text-center py-1 bg-slate-100 rounded-lg border border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-800 tracking-wide uppercase">
                  ADAY ÖĞRENCİ EĞİTİM HİZMETLERİ FİYAT VE KAYIT TEKLİFİ
                </h3>
              </div>

              {/* Aday & Veli Bilgileri */}
              <div className="grid grid-cols-2 gap-4 text-xs border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="space-y-1.5">
                  <p className="text-slate-400 font-semibold text-[10px] uppercase">Aday Öğrenci Bilgileri</p>
                  <p><strong>Adı Soyadı:</strong> <span className="font-bold text-slate-900">{proformaLead.studentName}</span></p>
                  <p>
                    <strong>Kademe:</strong>{" "}
                    {proformaLead.section === "ANAOKULU" ? "🧸 Anaokulu (Okul Öncesi)" :
                     proformaLead.section === "ILKOKUL" ? "🎒 İlkokul" :
                     proformaLead.section === "ORTAOKUL" ? "📚 Ortaokul" :
                     proformaLead.section === "LISE" ? "🎓 Lise" : "🎯 Kurs / Etüt"}
                  </p>
                  <p><strong>Hedef Sınıf / Seviye:</strong> {proformaLead.targetGrade || "-"}</p>
                  <p>
                    <strong>Öğrenim Şekli:</strong>{" "}
                    {proformaLead.educationType === "TAM_GUN"
                      ? "Tam Gün (08:30 - 17:30)"
                      : proformaLead.educationType === "YARIM_GUN_SABAH"
                      ? "Yarım Gün Sabah (08:30 - 12:30)"
                      : proformaLead.educationType === "YARIM_GUN_OGLE"
                      ? "Yarım Gün Öğle (13:00 - 17:30)"
                      : "Tam Gün"}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-slate-400 font-semibold text-[10px] uppercase">Veli & Danışman Bilgileri</p>
                  <p><strong>Veli Adı Soyadı:</strong> {proformaLead.parentName}</p>
                  <p><strong>İletişim Tel:</strong> <span className="font-mono font-semibold">{proformaLead.parentPhone}</span></p>
                  <p><strong>İkamet / İlçe:</strong> {proformaLead.cityDistrict || "-"}</p>
                  <p><strong>Kayıt Danışmanı:</strong> {proformaLead.assignedStaff?.fullName || "Kayıt Kabul Koordinatörlüğü"}</p>
                </div>
              </div>

              {/* Finansal Teklif Tablosu */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Eğitim Ücreti & Uygulanan İndirimler
                </h4>

                {(() => {
                  const netPrice = proformaLead.offeredPrice || 0;
                  const listPrice = Math.round(netPrice * 1.15);
                  const discount = listPrice - netPrice;
                  return (
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Hizmet Tanımı</th>
                            <th className="p-3 text-right">Liste Fiyatı</th>
                            <th className="p-3 text-right">İndirim / Kampanya</th>
                            <th className="p-3 text-right">Net Teklif Tutarı</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="p-3">
                              <p className="font-bold text-slate-900">
                                2025-2026 Eğitim-Öğretim Yılı Kayıt Paketi
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {proformaLead.campaignType || proformaLead.discountNote || "Standart Kayıt Paketi"}
                              </p>
                            </td>
                            <td className="p-3 text-right font-mono text-slate-400 line-through">
                              {listPrice.toLocaleString("tr-TR")} ₺
                            </td>
                            <td className="p-3 text-right font-mono text-emerald-700 font-semibold">
                              - {discount > 0 ? discount.toLocaleString("tr-TR") : "0"} ₺
                            </td>
                            <td className="p-3 text-right font-mono font-extrabold text-sm text-teal-900 bg-teal-50/50">
                              {netPrice.toLocaleString("tr-TR")} ₺
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Alternatif Ödeme Projeksiyonu */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Alternatif Ödeme ve Taksit Seçenekleri
                </h4>
                {(() => {
                  const net = proformaLead.offeredPrice || 0;
                  const cash = Math.round(net * 0.95);
                  const inst6 = Math.round(net / 6);
                  const inst10 = Math.round(net / 10);
                  return (
                    <div className="grid grid-cols-3 gap-3 text-center text-xs">
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">1. Peşin / Tek Çekim</span>
                        <span className="text-base font-extrabold text-slate-900 font-mono block mt-1">
                          {cash.toLocaleString("tr-TR")} ₺
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold">%5 Ekstra Peşin İndirimi</span>
                      </div>

                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">2. 6 Taksit Planı</span>
                        <span className="text-base font-extrabold text-slate-900 font-mono block mt-1">
                          {inst6.toLocaleString("tr-TR")} ₺ <span className="text-xs font-normal text-slate-500">/ ay</span>
                        </span>
                        <span className="text-[10px] text-slate-500">Toplam: {net.toLocaleString("tr-TR")} ₺</span>
                      </div>

                      <div className="p-3 rounded-xl border-2 border-teal-600 bg-teal-50/40">
                        <span className="text-[10px] font-bold text-teal-800 block uppercase">3. 10 Taksit (Maksimum Vade)</span>
                        <span className="text-base font-extrabold text-teal-900 font-mono block mt-1">
                          {inst10.toLocaleString("tr-TR")} ₺ <span className="text-xs font-normal text-slate-500">/ ay</span>
                        </span>
                        <span className="text-[10px] text-teal-700 font-semibold">Taksitli Standart Plan</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Notlar & MEB Bilgilendirmesi */}
              <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <p><strong>Önemli Bilgilendirme:</strong></p>
                <p>1. Bu proforma teklif belgesi, adayın kurumumuza ön kaydının yapılabilmesi amacıyla hazırlanmış olup kesin kayıt sözleşmesi yerine geçmez.</p>
                <p>2. Belirtilen fiyat ve taksit avantajları, teklif tarihinden itibaren 7 (yedi) takvim günü boyunca geçerlidir.</p>
                <p>3. Kesin kayıt sırasında Millî Eğitim Bakanlığı Standart Sözleşmesi (Ek-1) tanzim edilerek karşılıklı imza altına alınacaktır.</p>
              </div>

              {/* İmzalar */}
              <div className="grid grid-cols-2 pt-6 text-center text-xs font-semibold">
                <div className="space-y-12">
                  <p>COSMOS EĞİTİM KURUMLARI<br /><span className="text-[10px] font-normal text-slate-500">Kayıt Kabul Yetkilisi / Kaşe - İmza</span></p>
                  <p className="font-mono text-slate-400">________________________</p>
                </div>

                <div className="space-y-12">
                  <p>VELİ / MUHATAP<br /><span className="text-[10px] font-normal text-slate-500">Teklif Bilgilerini İnceledim</span></p>
                  <p className="font-mono text-slate-400">________________________</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
