"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  CalendarDays,
  Landmark,
  Building2,
  Users,
  Package,
  CalendarCheck,
  Wrench,
  CheckSquare,
  RefreshCw,
  X,
  Tag,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";

interface WorkTask {
  id: string;
  title: string;
  description: string | null;
  dueDate: string; // YYYY-MM-DD
  dueTime: string | null;
  category: string;
  priority: string;
  status: string; // BEKLIYOR, TAMAMLANDI
  completedAt: string | null;
  completedBy: string | null;
  assignedTo: string | null;
  recurring: string | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES: Record<
  string,
  { label: string; icon: any; badgeBg: string; border: string; text: string }
> = {
  BANKA: {
    label: "Banka & Finans",
    icon: Landmark,
    badgeBg: "bg-amber-100",
    border: "border-amber-300",
    text: "text-amber-800",
  },
  MEB: {
    label: "MEB & Resmi Kurum",
    icon: Building2,
    badgeBg: "bg-rose-100",
    border: "border-rose-300",
    text: "text-rose-800",
  },
  PERSONEL: {
    label: "Personel & İK",
    icon: Users,
    badgeBg: "bg-indigo-100",
    border: "border-indigo-300",
    text: "text-indigo-800",
  },
  TEDARIK: {
    label: "Tedarik & Satınalma",
    icon: Package,
    badgeBg: "bg-blue-100",
    border: "border-blue-300",
    text: "text-blue-800",
  },
  GORUSME: {
    label: "Toplantı & Görüşme",
    icon: CalendarCheck,
    badgeBg: "bg-purple-100",
    border: "border-purple-300",
    text: "text-purple-800",
  },
  BAKIM: {
    label: "Bakım & Onarım",
    icon: Wrench,
    badgeBg: "bg-orange-100",
    border: "border-orange-300",
    text: "text-orange-800",
  },
  GENEL: {
    label: "Genel Görev",
    icon: CheckSquare,
    badgeBg: "bg-slate-100",
    border: "border-slate-300",
    text: "text-slate-800",
  },
};

const PRIORITIES: Record<string, { label: string; badge: string }> = {
  ACIL: { label: "Acil", badge: "bg-red-500 text-white font-bold" },
  NORMAL: { label: "Normal", badge: "bg-blue-100 text-blue-700 font-semibold" },
  DUSUK: { label: "Düşük", badge: "bg-slate-100 text-slate-600 font-medium" },
};

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const DAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

export default function IsPlaniPage() {
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayStr, setTodayStr] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // İstatistikler
  const [stats, setStats] = useState({
    totalPending: 0,
    overdueCount: 0,
    todayCount: 0,
    upcomingCount: 0,
    completedCount: 0,
    totalCount: 0,
  });

  // Görünüm Modu: "LIST" (Ajanda Listesi) veya "CALENDAR" (Ay Takvimi)
  const [viewMode, setViewMode] = useState<"LIST" | "CALENDAR">("LIST");

  // Filtreler
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // ALL, TODAY, OVERDUE, UPCOMING, COMPLETED
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCompletedInList, setShowCompletedInList] = useState(true);

  // Takvim Tarih Seçimi
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth()); // 0-11

  // Modal Durumları
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");
  const [selectedTask, setSelectedTask] = useState<WorkTask | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDueDate, setFormDueDate] = useState(todayStr);
  const [formDueTime, setFormDueTime] = useState("");
  const [formCategory, setFormCategory] = useState("GENEL");
  const [formPriority, setFormPriority] = useState("NORMAL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verileri Çek
  const fetchTasks = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/gorevler");
      if (!res.ok) throw new Error("Görevler yüklenemedi");
      const data = await res.json();
      setTasks(data.tasks || []);
      if (data.todayStr) setTodayStr(data.todayStr);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Modal Açılışları
  const openAddModal = (datePrefill?: string) => {
    setModalMode("ADD");
    setSelectedTask(null);
    setFormTitle("");
    setFormDescription("");
    setFormDueDate(datePrefill || todayStr);
    setFormDueTime("");
    setFormCategory("GENEL");
    setFormPriority("NORMAL");
    setIsModalOpen(true);
  };

  const openEditModal = (task: WorkTask) => {
    setModalMode("EDIT");
    setSelectedTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || "");
    setFormDueDate(task.dueDate);
    setFormDueTime(task.dueTime || "");
    setFormCategory(task.category || "GENEL");
    setFormPriority(task.priority || "NORMAL");
    setIsModalOpen(true);
  };

  // Form Gönder
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDueDate.trim()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        dueDate: formDueDate.trim(),
        dueTime: formDueTime.trim() || null,
        category: formCategory,
        priority: formPriority,
      };

      if (modalMode === "ADD") {
        const res = await fetch("/api/gorevler", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Kaydedilemedi");
      } else if (modalMode === "EDIT" && selectedTask) {
        const res = await fetch(`/api/gorevler/${selectedTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Güncellenemedi");
      }

      setIsModalOpen(false);
      await fetchTasks();
    } catch (err: any) {
      alert("Hata oluştu: " + (err.message || ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tek Tıkla Yapıldı / Bekliyor Değiştir
  const handleToggleStatus = async (task: WorkTask) => {
    const isCompleted = task.status === "TAMAMLANDI";
    const nextStatus = isCompleted ? "BEKLIYOR" : "TAMAMLANDI";

    // Optimistik güncelleme
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: nextStatus,
              completedAt: nextStatus === "TAMAMLANDI" ? new Date().toISOString() : null,
            }
          : t
      )
    );

    try {
      const res = await fetch(`/api/gorevler/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Durum değiştirilemedi");
      fetchTasks();
    } catch (err) {
      console.error(err);
      fetchTasks(); // Hata olursa geri al
    }
  };

  // Görev Sil
  const handleDeleteTask = async (id: string, title: string) => {
    if (!confirm(`"${title}" görevini silmek istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/gorevler/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silinemedi");
      setTasks((prev) => prev.filter((t) => t.id !== id));
      fetchTasks();
    } catch (err: any) {
      alert("Silinirken hata oluştu: " + err.message);
    }
  };

  // Filtrelenmiş Görevler
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Durum Filtresi
      if (statusFilter === "TODAY") {
        if (t.status !== "BEKLIYOR" || t.dueDate !== todayStr) return false;
      } else if (statusFilter === "OVERDUE") {
        if (t.status !== "BEKLIYOR" || t.dueDate >= todayStr) return false;
      } else if (statusFilter === "UPCOMING") {
        if (t.status !== "BEKLIYOR" || t.dueDate <= todayStr) return false;
      } else if (statusFilter === "COMPLETED") {
        if (t.status !== "TAMAMLANDI") return false;
      }

      // Kategori Filtresi
      if (categoryFilter !== "ALL" && t.category !== categoryFilter) return false;

      // Öncelik Filtresi
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;

      // Arama
      if (searchTerm.trim() !== "") {
        const q = searchTerm.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });
  }, [tasks, statusFilter, categoryFilter, priorityFilter, searchTerm, todayStr]);

  // Ajanda Listesi için Gruplamalar
  const overdueTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === "BEKLIYOR" && t.dueDate < todayStr),
    [filteredTasks, todayStr]
  );

  const todayTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === "BEKLIYOR" && t.dueDate === todayStr),
    [filteredTasks, todayStr]
  );

  const upcomingTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === "BEKLIYOR" && t.dueDate > todayStr),
    [filteredTasks, todayStr]
  );

  const completedTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === "TAMAMLANDI"),
    [filteredTasks]
  );

  // Takvim Ayı Bilgileri
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);

    // Pazartesi = 0, Pazar = 6 (Pazartesi başlangıçlı)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysCount = lastDay.getDate();

    const daysArray: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Önceki ayın günleri
    const prevMonthLastDay = new Date(calendarYear, calendarMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(calendarYear, calendarMonth - 1, d);
      const dateStr = prevDate.toISOString().slice(0, 10);
      daysArray.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Bu ayın günleri
    for (let d = 1; d <= daysCount; d++) {
      const curDate = new Date(calendarYear, calendarMonth, d);
      const y = curDate.getFullYear();
      const m = String(curDate.getMonth() + 1).padStart(2, "0");
      const day = String(d).padStart(2, "0");
      const dateStr = `${y}-${m}-${day}`;
      daysArray.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Kalan kareleri doldur (42 hücreye tamamla)
    const remaining = 42 - daysArray.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(calendarYear, calendarMonth + 1, d);
      const dateStr = nextDate.toISOString().slice(0, 10);
      daysArray.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return daysArray;
  }, [calendarYear, calendarMonth, todayStr]);

  // Takvim için gün bazında görev haritası
  const tasksByDate = useMemo(() => {
    const map: Record<string, WorkTask[]> = {};
    tasks.forEach((t) => {
      if (!map[t.dueDate]) map[t.dueDate] = [];
      map[t.dueDate].push(t);
    });
    return map;
  }, [tasks]);

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    setCalendarYear(now.getFullYear());
    setCalendarMonth(now.getMonth());
  };

  // Tarih Formatlayıcı
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    const dayName = DAY_NAMES[date.getDay() === 0 ? 6 : date.getDay() - 1];
    const monthName = MONTH_NAMES[Number(m) - 1];
    return `${Number(d)} ${monthName} ${y}, ${dayName}`;
  };

  // Görev Kartı Bileşeni
  const renderTaskCard = (task: WorkTask) => {
    const isCompleted = task.status === "TAMAMLANDI";
    const isOverdue = !isCompleted && task.dueDate < todayStr;
    const isToday = !isCompleted && task.dueDate === todayStr;

    const catMeta = CATEGORIES[task.category] || CATEGORIES.GENEL;
    const priorityMeta = PRIORITIES[task.priority] || PRIORITIES.NORMAL;
    const CatIcon = catMeta.icon;

    return (
      <div
        key={task.id}
        className={`group relative rounded-2xl border transition-all duration-200 bg-white p-4 shadow-sm hover:shadow-md ${
          isCompleted
            ? "border-emerald-200 bg-emerald-50/30 opacity-80"
            : isOverdue
            ? "border-red-300 bg-red-50/20 ring-1 ring-red-200"
            : isToday
            ? "border-amber-300 bg-amber-50/20 ring-1 ring-amber-200"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <div className="flex items-start gap-3.5">
          {/* Checkbox (Tek Tıkla Bitir / Geri Al) */}
          <button
            onClick={() => handleToggleStatus(task)}
            title={isCompleted ? "Geri Al (Yapılmadı yap)" : "Görevi Tamamla (Yapıldı)"}
            className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
              isCompleted
                ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                : isOverdue
                ? "border-red-400 hover:border-red-600 hover:bg-red-50"
                : isToday
                ? "border-amber-500 hover:border-amber-600 hover:bg-amber-50"
                : "border-slate-300 hover:border-teal-600 hover:bg-teal-50"
            }`}
          >
            {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
          </button>

          {/* Görev Bilgileri */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {/* Kategori Rozeti */}
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${catMeta.badgeBg} ${catMeta.border} ${catMeta.text}`}
              >
                <CatIcon className="w-3 h-3" />
                {catMeta.label}
              </span>

              {/* Öncelik Rozeti */}
              {task.priority === "ACIL" && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-600 text-white animate-pulse">
                  ACİL 🚨
                </span>
              )}

              {/* Tarih & Saat */}
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                  isOverdue
                    ? "text-red-700 font-bold"
                    : isToday
                    ? "text-amber-700 font-bold"
                    : "text-slate-500"
                }`}
              >
                <CalendarIcon className="w-3 h-3" />
                {isToday ? "Bugün" : isOverdue ? `${task.dueDate} (Gecikti)` : task.dueDate}
                {task.dueTime && (
                  <span className="inline-flex items-center gap-0.5 ml-1 text-slate-600 font-semibold">
                    <Clock className="w-3 h-3" />
                    {task.dueTime}
                  </span>
                )}
              </span>

              {isCompleted && task.completedAt && (
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded">
                  ✓ {new Date(task.completedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}'de Yapıldı
                </span>
              )}
            </div>

            {/* Başlık */}
            <h4
              className={`text-sm font-bold leading-snug break-words ${
                isCompleted
                  ? "line-through text-slate-400"
                  : isOverdue
                  ? "text-slate-900 font-black"
                  : "text-slate-900"
              }`}
            >
              {task.title}
            </h4>

            {/* Açıklama / Notlar */}
            {task.description && (
              <p
                className={`mt-1 text-xs whitespace-pre-wrap leading-relaxed ${
                  isCompleted ? "text-slate-400 line-through" : "text-slate-600 font-medium"
                }`}
              >
                {task.description}
              </p>
            )}
          </div>

          {/* İşlem Butonları */}
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => openEditModal(task)}
              title="Düzenle"
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteTask(task.id, task.title)}
              title="Sil"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 md:p-6 lg:p-8 space-y-6">
      {/* Üst Başlık & Eylemler */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-700 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-700/20">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              İş Planı & Okul Ajandası
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              Günlük yapılacak işler, banka işlemleri, resmi evrak takibi ve takvim planlaması
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Görünüm Değiştirici: Liste / Takvim */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode("LIST")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === "LIST"
                  ? "bg-white text-teal-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ListTodo className="w-4 h-4" />
              Ajanda & Liste
            </button>
            <button
              onClick={() => setViewMode("CALENDAR")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === "CALENDAR"
                  ? "bg-white text-teal-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Ay Takvimi
            </button>
          </div>

          <button
            onClick={fetchTasks}
            disabled={refreshing}
            title="Yenile"
            className="p-2.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-2xl border border-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-teal-600" : ""}`} />
          </button>

          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-2xl text-xs md:text-sm font-extrabold shadow-sm hover:shadow-teal-900/20 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Yeni Görev / İş Ekle
          </button>
        </div>
      </div>

      {/* KPI İstatistik Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Gecikenler */}
        <div
          onClick={() => setStatusFilter(statusFilter === "OVERDUE" ? "ALL" : "OVERDUE")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all bg-white shadow-sm hover:shadow-md ${
            statusFilter === "OVERDUE" ? "ring-2 ring-red-500 border-red-500" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Geciken / Yapılmayan</span>
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-600">{stats.overdueCount}</span>
            <span className="text-xs text-slate-400 font-semibold">iş acil bekliyor</span>
          </div>
        </div>

        {/* Bugün Yapılacaklar */}
        <div
          onClick={() => setStatusFilter(statusFilter === "TODAY" ? "ALL" : "TODAY")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all bg-white shadow-sm hover:shadow-md ${
            statusFilter === "TODAY" ? "ring-2 ring-amber-500 border-amber-500" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Bugün Yapılacaklar</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{stats.todayCount}</span>
            <span className="text-xs text-slate-400 font-semibold">görev sırada</span>
          </div>
        </div>

        {/* Yaklaşanlar */}
        <div
          onClick={() => setStatusFilter(statusFilter === "UPCOMING" ? "ALL" : "UPCOMING")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all bg-white shadow-sm hover:shadow-md ${
            statusFilter === "UPCOMING" ? "ring-2 ring-blue-500 border-blue-500" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Yaklaşan / Gelecek Planlar</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600">{stats.upcomingCount}</span>
            <span className="text-xs text-slate-400 font-semibold">ileri tarihli</span>
          </div>
        </div>

        {/* Tamamlananlar */}
        <div
          onClick={() => setStatusFilter(statusFilter === "COMPLETED" ? "ALL" : "COMPLETED")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all bg-white shadow-sm hover:shadow-md ${
            statusFilter === "COMPLETED" ? "ring-2 ring-emerald-500 border-emerald-500" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tamamlanan İşler</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{stats.completedCount}</span>
            <span className="text-xs text-slate-400 font-semibold">arşivlendi</span>
          </div>
        </div>
      </div>

      {/* Arama & Kategori Filtre Çubuğu */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Arama */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Görev adı veya notlarda ara (örn: Garanti para çekme, MEB)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Durum Hızlı Butonları */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "ALL", label: "Tümü" },
              { id: "TODAY", label: "Bugün" },
              { id: "OVERDUE", label: "Gecikenler" },
              { id: "UPCOMING", label: "Gelecek" },
              { id: "COMPLETED", label: "Tamamlananlar" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Kategori Hapları */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              categoryFilter === "ALL"
                ? "bg-teal-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tüm Kategoriler
          </button>
          {Object.entries(CATEGORIES).map(([key, cat]) => {
            const Icon = cat.icon;
            const isSelected = categoryFilter === key;
            return (
              <button
                key={key}
                onClick={() => setCategoryFilter(isSelected ? "ALL" : key)}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                  isSelected
                    ? `${cat.badgeBg} ${cat.border} ${cat.text} ring-2 ring-teal-600 font-bold`
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-3 h-3" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GÖRÜNÜM 1: AJANDA & LİSTE (To-Do & Timeline) */}
      {/* ========================================================================= */}
      {viewMode === "LIST" && (
        <div className="space-y-6">
          {/* 1. GECİKEN İŞLER BÖLÜMÜ (Varsa Kırmızı Vurgulu) */}
          {overdueTasks.length > 0 && (
            <div className="bg-red-50/40 border border-red-200 rounded-3xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                  <h3 className="text-base font-black text-red-900 tracking-tight">
                    🔴 Geciken / Yapılmayan İşler ({overdueTasks.length})
                  </h3>
                </div>
                <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
                  Acil İnceleme Bekliyor
                </span>
              </div>
              <p className="text-xs text-red-700/80">
                Tarihi geçmiş ancak henüz tamamlanmadı olarak işaretlenmemiş görevler:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {overdueTasks.map(renderTaskCard)}
              </div>
            </div>
          )}

          {/* 2. BUGÜN YAPILACAKLAR BÖLÜMÜ */}
          <div className="bg-white border border-amber-200 rounded-3xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  ⚡
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Bugün Yapılacaklar ({todayTasks.length})
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {formatDateDisplay(todayStr)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => openAddModal(todayStr)}
                className="text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Bugüne İş Ekle
              </button>
            </div>

            {todayTasks.length === 0 ? (
              <div className="text-center py-8 bg-amber-50/30 rounded-2xl border border-dashed border-amber-200">
                <CheckCircle2 className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-bold text-amber-900">
                  Bugün için planlanmış bekleyen iş bulunmuyor.
                </p>
                <p className="text-[11px] text-amber-700/70 mt-0.5">
                  Harika! Yukarıdaki butondan bugüne yeni bir görev ekleyebilirsiniz.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {todayTasks.map(renderTaskCard)}
              </div>
            )}
          </div>

          {/* 3. YAKLAŞAN / GELECEK İŞLER BÖLÜMÜ */}
          {upcomingTasks.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    🗓️ Yaklaşan & Gelecek Planlar ({upcomingTasks.length})
                  </h3>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {upcomingTasks.map(renderTaskCard)}
              </div>
            </div>
          )}

          {/* 4. TAMAMLANANLAR (Arşiv) */}
          {completedTasks.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    ✅ Tamamlanan İşler ({completedTasks.length})
                  </h3>
                </div>
                <button
                  onClick={() => setShowCompletedInList(!showCompletedInList)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5"
                >
                  {showCompletedInList ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Gizle
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Göster
                    </>
                  )}
                </button>
              </div>

              {showCompletedInList && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {completedTasks.map(renderTaskCard)}
                </div>
              )}
            </div>
          )}

          {/* Hiçbir görev yoksa boş durum */}
          {filteredTasks.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ListTodo className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-800">
                Seçilen filtrelere uygun görev bulunamadı
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Filtreleri temizleyebilir veya hemen yeni bir iş planı ekleyebilirsiniz.
              </p>
              <button
                onClick={() => openAddModal()}
                className="mt-4 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Yeni Görev Ekle
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* GÖRÜNÜM 2: AY TAKVİMİ (Interactive Calendar Grid) */}
      {/* ========================================================================= */}
      {viewMode === "CALENDAR" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 md:p-6 space-y-4">
          {/* Takvim Başlığı & Gezinme */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <h2 className="text-lg md:text-xl font-black text-slate-900">
                {MONTH_NAMES[calendarMonth]} {calendarYear}
              </h2>
              <button
                onClick={handleGoToday}
                className="px-2.5 py-1 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors"
              >
                Bugün
              </button>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                onClick={handlePrevMonth}
                title="Önceki Ay"
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                title="Sonraki Ay"
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Haftanın Günleri Başlığı */}
          <div className="grid grid-cols-7 gap-1 md:gap-2 text-center">
            {DAY_NAMES.map((name, idx) => (
              <div
                key={name}
                className={`py-2 text-[11px] md:text-xs font-black uppercase tracking-wider ${
                  idx >= 5 ? "text-rose-600" : "text-slate-500"
                }`}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Takvim Gün Kareleri */}
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {calendarDays.map((cd, index) => {
              const dayTasks = tasksByDate[cd.dateStr] || [];
              const pendingCount = dayTasks.filter((t) => t.status === "BEKLIYOR").length;
              const hasOverdue = dayTasks.some((t) => t.status === "BEKLIYOR" && t.dueDate < todayStr);

              return (
                <div
                  key={index}
                  className={`group relative min-h-[90px] md:min-h-[115px] p-1.5 md:p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                    cd.isToday
                      ? "border-amber-400 bg-amber-50/30 ring-2 ring-amber-300 shadow-sm"
                      : cd.isCurrentMonth
                      ? "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      : "border-slate-100 bg-slate-50/40 opacity-40"
                  }`}
                >
                  {/* Gün Numarası ve Ekle Butonu */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs md:text-sm font-black w-6 h-6 flex items-center justify-center rounded-lg ${
                        cd.isToday
                          ? "bg-amber-500 text-white shadow-xs"
                          : hasOverdue
                          ? "text-red-600 font-extrabold"
                          : cd.isCurrentMonth
                          ? "text-slate-800"
                          : "text-slate-400"
                      }`}
                    >
                      {cd.dayNumber}
                    </span>

                    {/* Gün üzerine hızlı ekleme butonu */}
                    <button
                      onClick={() => openAddModal(cd.dateStr)}
                      title={`${cd.dateStr} tarihine görev ekle`}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-teal-700 hover:bg-white rounded-md transition-all shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>

                  {/* Günün Görevleri (Mini Rozetler) */}
                  <div className="space-y-1 my-1 flex-1 overflow-y-auto max-h-[75px] no-scrollbar">
                    {dayTasks.slice(0, 3).map((t) => {
                      const isDone = t.status === "TAMAMLANDI";
                      const cat = CATEGORIES[t.category] || CATEGORIES.GENEL;
                      return (
                        <div
                          key={t.id}
                          onClick={() => openEditModal(t)}
                          title={`${t.title} (${isDone ? "Tamamlandı" : "Bekliyor"})`}
                          className={`cursor-pointer px-1.5 py-0.5 rounded text-[10px] truncate font-bold border transition-all flex items-center gap-1 ${
                            isDone
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 line-through opacity-70"
                              : t.priority === "ACIL"
                              ? "bg-red-500 text-white border-red-600"
                              : `${cat.badgeBg} ${cat.border} ${cat.text}`
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              isDone ? "bg-emerald-600" : t.priority === "ACIL" ? "bg-white" : "bg-teal-600"
                            }`}
                          />
                          <span className="truncate">{t.title}</span>
                        </div>
                      );
                    })}

                    {dayTasks.length > 3 && (
                      <span className="block text-[10px] font-bold text-slate-500 text-center">
                        +{dayTasks.length - 3} daha
                      </span>
                    )}
                  </div>

                  {/* Alt Durum Çizgisi */}
                  {pendingCount > 0 && (
                    <div className="text-[10px] font-semibold text-slate-500 flex items-center justify-between pt-0.5 border-t border-slate-100">
                      <span className="text-[9px] text-slate-400">Bekleyen:</span>
                      <span
                        className={`text-[10px] font-bold ${
                          hasOverdue ? "text-red-600" : "text-amber-700"
                        }`}
                      >
                        {pendingCount}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: YENİ GÖREV EKLE / DÜZENLE */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-gradient-to-r from-teal-800 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CalendarCheck className="w-5 h-5 text-teal-300" />
                <h3 className="font-extrabold text-base">
                  {modalMode === "ADD" ? "Yeni İş / Görev Ekle" : "Görevi Düzenle"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-teal-700/60 transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {/* İş Başlığı */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  İş Başlığı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Garanti Bankasından Para Çekilecek, SGK Bildirimi"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              {/* Tarih ve Saat */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Planlanan Tarih *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Saat (Opsiyonel)
                  </label>
                  <input
                    type="time"
                    value={formDueTime}
                    onChange={(e) => setFormDueTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
              </div>

              {/* Kategori ve Öncelik */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori / Tür
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  >
                    {Object.entries(CATEGORIES).map(([key, cat]) => (
                      <option key={key} value={key}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Öncelik Derecesi
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="ACIL">🔴 Çok Acil</option>
                    <option value="DUSUK">Düşük</option>
                  </select>
                </div>
              </div>

              {/* Açıklama / Notlar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Açıklama / Detaylı Notlar
                </label>
                <textarea
                  rows={3}
                  placeholder="Örn: Kasaya 50.000 TL nakit konulacak, dekontu muhasebeye teslim edilecek..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              {/* Butonlar */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-black shadow-md transition-all"
                >
                  {isSubmitting
                    ? "Kaydediliyor..."
                    : modalMode === "ADD"
                    ? "Görevi Ekle"
                    : "Güncelle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
