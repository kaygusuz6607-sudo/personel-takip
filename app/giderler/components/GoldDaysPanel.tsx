"use client";

import { useState, useEffect } from "react";
import {
  Coins,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  DollarSign,
  Sparkles,
  Users,
  Check,
  X,
  ChevronRight,
  Landmark,
  BellRing,
  RotateCcw,
  Wand2,
  Save,
  FileSpreadsheet,
} from "lucide-react";

export interface GoldDayRound {
  id: string;
  groupId: string;
  roundIndex: number;
  dueDate: string;
  dueDateStr: string | null;
  year: number;
  month: number;
  recipientName: string;
  isUserTurn: boolean;
  goldAmount: number;
  payingMembersCount: number;
  perMemberAmount: number;
  userShareCount: number;
  userAmountToPay: number;
  isPaid: boolean;
  paidDate: string | null;
  paidAmount: number;
  notes: string | null;
  expenseId: string | null;
}

export interface GoldDayGroup {
  id: string;
  title: string;
  goldType: string;
  goldTypeLabel: string | null;
  totalMembers: number;
  userShareCount: number;
  defaultAmount: number;
  meetingFrequency?: string | null;
  daysList?: string | null;
  dayOfMonth: number | null;
  startYear: number;
  startMonth: number;
  notes: string | null;
  status: string;
  rounds: GoldDayRound[];
}

function getSchedulePreview(
  daysStr: string,
  startYear: number,
  startMonth: number,
  totalMembers: number = 26
): { round: number; dateStr: string }[] {
  const parts = (daysStr || "")
    .split(/[,;\s]+/)
    .map((p) => parseInt(p.trim(), 10))
    .filter((d) => !isNaN(d) && d >= 1 && d <= 31);
  const days = parts.length > 0 ? Array.from(new Set(parts)).sort((a, b) => a - b) : [1, 10, 20];
  const K = Math.max(1, days.length);
  const previewCount = Math.min(6, totalMembers);
  const result: { round: number; dateStr: string }[] = [];

  for (let i = 0; i < previewCount; i++) {
    const monthOffset = Math.floor(i / K);
    const dayIndex = i % K;
    const targetMonthOffset = startMonth - 1 + monthOffset;
    const rYear = startYear + Math.floor(targetMonthOffset / 12);
    const rMonth = (targetMonthOffset % 12) + 1;
    const targetDay = days[dayIndex];
    const lastDay = new Date(rYear, rMonth, 0).getDate();
    const safeDay = Math.min(targetDay, lastDay);
    const padDay = String(safeDay).padStart(2, "0");
    const padMonth = String(rMonth).padStart(2, "0");

    result.push({
      round: i + 1,
      dateStr: `${padDay}.${padMonth}.${rYear}`,
    });
  }
  return result;
}

const isUserTurnName = (name: string): boolean => {
  const n = (name || "").toLowerCase().trim();
  return (
    n.includes("muhammed") ||
    n.includes("muhammet") ||
    n.includes("maç") ||
    n.includes("mac")
  );
};

function buildInitialManualRounds(
  totalMembers: number,
  startYear: number,
  startMonth: number,
  daysList: string,
  defaultAmount: number,
  membersText: string = "",
  goldType: string = "AJDA_BILEZIK"
): Array<{
  roundIndex: number;
  dueDate: string;
  recipientName: string;
  isUserTurn: boolean;
  goldAmount: number;
  notes: string;
}> {
  const parts = (daysList || "")
    .split(/[,;\s]+/)
    .map((p) => parseInt(p.trim(), 10))
    .filter((d) => !isNaN(d) && d >= 1 && d <= 31);
  const days = parts.length > 0 ? Array.from(new Set(parts)).sort((a, b) => a - b) : [1, 10, 20];
  const K = Math.max(1, days.length);

  const rawNames = (membersText || "")
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const isAjda = goldType === "AJDA_BILEZIK";
  const payingMembers = Math.max(1, totalMembers - 1);
  const roundGoldPool = isAjda ? defaultAmount : defaultAmount * payingMembers;

  const list: Array<{
    roundIndex: number;
    dueDate: string;
    recipientName: string;
    isUserTurn: boolean;
    goldAmount: number;
    notes: string;
  }> = [];

  for (let i = 0; i < totalMembers; i++) {
    const roundIndex = i + 1;
    const monthOffset = Math.floor(i / K);
    const dayIndex = i % K;
    const targetMonthOffset = startMonth - 1 + monthOffset;
    const rYear = startYear + Math.floor(targetMonthOffset / 12);
    const rMonth = (targetMonthOffset % 12) + 1;
    const targetDay = days[dayIndex];
    const lastDay = new Date(rYear, rMonth, 0).getDate();
    const safeDay = Math.min(targetDay, lastDay);

    const padMonth = String(rMonth).padStart(2, "0");
    const padDay = String(safeDay).padStart(2, "0");
    const isoDate = `${rYear}-${padMonth}-${padDay}`;

    const recipientName = rawNames[i] || `Katılımcı ${roundIndex}`;
    const isUserTurn = isUserTurnName(recipientName);

    list.push({
      roundIndex,
      dueDate: isoDate,
      recipientName,
      isUserTurn,
      goldAmount: roundGoldPool,
      notes: "",
    });
  }

  return list;
}

function applyDaysToRounds<T extends { dueDate: string }>(
  daysStr: string,
  sYear: number,
  sMonth: number,
  rounds: T[]
): T[] {
  const parts = (daysStr || "")
    .split(/[,;\s]+/)
    .map((p) => parseInt(p.trim(), 10))
    .filter((d) => !isNaN(d) && d >= 1 && d <= 31);
  const days = parts.length > 0 ? Array.from(new Set(parts)).sort((a, b) => a - b) : [1, 10, 20];
  const K = Math.max(1, days.length);

  return rounds.map((r, i) => {
    const monthOffset = Math.floor(i / K);
    const dayIndex = i % K;
    const targetMonthOffset = sMonth - 1 + monthOffset;
    const rYear = sYear + Math.floor(targetMonthOffset / 12);
    const rMonth = (targetMonthOffset % 12) + 1;
    const targetDay = days[dayIndex];
    const lastDay = new Date(rYear, rMonth, 0).getDate();
    const safeDay = Math.min(targetDay, lastDay);
    const padMonth = String(rMonth).padStart(2, "0");
    const padDay = String(safeDay).padStart(2, "0");
    return {
      ...r,
      dueDate: `${rYear}-${padMonth}-${padDay}`,
    };
  });
}

const GOLD_TYPE_OPTIONS = [
  { value: "AJDA_BILEZIK", label: "💍 Ajda Bilezik", defaultPrice: 63150 },
  { value: "CEYREK_ALTIN", label: "🪙 Çeyrek Altın", defaultPrice: 11250 },
  { value: "YARIM_ALTIN", label: "🥇 Yarım Altın", defaultPrice: 22500 },
  { value: "TAM_ALTIN", label: "🏅 Tam Altın", defaultPrice: 43100 },
  { value: "CUMHURIYET_ALTIN", label: "🇹🇷 Cumhuriyet Altını", defaultPrice: 43100 },
  { value: "ATA_ALTIN", label: "🎖️ Ata Altın", defaultPrice: 43500 },
  { value: "GRAM_ALTIN", label: "🥈 Gram Altın", defaultPrice: 3100 },
  { value: "CASH", label: "💵 Nakit / Serbest Tutar", defaultPrice: 50000 },
];

export default function GoldDaysPanel({
  onRefreshMainExpenses,
  onNavigateToMonthExpense,
}: {
  onRefreshMainExpenses?: () => void;
  onNavigateToMonthExpense?: (yearMonth: string) => void;
}) {
  const [groups, setGroups] = useState<GoldDayGroup[]>([]);
  const [todayRounds, setTodayRounds] = useState<any[]>([]);
  const [upcomingRounds, setUpcomingRounds] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalCommitment: 0,
    totalPaid: 0,
    totalRemaining: 0,
    totalUserTurnAmount: 0,
  });
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Yeni Grup Modalı
  const [newGroupModalOpen, setNewGroupModalOpen] = useState(false);
  const [groupSubmitting, setGroupSubmitting] = useState(false);
  const [groupForm, setGroupForm] = useState({
    title: "",
    goldType: "AJDA_BILEZIK",
    goldTypeLabel: "Ajda Bilezik",
    totalMembers: 26,
    userShareCount: 5,
    defaultAmount: 63150,
    meetingFrequency: "THRICE_MONTHLY",
    daysList: "1, 10, 20",
    dayOfMonth: 1,
    startYear: 2026,
    startMonth: 10,
    notes: "",
    membersText: "",
  });

  // Tarihleri / Günleri Yeniden Dağıt Modalı (Mevcut Grup İçin)
  const [redistributeModalOpen, setRedistributeModalOpen] = useState(false);
  const [redistributeDays, setRedistributeDays] = useState("1, 10, 20");
  const [redistributeFreq, setRedistributeFreq] = useState("THRICE_MONTHLY");
  const [redistributeYear, setRedistributeYear] = useState(2026);
  const [redistributeMonth, setRedistributeMonth] = useState(10);
  const [redistributeSubmitting, setRedistributeSubmitting] = useState(false);
  const [redistributeRounds, setRedistributeRounds] = useState<
    Array<{
      id: string;
      roundIndex: number;
      dueDate: string;
      recipientName: string;
      isUserTurn: boolean;
      goldAmount: number;
      notes: string;
    }>
  >([]);
  const [redistributeManualOpen, setRedistributeManualOpen] = useState(false);

  // Toplu Manuel Taksit Planı Düzenleme Modalı (Mevcut Grup İçin)
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [bulkRounds, setBulkRounds] = useState<
    Array<{
      id: string;
      roundIndex: number;
      dueDate: string;
      recipientName: string;
      isUserTurn: boolean;
      goldAmount: number;
      notes: string;
    }>
  >([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkGlobalAmount, setBulkGlobalAmount] = useState<number>(63150);
  const [quickUpdatingDateId, setQuickUpdatingDateId] = useState<string | null>(null);

  // Yeni Grup Modalı İçin Manuel Taksit Planı Düzenleme
  const [enableManualSchedule, setEnableManualSchedule] = useState(false);
  const [manualScheduleRounds, setManualScheduleRounds] = useState<
    Array<{
      roundIndex: number;
      dueDate: string;
      recipientName: string;
      isUserTurn: boolean;
      goldAmount: number;
      notes: string;
    }>
  >([]);

  const openRedistributeModal = (group: GoldDayGroup) => {
    const dList = group.daysList || "1, 10, 20";
    setRedistributeDays(dList);
    const isStandard = ["1, 10, 20", "1, 15", "10"].includes(dList.trim());
    const freq =
      group.meetingFrequency ||
      (isStandard
        ? dList === "1, 10, 20"
          ? "THRICE_MONTHLY"
          : dList === "1, 15"
          ? "TWICE_MONTHLY"
          : "ONCE_MONTHLY"
        : "CUSTOM");
    setRedistributeFreq(freq);
    setRedistributeYear(group.startYear || 2026);
    setRedistributeMonth(group.startMonth || 10);
    const items = group.rounds.map((r) => ({
      id: r.id,
      roundIndex: r.roundIndex,
      dueDate: r.dueDate ? new Date(r.dueDate).toISOString().split("T")[0] : "",
      recipientName: r.recipientName,
      isUserTurn: r.isUserTurn,
      goldAmount: r.goldAmount,
      notes: r.notes || "",
    }));
    setRedistributeRounds(items);
    setRedistributeManualOpen(freq === "CUSTOM" || !isStandard);
    setRedistributeModalOpen(true);
  };

  const handleRedistributeDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    try {
      setRedistributeSubmitting(true);
      if (redistributeFreq === "CUSTOM" || redistributeManualOpen) {
        const res = await fetch("/api/altin-gunleri", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "BULK_UPDATE_ROUNDS",
            groupId: selectedGroup.id,
            rounds: redistributeRounds,
            daysList: redistributeDays,
            meetingFrequency: "CUSTOM",
          }),
        });
        if (res.ok) {
          setRedistributeModalOpen(false);
          await fetchGoldDays();
          if (onRefreshMainExpenses) onRefreshMainExpenses();
        } else {
          alert("Tarihler güncellenirken hata oluştu.");
        }
      } else {
        const res = await fetch("/api/altin-gunleri", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "REDISTRIBUTE_DATES",
            groupId: selectedGroup.id,
            daysList: redistributeDays,
            meetingFrequency: redistributeFreq,
            startYear: redistributeYear,
            startMonth: redistributeMonth,
          }),
        });
        if (res.ok) {
          setRedistributeModalOpen(false);
          await fetchGoldDays();
          if (onRefreshMainExpenses) onRefreshMainExpenses();
        } else {
          alert("Tarihler güncellenirken hata oluştu.");
        }
      }
    } catch {
      alert("Hata oluştu.");
    } finally {
      setRedistributeSubmitting(false);
    }
  };

  // Taksit Planını Manuel Düzenleme (Toplu / Excel Tarzı)
  const openBulkEditModal = (group: GoldDayGroup) => {
    const isAjda = group.goldType === "AJDA_BILEZIK";
    const payingCount = group.totalMembers - 1;
    const items = group.rounds.map((r) => ({
      id: r.id,
      roundIndex: r.roundIndex,
      dueDate: r.dueDate ? new Date(r.dueDate).toISOString().split("T")[0] : "",
      recipientName: r.recipientName,
      isUserTurn: r.isUserTurn,
      goldAmount: !isAjda && r.goldAmount <= group.defaultAmount
        ? group.defaultAmount * payingCount
        : r.goldAmount,
      notes: r.notes || "",
    }));
    setBulkRounds(items);
    setBulkGlobalAmount(!isAjda ? group.defaultAmount * payingCount : group.defaultAmount);
    setBulkEditModalOpen(true);
  };

  const handleBulkFillDates = (
    preset: "THRICE" | "TWICE" | "ONCE" | "EVERY_10_DAYS" | "EVERY_7_DAYS"
  ) => {
    if (!selectedGroup || bulkRounds.length === 0) return;
    const startD = bulkRounds[0].dueDate
      ? new Date(bulkRounds[0].dueDate)
      : new Date(selectedGroup.startYear, selectedGroup.startMonth - 1, 1);
    const sYear = startD.getFullYear();
    const sMonth = startD.getMonth() + 1;

    let days = [1, 10, 20];
    if (preset === "TWICE") days = [1, 15];
    if (preset === "ONCE") days = [10];

    const updated = bulkRounds.map((r, idx) => {
      let dateStr = r.dueDate;
      if (preset === "EVERY_10_DAYS") {
        const d = new Date(startD);
        d.setDate(d.getDate() + idx * 10);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        dateStr = `${y}-${m}-${day}`;
      } else if (preset === "EVERY_7_DAYS") {
        const d = new Date(startD);
        d.setDate(d.getDate() + idx * 7);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        dateStr = `${y}-${m}-${day}`;
      } else {
        const K = days.length;
        const mOffset = Math.floor(idx / K);
        const dayIdx = idx % K;
        const targetMonthOffset = sMonth - 1 + mOffset;
        const rYear = sYear + Math.floor(targetMonthOffset / 12);
        const rMonth = (targetMonthOffset % 12) + 1;
        const targetDay = days[dayIdx];
        const lastDay = new Date(rYear, rMonth, 0).getDate();
        const safeDay = Math.min(targetDay, lastDay);
        const padM = String(rMonth).padStart(2, "0");
        const padD = String(safeDay).padStart(2, "0");
        dateStr = `${rYear}-${padM}-${padD}`;
      }
      return { ...r, dueDate: dateStr };
    });
    setBulkRounds(updated);
  };

  const handleApplyBulkGlobalAmount = () => {
    if (bulkGlobalAmount <= 0) return;
    setBulkRounds((prev) =>
      prev.map((r) => ({
        ...r,
        goldAmount: bulkGlobalAmount,
      }))
    );
  };

  const handleSaveBulkRounds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    try {
      setBulkSubmitting(true);
      const res = await fetch("/api/altin-gunleri", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BULK_UPDATE_ROUNDS",
          groupId: selectedGroup.id,
          rounds: bulkRounds,
        }),
      });

      if (res.ok) {
        setBulkEditModalOpen(false);
        await fetchGoldDays();
        if (onRefreshMainExpenses) onRefreshMainExpenses();
      } else {
        alert("Taksit planı kaydedilirken hata oluştu.");
      }
    } catch {
      alert("Hata oluştu.");
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Tablodan tek tıkla hızlı tarih değiştirme
  const handleQuickDateChange = async (roundId: string, newDateStr: string) => {
    if (!newDateStr) return;
    try {
      setQuickUpdatingDateId(roundId);
      const res = await fetch("/api/altin-gunleri", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_ROUND_DATE",
          roundId,
          dueDate: newDateStr,
        }),
      });

      if (res.ok) {
        await fetchGoldDays();
        if (onRefreshMainExpenses) onRefreshMainExpenses();
      } else {
        alert("Tarih güncellenemedi.");
      }
    } catch (err) {
      console.error("Hızlı tarih güncelleme hatası:", err);
    } finally {
      setQuickUpdatingDateId(null);
    }
  };

  // Tur Düzenle Modalı
  const [editRoundModalOpen, setEditRoundModalOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<GoldDayRound | null>(null);
  const [roundSubmitting, setRoundSubmitting] = useState(false);
  const [roundForm, setRoundForm] = useState({
    recipientName: "",
    goldAmount: 63150,
    dueDate: "",
    notes: "",
  });

  const fetchGoldDays = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/altin-gunleri");
      const data = await res.json();
      if (data?.groups) {
        setGroups(data.groups);
        setTodayRounds(data.todayRounds || []);
        setUpcomingRounds(data.upcomingRounds || []);
        if (data.stats) setStats(data.stats);

        // Seçili grup yoksa ilk grubu seç
        if (!selectedGroupId && data.groups.length > 0) {
          setSelectedGroupId(data.groups[0].id);
        } else if (selectedGroupId && !data.groups.some((g: any) => g.id === selectedGroupId)) {
          setSelectedGroupId(data.groups[0]?.id || null);
        }
      }
    } catch (e) {
      console.error("Altın günleri verisi çekilemedi:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoldDays();
  }, []);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || groups[0] || null;

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.title.trim()) {
      alert("Lütfen grup adı giriniz.");
      return;
    }

    try {
      setGroupSubmitting(true);
      // İsim listesini satır satır veya virgülden ayır
      const memberNames = groupForm.membersText
        ? groupForm.membersText
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const selectedOpt = GOLD_TYPE_OPTIONS.find((o) => o.value === groupForm.goldType);

      const res = await fetch("/api/altin-gunleri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...groupForm,
          goldTypeLabel: selectedOpt ? selectedOpt.label.replace(/^[^\s]+\s/, "") : groupForm.goldType,
          memberNames,
          customRounds: enableManualSchedule && manualScheduleRounds.length > 0 ? manualScheduleRounds : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Grup oluşturulamadı");
        return;
      }

      const created = await res.json();
      setNewGroupModalOpen(false);
      await fetchGoldDays();
      if (created?.id) setSelectedGroupId(created.id);
      if (onRefreshMainExpenses) onRefreshMainExpenses();
    } catch (e) {
      alert("Hata oluştu");
    } finally {
      setGroupSubmitting(false);
    }
  };

  const handleTogglePaid = async (roundId: string, currentPaid: boolean) => {
    try {
      const res = await fetch("/api/altin-gunleri", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_PAID",
          roundId,
          isPaid: !currentPaid,
        }),
      });

      if (res.ok) {
        await fetchGoldDays();
        if (onRefreshMainExpenses) onRefreshMainExpenses();
      }
    } catch (e) {
      alert("Ödeme durumu güncellenemedi");
    }
  };

  const openEditRoundModal = (round: GoldDayRound) => {
    setEditingRound(round);
    setRoundForm({
      recipientName: round.recipientName,
      goldAmount: round.goldAmount,
      dueDate: round.dueDate ? new Date(round.dueDate).toISOString().split("T")[0] : "",
      notes: round.notes || "",
    });
    setEditRoundModalOpen(true);
  };

  const handleSaveRoundEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRound) return;

    try {
      setRoundSubmitting(true);
      const res = await fetch("/api/altin-gunleri", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_ROUND",
          roundId: editingRound.id,
          ...roundForm,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Tur güncellenemedi");
        return;
      }

      setEditRoundModalOpen(false);
      await fetchGoldDays();
      if (onRefreshMainExpenses) onRefreshMainExpenses();
    } catch (e) {
      alert("Hata oluştu");
    } finally {
      setRoundSubmitting(false);
    }
  };

  const handleDeleteGroup = async (group: GoldDayGroup) => {
    if (
      !confirm(
        `"${group.title}" altın günü grubunu ve takvimdeki tüm bağlı nakit gider kayıtlarını silmek istediğinize emin misiniz?`
      )
    )
      return;

    try {
      const res = await fetch(`/api/altin-gunleri?groupId=${group.id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchGoldDays();
        if (onRefreshMainExpenses) onRefreshMainExpenses();
      }
    } catch (e) {
      alert("Silinemedi");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* 1. CANLI UYARI: BUGÜN GÜN VAR! */}
      {todayRounds.length > 0 && (
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-amber-950 shadow-lg border-2 border-amber-300 animate-pulse">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-950 text-amber-300 flex items-center justify-center text-2xl shadow-md shrink-0">
                🔔
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-950 text-amber-200 uppercase tracking-wider">
                    Önemli Hatırlatma
                  </span>
                  <span className="text-xs font-extrabold text-amber-900">
                    BUGÜN ALTIN GÜNÜ VADESİ GELDİ!
                  </span>
                </div>
                <p className="text-base sm:text-lg font-black mt-1 text-slate-950">
                  {todayRounds.map((r, i) => (
                    <span key={r.id}>
                      {i > 0 && " • "}
                      {r.groupTitle}: Sıra <strong>{r.recipientName}</strong> kişisinde (Ödenecek:{" "}
                      <strong>{formatCurrency(r.userAmountToPay)} Nakit</strong>)
                    </span>
                  ))}
                </p>
                <p className="text-xs text-amber-900 font-semibold mt-0.5">
                  Ödeme nakit olarak yapılacaktır. Lütfen kasadan nakit hazırlığını kontrol ediniz.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {todayRounds.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleTogglePaid(r.id, r.isPaid)}
                  className="px-4 py-2.5 bg-amber-950 hover:bg-black text-amber-200 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{r.recipientName} İçin Nakit Ödendi İşaretle</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. YAKLAŞAN GÜNLER BİLDİRİMİ (1-3 Gün Kala) */}
      {todayRounds.length === 0 && upcomingRounds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-amber-600 animate-bounce" />
            <span>
              Yaklaşan Altın Günü:{" "}
              {upcomingRounds.map((r, i) => (
                <span key={r.id}>
                  {i > 0 && ", "}
                  <strong>{r.groupTitle}</strong> ({r.daysLeft} gün kaldı - Sıra:{" "}
                  <strong>{r.recipientName}</strong> - {formatCurrency(r.userAmountToPay)} Nakit)
                </span>
              ))}
            </span>
          </div>
          <span className="text-[11px] bg-amber-200/80 px-2 py-0.5 rounded-full text-amber-950">
            Nakit Hazırlığı Yapınız
          </span>
        </div>
      )}

      {/* 3. ÖZET İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Aktif Altın Grupları
            </span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">{stats.totalGroups} Grup</p>
          <span className="text-[10px] text-slate-400">Ayın 1'i, 10'u, 20'si vb.</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/50 to-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
              Toplam Nakit Taahhüt
            </span>
            <Landmark className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-xl font-black text-amber-900 mt-1">{formatCurrency(stats.totalCommitment)}</p>
          <span className="text-[10px] text-amber-700">Tüm turlarda ödenecek pay</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 to-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
              Ödenen Nakit
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-700 mt-1">{formatCurrency(stats.totalPaid)}</p>
          <span className="text-[10px] text-emerald-700">Kapanan turlar ✓</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200/90 bg-gradient-to-br from-rose-50/50 to-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider block">
              Kalan Nakit Borç
            </span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-black text-rose-700 mt-1">{formatCurrency(stats.totalRemaining)}</p>
          <span className="text-[10px] text-rose-700">Ödenecek kalan turlar</span>
        </div>
      </div>

      {/* 4. GRUP SEÇİCİ & YENİ GRUP BUTONU */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mr-1">
            <Coins className="w-4 h-4 text-amber-600" />
            <span>Altın Grupları:</span>
          </span>

          {groups.length === 0 ? (
            <span className="text-xs text-slate-400">Henüz grup oluşturulmadı.</span>
          ) : (
            groups.map((g) => {
              const isSelected = selectedGroupId === g.id;
              const pendingCount = g.rounds.filter((r) => !r.isPaid).length;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGroupId(g.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                    isSelected
                      ? "bg-amber-600 text-white shadow-sm ring-2 ring-amber-600/20"
                      : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>{g.title}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected ? "bg-amber-700 text-amber-100" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {pendingCount} Bekleyen
                  </span>
                </button>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setGroupForm({
              title: "",
              goldType: "AJDA_BILEZIK",
              goldTypeLabel: "Ajda Bilezik",
              totalMembers: 26,
              userShareCount: 5,
              defaultAmount: 63150,
              meetingFrequency: "THRICE_MONTHLY",
              daysList: "1, 10, 20",
              dayOfMonth: 1,
              startYear: 2026,
              startMonth: 10,
              notes: "",
              membersText: "",
            });
            setNewGroupModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Yeni Altın Günü Grubu Oluştur</span>
        </button>
      </div>

      {/* 5. SEÇİLİ GRUBUN AYRINTILI TAKSİT VE SIRA TABLOSU */}
      {selectedGroup ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 p-5">
          {/* Grup Başlık Kartı */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-900">{selectedGroup.title}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  {selectedGroup.goldTypeLabel || selectedGroup.goldType}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  👥 {selectedGroup.totalMembers} Kişi
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-200">
                  Muhammed Ali: {selectedGroup.userShareCount} Hisse / Kişilik
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-950 border border-amber-300">
                  🗓️ Ödeme Günleri: Her ayın {selectedGroup.daysList || "1, 10, 20"}&apos;si ({selectedGroup.daysList ? selectedGroup.daysList.split(",").length : 3} Kez/Ay)
                </span>
              </div>
              {selectedGroup.goldType === "AJDA_BILEZIK" ? (
                <p className="text-xs text-slate-500 mt-1">
                  1 Ajda Bilezik Bedeli: <strong>{formatCurrency(selectedGroup.defaultAmount)}</strong> • Ödeme Yapan:{" "}
                  <strong>{selectedGroup.totalMembers - 1} Kişi</strong> (Gün sırası olan ödemez) • Kişi Başı Pay:{" "}
                  <strong className="text-amber-800">
                    {formatCurrency(selectedGroup.defaultAmount / (selectedGroup.totalMembers - 1))}
                  </strong>{" "}
                  • Tur Başı Teslim Alınan Toplam:{" "}
                  <strong className="text-slate-900">
                    {formatCurrency(selectedGroup.defaultAmount)} (1 Ajda Bilezik)
                  </strong>{" "}
                  • Ödeme Yöntemi: <strong className="text-emerald-700">NAKİT</strong>
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">
                  1 Adet {selectedGroup.goldTypeLabel || selectedGroup.goldType} Bedeli:{" "}
                  <strong>{formatCurrency(selectedGroup.defaultAmount)}</strong> • Ödeme Yapan:{" "}
                  <strong>{selectedGroup.totalMembers - 1} Kişi</strong> (Gün sırası olan ödemez) • Kişi Başı:{" "}
                  <strong className="text-amber-800">
                    1 Adet ({formatCurrency(selectedGroup.defaultAmount)})
                  </strong>{" "}
                  • Tur Başı Teslim Alınan Toplam:{" "}
                  <strong className="text-slate-900">
                    {formatCurrency(selectedGroup.defaultAmount * (selectedGroup.totalMembers - 1))} (
                    {selectedGroup.totalMembers - 1} Adet {selectedGroup.goldTypeLabel || selectedGroup.goldType})
                  </strong>{" "}
                  • Ödeme Yöntemi: <strong className="text-emerald-700">NAKİT</strong>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => openBulkEditModal(selectedGroup)}
                className="text-xs text-indigo-900 hover:text-indigo-950 font-bold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 transition-colors shadow-2xs"
                title="Tüm turların tarihlerini, isimlerini ve tutarlarını manuel taksit tablosu gibi düzenle"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                <span>✍️ Taksit Planını Manuel Düzenle</span>
              </button>

              <button
                type="button"
                onClick={() => openRedistributeModal(selectedGroup)}
                className="text-xs text-amber-800 hover:text-amber-950 font-bold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors shadow-2xs"
                title="Ayda 3 kez (1, 10, 20) veya farklı günlere göre turları yeniden takvimlendir"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>🗓️ Günleri & Tarihleri Yeniden Dağıt</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteGroup(selectedGroup)}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold inline-flex items-center gap-1 p-2 rounded-lg hover:bg-rose-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Grubu Sil</span>
              </button>
            </div>
          </div>

          {/* Tablo */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Sıra / Ay</th>
                  <th className="py-3 px-3">Vade Tarihi</th>
                  <th className="py-3 px-3">Gün Sırasındaki Kişi</th>
                  <th className="py-3 px-3 text-right">Altın Değeri (TL)</th>
                  <th className="py-3 px-3 text-right">Kişi Başı Pay</th>
                  <th className="py-3 px-3 text-center">Ödenecek Hisse</th>
                  <th className="py-3 px-3 text-right">Muhammed Ali Borcu</th>
                  <th className="py-3 px-3 text-center">Durum</th>
                  <th className="py-3 px-3 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedGroup.rounds.map((r) => {
                  return (
                    <tr
                      key={r.id}
                      className={`transition-colors ${
                        r.isPaid
                          ? "bg-emerald-50/30 hover:bg-emerald-50/50"
                          : r.isUserTurn
                          ? "bg-amber-50/50 hover:bg-amber-50/80 font-semibold"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      {/* Sıra / Ay */}
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-800">
                        {r.roundIndex}. Tur
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {r.year} / {r.month}. Ay
                        </span>
                      </td>

                      {/* Vade Tarihi */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="date"
                            value={r.dueDate ? new Date(r.dueDate).toISOString().split("T")[0] : ""}
                            onChange={(e) => handleQuickDateChange(r.id, e.target.value)}
                            disabled={quickUpdatingDateId === r.id}
                            className={`text-[11px] px-2 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 hover:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer transition-all ${
                              quickUpdatingDateId === r.id ? "opacity-50" : ""
                            }`}
                            title="Tarihi doğrudan değiştirmek için takvimden seçin"
                          />
                          {quickUpdatingDateId === r.id && (
                            <span className="text-[10px] text-amber-600 animate-pulse font-bold">Kaydediliyor...</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                          {r.dueDateStr || new Date(r.dueDate).toLocaleDateString("tr-TR")}
                        </span>
                      </td>

                      {/* Gün Sırasındaki Kişi */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-xs">
                            {r.recipientName}
                          </span>
                          {r.isUserTurn && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-950 border border-amber-300">
                              👑 Sıra Kendisinde ({selectedGroup.userShareCount - 1} Hisse Öder / ₺
                              {r.goldAmount.toLocaleString("tr-TR")} Alır)
                            </span>
                          )}
                        </div>
                        {r.notes && <span className="text-[10px] text-slate-400 block">{r.notes}</span>}
                      </td>

                      {/* Altın Değeri */}
                      <td className="py-3 px-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                        {formatCurrency(r.goldAmount)}
                      </td>

                      {/* Kişi Başı Pay */}
                      <td className="py-3 px-3 text-right font-medium text-slate-600 whitespace-nowrap">
                        {formatCurrency(r.perMemberAmount)}
                        <span className="text-[9px] text-slate-400 block">
                          ({r.payingMembersCount} kişi)
                        </span>
                      </td>

                      {/* Ödenecek Hisse */}
                      <td className="py-3 px-3 text-center whitespace-nowrap font-bold text-slate-700">
                        {r.userShareCount} Hisse
                      </td>

                      {/* Muhammed Ali Borcu */}
                      <td className="py-3 px-3 text-right font-black text-amber-950 whitespace-nowrap text-sm">
                        {formatCurrency(r.userAmountToPay)}
                        <span className="text-[9px] text-emerald-700 block font-bold">Nakit</span>
                      </td>

                      {/* Durum */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {r.isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Ödendi (Nakit)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Nakit Bekliyor
                          </span>
                        )}
                      </td>

                      {/* İşlem */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePaid(r.id, r.isPaid)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                              r.isPaid
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                            }`}
                          >
                            {r.isPaid ? "Geri Al" : "Nakit Öde"}
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditRoundModal(r)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                            title="Turu Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {onNavigateToMonthExpense && (
                            <button
                              type="button"
                              onClick={() => onNavigateToMonthExpense(`${r.year}-${r.month}`)}
                              className="p-1 text-slate-400 hover:text-teal-700 rounded-lg hover:bg-slate-100"
                              title="Bu Ayın Gider Tablosunda Aç"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          Lütfen yukarıdaki butondan ilk altın günü grubunuzu oluşturun.
        </div>
      )}

      {/* 6. YENİ GRUP OLUŞTURMA MODALI */}
      {newGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div
            className={`bg-white rounded-3xl ${
              enableManualSchedule ? "max-w-4xl" : "max-w-xl"
            } w-full my-auto shadow-2xl transition-all overflow-hidden flex flex-col max-h-[92vh]`}
          >
            {/* Sabit Modal Başlığı */}
            <div className="shrink-0 p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Yeni Altın Günü Grubu Oluştur
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNewGroupModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Grup Adı / Tanımı <span className="text-rose-500">*</span>
                  </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ayın 10'u Ajda Bilezik Grubu"
                  value={groupForm.title}
                  onChange={(e) => setGroupForm({ ...groupForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Altın Türü / Cinsi</label>
                  <select
                    value={groupForm.goldType}
                    onChange={(e) => {
                      const sel = GOLD_TYPE_OPTIONS.find((o) => o.value === e.target.value);
                      const newType = e.target.value;
                      const newLabel = sel ? sel.label.replace(/^[^\s]+\s/, "") : e.target.value;
                      const newPrice = sel ? sel.defaultPrice : groupForm.defaultAmount;
                      const isNewAjda = newType === "AJDA_BILEZIK";
                      const paying = Math.max(1, groupForm.totalMembers - 1);
                      const newGoldPool = isNewAjda ? newPrice : newPrice * paying;

                      setGroupForm({
                        ...groupForm,
                        goldType: newType,
                        goldTypeLabel: newLabel,
                        defaultAmount: newPrice,
                      });

                      if (enableManualSchedule || manualScheduleRounds.length > 0) {
                        setManualScheduleRounds((prev) =>
                          prev.map((r) => ({
                            ...r,
                            goldAmount: newGoldPool,
                          }))
                        );
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none"
                  >
                    {GOLD_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {groupForm.goldType === "AJDA_BILEZIK"
                      ? "1 Adet Ajda Bilezik Bedeli (TL)"
                      : `1 Adet ${groupForm.goldTypeLabel || "Altın"} Bedeli (Hisse Başı TL)`}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={groupForm.defaultAmount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      const isAj = groupForm.goldType === "AJDA_BILEZIK";
                      const paying = Math.max(1, groupForm.totalMembers - 1);
                      const newGoldPool = isAj ? val : val * paying;

                      setGroupForm({ ...groupForm, defaultAmount: val });

                      if (enableManualSchedule || manualScheduleRounds.length > 0) {
                        setManualScheduleRounds((prev) =>
                          prev.map((r) => ({
                            ...r,
                            goldAmount: newGoldPool,
                          }))
                        );
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-amber-900 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {groupForm.goldType === "AJDA_BILEZIK"
                      ? "Ödeme yapan katılımcılar bu bilezik tutarını eşit bölüşür."
                      : `Her katılımcı tur başına 1 adet ${groupForm.goldTypeLabel || "altın"} (₺${groupForm.defaultAmount.toLocaleString("tr-TR")}) öder.`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Toplam Kişi</label>
                  <input
                    type="number"
                    min={2}
                    value={groupForm.totalMembers}
                    onChange={(e) =>
                      setGroupForm({ ...groupForm, totalMembers: parseInt(e.target.value) || 26 })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Muhammed Ali</label>
                  <input
                    type="number"
                    min={1}
                    value={groupForm.userShareCount}
                    onChange={(e) =>
                      setGroupForm({ ...groupForm, userShareCount: parseInt(e.target.value) || 1 })
                    }
                    className="w-full p-2.5 bg-teal-50 border border-teal-200 rounded-xl font-bold text-teal-900"
                    title="Muhammed Ali kaç kişilik/hisse girdi?"
                  />
                  <span className="text-[9px] text-teal-700 block mt-0.5">Kaç kişilik girdi?</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Başlangıç Yılı</label>
                  <input
                    type="number"
                    min={2024}
                    max={2035}
                    value={groupForm.startYear}
                    onChange={(e) =>
                      setGroupForm({ ...groupForm, startYear: parseInt(e.target.value) || 2026 })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Başlangıç Ayı</label>
                  <select
                    value={groupForm.startMonth}
                    onChange={(e) =>
                      setGroupForm({ ...groupForm, startMonth: parseInt(e.target.value) || 10 })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>
                        {m}. Ay
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toplanma Sıklığı ve Günler (Ayda 1, 2 veya 3 Kez) */}
              <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="block font-bold text-slate-800 text-xs">
                  🗓️ Toplanma & Ödeme Sıklığı (1 Ayda Kaç Kez?)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setGroupForm({
                        ...groupForm,
                        meetingFrequency: "THRICE_MONTHLY",
                        daysList: "1, 10, 20",
                        dayOfMonth: 1,
                      });
                      if (enableManualSchedule || manualScheduleRounds.length > 0) {
                        setManualScheduleRounds(
                          buildInitialManualRounds(
                            groupForm.totalMembers,
                            groupForm.startYear,
                            groupForm.startMonth,
                            "1, 10, 20",
                            groupForm.defaultAmount,
                            groupForm.membersText,
                            groupForm.goldType
                          )
                        );
                      }
                    }}
                    className={`py-2 px-2 rounded-xl font-bold text-xs text-center border transition-all ${
                      groupForm.meetingFrequency === "THRICE_MONTHLY"
                        ? "bg-amber-600 text-white border-amber-700 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>⚡ Ayda 3 Kez</span>
                    <span className="block text-[10px] opacity-80">1, 10, 20</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGroupForm({
                        ...groupForm,
                        meetingFrequency: "TWICE_MONTHLY",
                        daysList: "1, 15",
                        dayOfMonth: 1,
                      });
                      if (enableManualSchedule || manualScheduleRounds.length > 0) {
                        setManualScheduleRounds(
                          buildInitialManualRounds(
                            groupForm.totalMembers,
                            groupForm.startYear,
                            groupForm.startMonth,
                            "1, 15",
                            groupForm.defaultAmount,
                            groupForm.membersText,
                            groupForm.goldType
                          )
                        );
                      }
                    }}
                    className={`py-2 px-2 rounded-xl font-bold text-xs text-center border transition-all ${
                      groupForm.meetingFrequency === "TWICE_MONTHLY"
                        ? "bg-amber-600 text-white border-amber-700 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>Ayda 2 Kez</span>
                    <span className="block text-[10px] opacity-80">1, 15</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGroupForm({
                        ...groupForm,
                        meetingFrequency: "ONCE_MONTHLY",
                        daysList: "10",
                        dayOfMonth: 10,
                      });
                      if (enableManualSchedule || manualScheduleRounds.length > 0) {
                        setManualScheduleRounds(
                          buildInitialManualRounds(
                            groupForm.totalMembers,
                            groupForm.startYear,
                            groupForm.startMonth,
                            "10",
                            groupForm.defaultAmount,
                            groupForm.membersText,
                            groupForm.goldType
                          )
                        );
                      }
                    }}
                    className={`py-2 px-2 rounded-xl font-bold text-xs text-center border transition-all ${
                      groupForm.meetingFrequency === "ONCE_MONTHLY"
                        ? "bg-amber-600 text-white border-amber-700 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>Ayda 1 Kez</span>
                    <span className="block text-[10px] opacity-80">Her ayın 10&apos;u</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGroupForm({
                        ...groupForm,
                        meetingFrequency: "CUSTOM",
                      });
                      if (!enableManualSchedule || manualScheduleRounds.length === 0) {
                        setManualScheduleRounds(
                          buildInitialManualRounds(
                            groupForm.totalMembers,
                            groupForm.startYear,
                            groupForm.startMonth,
                            groupForm.daysList,
                            groupForm.defaultAmount,
                            groupForm.membersText,
                            groupForm.goldType
                          )
                        );
                        setEnableManualSchedule(true);
                      }
                    }}
                    className={`py-2 px-2 rounded-xl font-bold text-xs text-center border transition-all ${
                      groupForm.meetingFrequency === "CUSTOM"
                        ? "bg-amber-600 text-white border-amber-700 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>Özel Günler</span>
                    <span className="block text-[10px] opacity-80">Serbest Günler</span>
                  </button>
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <span className="font-bold text-slate-700 text-xs shrink-0">Ay İçi Günler:</span>
                  <input
                    type="text"
                    required
                    placeholder="Örn: 1, 10, 20"
                    value={groupForm.daysList}
                    onChange={(e) => {
                      const val = e.target.value;
                      const trimmed = val.replace(/\s+/g, " ").trim();
                      let freq = "CUSTOM";
                      if (trimmed === "1, 10, 20" || trimmed === "1,10,20") {
                        freq = "THRICE_MONTHLY";
                      } else if (trimmed === "1, 15" || trimmed === "1,15") {
                        freq = "TWICE_MONTHLY";
                      } else if (trimmed === "10") {
                        freq = "ONCE_MONTHLY";
                      }
                      setGroupForm({
                        ...groupForm,
                        daysList: val,
                        meetingFrequency: freq,
                        dayOfMonth: parseInt(val.split(/[,;\s]+/)[0]) || 1,
                      });
                        if (enableManualSchedule || manualScheduleRounds.length > 0) {
                          setManualScheduleRounds(
                            buildInitialManualRounds(
                              groupForm.totalMembers,
                              groupForm.startYear,
                              groupForm.startMonth,
                              val,
                              groupForm.defaultAmount,
                              groupForm.membersText,
                              groupForm.goldType
                            )
                          );
                        }
                      }}
                      className="flex-1 p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                    <span className="text-[11px] text-slate-500 shrink-0">
                      (Virgülle ayırarak giriniz)
                    </span>
                  </div>

                  {/* Canlı Takvim Önizlemesi */}
                  <div className="p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-950">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-700" />
                        İlk Turların Tarih Dağılımı Önizlemesi:
                      </span>
                      <span className="text-amber-800 font-extrabold">
                        {groupForm.totalMembers} Tur ~{" "}
                        {Math.ceil(
                          groupForm.totalMembers /
                            Math.max(
                              1,
                              groupForm.daysList
                                .split(/[,;\s]+/)
                                .filter((d) => d && !isNaN(Number(d))).length || 1
                            )
                        )}{" "}
                        Ayda Tamamlanır
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                      {getSchedulePreview(
                        groupForm.daysList,
                        groupForm.startYear,
                        groupForm.startMonth,
                        groupForm.totalMembers
                      ).map((p) => (
                        <div
                          key={p.round}
                          className="bg-white border border-amber-200/80 rounded-lg p-1.5 flex items-center justify-between"
                        >
                          <span className="font-extrabold text-slate-700">{p.round}. Tur:</span>
                          <span className="font-black text-amber-950">{p.dateStr}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Katılımcı Sıra Listesi (İsteğe Bağlı)
                  </label>
                  <textarea
                    rows={3}
                    placeholder={`Her satıra bir isim yazınız:\nFeyza\nAyşe\nMuhammed Ali (1. Hisse)\nBetül...`}
                    value={groupForm.membersText}
                    onChange={(e) => setGroupForm({ ...groupForm, membersText: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-[11px] focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Boş bırakırsanız Katılımcı 1, Katılımcı 2 olarak otomatik açılır.
                  </span>
                </div>

                {/* Taksit Planını Manuel Düzenleme Bölümü (Yeni Grup) */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                        <span>Taksit Planını Manuel & Serbest Olarak Düzenle</span>
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Turların vadelerini, isimlerini veya altın değerlerini taksit tablosu gibi tek tek elle belirleyebilirsiniz.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!enableManualSchedule) {
                          setGroupForm((prev) => ({ ...prev, meetingFrequency: "CUSTOM" }));
                          if (manualScheduleRounds.length === 0) {
                            setManualScheduleRounds(
                              buildInitialManualRounds(
                                groupForm.totalMembers,
                                groupForm.startYear,
                                groupForm.startMonth,
                                groupForm.daysList,
                                groupForm.defaultAmount,
                                groupForm.membersText,
                                groupForm.goldType
                              )
                            );
                          }
                        }
                        setEnableManualSchedule(!enableManualSchedule);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                        enableManualSchedule
                          ? "bg-indigo-600 text-white border-indigo-700"
                          : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                      }`}
                    >
                      {enableManualSchedule ? "Manuel Tabloyu Gizle" : "✍️ Taksitleri Manuel Düzenle"}
                    </button>
                  </div>

                  {enableManualSchedule && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-indigo-50/50 p-2 rounded-xl border border-indigo-100">
                        <span className="text-[11px] font-bold text-indigo-950">
                          ⚡ Hızlı Tarih Dağıtıcı:
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setGroupForm((prev) => ({
                                ...prev,
                                meetingFrequency: "THRICE_MONTHLY",
                                daysList: "1, 10, 20",
                                dayOfMonth: 1,
                              }));
                              const initial = buildInitialManualRounds(
                                groupForm.totalMembers,
                                groupForm.startYear,
                                groupForm.startMonth,
                                "1, 10, 20",
                                groupForm.defaultAmount,
                                groupForm.membersText,
                                groupForm.goldType
                              );
                              setManualScheduleRounds(initial);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                              groupForm.meetingFrequency === "THRICE_MONTHLY"
                                ? "bg-indigo-600 text-white border-indigo-700"
                                : "bg-white hover:bg-indigo-100 border-indigo-200 text-indigo-900"
                            }`}
                          >
                            Ayda 3 Kez (1, 10, 20)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setGroupForm((prev) => ({
                                ...prev,
                                meetingFrequency: "TWICE_MONTHLY",
                                daysList: "1, 15",
                                dayOfMonth: 1,
                              }));
                              const initial = buildInitialManualRounds(
                                groupForm.totalMembers,
                                groupForm.startYear,
                                groupForm.startMonth,
                                "1, 15",
                                groupForm.defaultAmount,
                                groupForm.membersText,
                                groupForm.goldType
                              );
                              setManualScheduleRounds(initial);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                              groupForm.meetingFrequency === "TWICE_MONTHLY"
                                ? "bg-indigo-600 text-white border-indigo-700"
                                : "bg-white hover:bg-indigo-100 border-indigo-200 text-indigo-900"
                            }`}
                          >
                            Ayda 2 Kez (1, 15)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setGroupForm((prev) => ({
                                ...prev,
                                meetingFrequency: "ONCE_MONTHLY",
                                daysList: "10",
                                dayOfMonth: 10,
                              }));
                              const initial = buildInitialManualRounds(
                                groupForm.totalMembers,
                                groupForm.startYear,
                                groupForm.startMonth,
                                "10",
                                groupForm.defaultAmount,
                                groupForm.membersText,
                                groupForm.goldType
                              );
                              setManualScheduleRounds(initial);
                            }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                            groupForm.meetingFrequency === "ONCE_MONTHLY"
                              ? "bg-indigo-600 text-white border-indigo-700"
                              : "bg-white hover:bg-indigo-100 border-indigo-200 text-indigo-900"
                          }`}
                        >
                          Ayda 1 Kez (10&apos;u)
                        </button>
                      </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl bg-white">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 font-bold text-slate-700">
                          <tr>
                            <th className="p-2 w-12 text-center">Tur</th>
                            <th className="p-2 w-32">Vade Tarihi</th>
                            <th className="p-2">Gün Sırasındaki Kişi</th>
                            <th className="p-2 w-28 text-right">Altın Tutarı (₺)</th>
                            <th className="p-2 w-24 text-center">Muhammed</th>
                            <th className="p-2 w-28">Not</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {manualScheduleRounds.map((mr, idx) => (
                            <tr key={idx} className={mr.isUserTurn ? "bg-amber-50/60" : "hover:bg-slate-50"}>
                              <td className="p-2 text-center font-bold text-slate-700">
                                {mr.roundIndex}
                              </td>
                              <td className="p-2">
                                <input
                                  type="date"
                                  value={mr.dueDate}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setGroupForm((prev) => ({ ...prev, meetingFrequency: "CUSTOM" }));
                                    setManualScheduleRounds((prev) =>
                                      prev.map((r, i) => (i === idx ? { ...r, dueDate: val } : r))
                                    );
                                  }}
                                  className="w-full p-1 border border-slate-300 rounded text-xs font-semibold"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={mr.recipientName}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const isUser = isUserTurnName(val);
                                    setGroupForm((prev) => ({ ...prev, meetingFrequency: "CUSTOM" }));
                                    setManualScheduleRounds((prev) =>
                                      prev.map((r, i) =>
                                        i === idx
                                          ? { ...r, recipientName: val, isUserTurn: isUser }
                                          : r
                                      )
                                    );
                                  }}
                                  className="w-full p-1 border border-slate-300 rounded text-xs font-semibold"
                                  placeholder="Katılımcı adı..."
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={mr.goldAmount}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setGroupForm((prev) => ({ ...prev, meetingFrequency: "CUSTOM" }));
                                    setManualScheduleRounds((prev) =>
                                      prev.map((r, i) => (i === idx ? { ...r, goldAmount: val } : r))
                                    );
                                  }}
                                  className="w-full p-1 border border-slate-300 rounded text-xs font-bold text-right text-amber-900"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={mr.isUserTurn}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setManualScheduleRounds((prev) =>
                                        prev.map((r, i) =>
                                          i === idx ? { ...r, isUserTurn: checked } : r
                                        )
                                      );
                                    }}
                                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                                  />
                                  <span className="text-[10px] font-bold text-amber-800">Sıra Onda</span>
                                </label>
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={mr.notes}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setManualScheduleRounds((prev) =>
                                      prev.map((r, i) => (i === idx ? { ...r, notes: val } : r))
                                    );
                                  }}
                                  className="w-full p-1 border border-slate-300 rounded text-xs"
                                  placeholder="Not..."
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              </div>

              {/* Sabit Alt Butonlar */}
              <div className="shrink-0 px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewGroupModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={groupSubmitting}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {groupSubmitting ? "Oluşturuluyor..." : "Grubu ve Taksitleri Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6.5. GÜNLERİ VE TARİHLERİ YENİDEN DAĞIT MODALI (MEVCUT GRUP İÇİN) */}
      {redistributeModalOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div
            className={`bg-white rounded-3xl ${
              redistributeFreq === "CUSTOM" || redistributeManualOpen ? "max-w-4xl" : "max-w-lg"
            } w-full my-auto shadow-2xl transition-all overflow-hidden flex flex-col max-h-[92vh]`}
          >
            {/* Sabit Modal Başlığı */}
            <div className="shrink-0 p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedGroup.title} — Günleri & Tarihleri Yeniden Dağıt
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRedistributeModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRedistributeDates} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
                <p className="text-slate-600 text-xs">
                Bu gruptaki tüm turların tarihlerini <strong>1 ayda 3 kez (örn: 1, 10, 20)</strong> veya istediğiniz sıklığa göre otomatik takvimlendirebilir veya <strong>Özel Günler / Taksit Planı</strong> ile tek tek elle belirleyebilirsiniz.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Ödeme Sıklığı Seçimi
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setRedistributeDays("1, 10, 20");
                      setRedistributeFreq("THRICE_MONTHLY");
                      setRedistributeRounds((prev) =>
                        applyDaysToRounds("1, 10, 20", redistributeYear, redistributeMonth, prev)
                      );
                    }}
                    className={`py-2 px-2 rounded-xl font-bold text-xs text-center border transition-all ${
                      redistributeFreq === "THRICE_MONTHLY"
                        ? "bg-amber-600 text-white border-amber-700 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>⚡ Ayda 3 Kez</span>
                    <span className="block text-[10px] opacity-80">1, 10, 20</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRedistributeDays("1, 15");
                      setRedistributeFreq("TWICE_MONTHLY");
                      setRedistributeRounds((prev) =>
                        applyDaysToRounds("1, 15", redistributeYear, redistributeMonth, prev)
                      );
                    }}
                    className={`py-2 px-2 rounded-xl font-bold text-xs text-center border transition-all ${
                      redistributeFreq === "TWICE_MONTHLY"
                        ? "bg-amber-600 text-white border-amber-700 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>Ayda 2 Kez</span>
                    <span className="block text-[10px] opacity-80">1, 15</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRedistributeDays("10");
                      setRedistributeFreq("ONCE_MONTHLY");
                      setRedistributeRounds((prev) =>
                        applyDaysToRounds("10", redistributeYear, redistributeMonth, prev)
                      );
                    }}
                    className={`py-2 px-2 rounded-xl font-bold text-xs text-center border transition-all ${
                      redistributeFreq === "ONCE_MONTHLY"
                        ? "bg-amber-600 text-white border-amber-700 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>Ayda 1 Kez</span>
                    <span className="block text-[10px] opacity-80">Her ayın 10&apos;u</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRedistributeFreq("CUSTOM");
                      setRedistributeManualOpen(true);
                    }}
                    className={`py-2 px-2 rounded-xl font-bold text-xs text-center border transition-all ${
                      redistributeFreq === "CUSTOM"
                        ? "bg-amber-600 text-white border-amber-700 shadow-2xs ring-2 ring-amber-500/20"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>Özel Günler</span>
                    <span className="block text-[10px] opacity-80">Serbest Günler</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ay İçindeki Günler (Virgülle Ayrılmış)
                </label>
                <input
                  type="text"
                  required
                  value={redistributeDays}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRedistributeDays(val);
                    const trimmed = val.replace(/\s+/g, " ").trim();
                    if (trimmed === "1, 10, 20" || trimmed === "1,10,20") {
                      setRedistributeFreq("THRICE_MONTHLY");
                    } else if (trimmed === "1, 15" || trimmed === "1,15") {
                      setRedistributeFreq("TWICE_MONTHLY");
                    } else if (trimmed === "10") {
                      setRedistributeFreq("ONCE_MONTHLY");
                    } else {
                      setRedistributeFreq("CUSTOM");
                    }
                    setRedistributeRounds((prev) =>
                      applyDaysToRounds(val, redistributeYear, redistributeMonth, prev)
                    );
                  }}
                  placeholder="Örn: 1, 10, 20 veya 5, 12, 25"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Başlangıç Yılı</label>
                  <input
                    type="number"
                    min={2024}
                    max={2035}
                    value={redistributeYear}
                    onChange={(e) => {
                      const y = parseInt(e.target.value) || 2026;
                      setRedistributeYear(y);
                      setRedistributeRounds((prev) =>
                        applyDaysToRounds(redistributeDays, y, redistributeMonth, prev)
                      );
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Başlangıç Ayı</label>
                  <select
                    value={redistributeMonth}
                    onChange={(e) => {
                      const m = parseInt(e.target.value) || 10;
                      setRedistributeMonth(m);
                      setRedistributeRounds((prev) =>
                        applyDaysToRounds(redistributeDays, redistributeYear, m, prev)
                      );
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>
                        {m}. Ay
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Canlı Önizleme */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-950">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    Yeni Takvim Dağılımı Önizlemesi:
                  </span>
                  <span className="text-amber-800 font-extrabold">
                    {selectedGroup.totalMembers} Tur ~{" "}
                    {Math.ceil(
                      selectedGroup.totalMembers /
                        Math.max(
                          1,
                          redistributeDays
                            .split(/[,;\s]+/)
                            .filter((d) => d && !isNaN(Number(d))).length || 1
                        )
                    )}{" "}
                    Ayda Biter
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                  {getSchedulePreview(
                    redistributeDays,
                    redistributeYear,
                    redistributeMonth,
                    selectedGroup.totalMembers
                  ).map((p) => (
                    <div
                      key={p.round}
                      className="bg-white border border-amber-200/80 rounded-lg p-1.5 flex items-center justify-between"
                    >
                      <span className="font-extrabold text-slate-700">{p.round}. Tur:</span>
                      <span className="font-black text-amber-950">{p.dateStr}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Taksit Planını Manuel Düzenleme Bölümü */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                      <span>Taksit Planını Manuel & Serbest Olarak Düzenle</span>
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Turların vadelerini, isimlerini veya tutarlarını taksit tablosu gibi tek tek elle belirleyebilirsiniz.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!redistributeManualOpen) {
                        setRedistributeFreq("CUSTOM");
                      }
                      setRedistributeManualOpen(!redistributeManualOpen);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                      redistributeManualOpen
                        ? "bg-indigo-600 text-white border-indigo-700 shadow-2xs"
                        : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                    }`}
                  >
                    {redistributeManualOpen ? "Manuel Tabloyu Gizle" : "✍️ Taksitleri Manuel Düzenle"}
                  </button>
                </div>

                {redistributeManualOpen && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100">
                      <span className="text-[11px] font-extrabold text-indigo-950 flex items-center gap-1">
                        <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Hızlı Dağıtım Sihirbazı:</span>
                      </span>
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setRedistributeDays("1, 10, 20");
                            setRedistributeFreq("THRICE_MONTHLY");
                            setRedistributeRounds((prev) =>
                              applyDaysToRounds("1, 10, 20", redistributeYear, redistributeMonth, prev)
                            );
                          }}
                          className="px-2 py-1 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-lg text-[10px] font-bold text-indigo-900"
                        >
                          Ayda 3 Kez (1, 10, 20)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRedistributeDays("1, 15");
                            setRedistributeFreq("TWICE_MONTHLY");
                            setRedistributeRounds((prev) =>
                              applyDaysToRounds("1, 15", redistributeYear, redistributeMonth, prev)
                            );
                          }}
                          className="px-2 py-1 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-lg text-[10px] font-bold text-indigo-900"
                        >
                          Ayda 2 Kez (1, 15)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRedistributeDays("10");
                            setRedistributeFreq("ONCE_MONTHLY");
                            setRedistributeRounds((prev) =>
                              applyDaysToRounds("10", redistributeYear, redistributeMonth, prev)
                            );
                          }}
                          className="px-2 py-1 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-lg text-[10px] font-bold text-indigo-900"
                        >
                          Ayda 1 Kez (10&apos;u)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRedistributeFreq("CUSTOM");
                            if (redistributeRounds.length === 0) return;
                            const startD = redistributeRounds[0].dueDate
                              ? new Date(redistributeRounds[0].dueDate)
                              : new Date(redistributeYear, redistributeMonth - 1, 1);
                            const updated = redistributeRounds.map((r, idx) => {
                              const d = new Date(startD);
                              d.setDate(d.getDate() + idx * 10);
                              const y = d.getFullYear();
                              const m = String(d.getMonth() + 1).padStart(2, "0");
                              const day = String(d.getDate()).padStart(2, "0");
                              return { ...r, dueDate: `${y}-${m}-${day}` };
                            });
                            setRedistributeRounds(updated);
                          }}
                          className="px-2 py-1 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-lg text-[10px] font-bold text-indigo-900"
                        >
                          +10 Günde Bir
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRedistributeFreq("CUSTOM");
                            if (redistributeRounds.length === 0) return;
                            const startD = redistributeRounds[0].dueDate
                              ? new Date(redistributeRounds[0].dueDate)
                              : new Date(redistributeYear, redistributeMonth - 1, 1);
                            const updated = redistributeRounds.map((r, idx) => {
                              const d = new Date(startD);
                              d.setDate(d.getDate() + idx * 7);
                              const y = d.getFullYear();
                              const m = String(d.getMonth() + 1).padStart(2, "0");
                              const day = String(d.getDate()).padStart(2, "0");
                              return { ...r, dueDate: `${y}-${m}-${day}` };
                            });
                            setRedistributeRounds(updated);
                          }}
                          className="px-2 py-1 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-lg text-[10px] font-bold text-indigo-900"
                        >
                          Haftada Bir (+7 Gün)
                        </button>
                      </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl bg-white">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 font-bold text-slate-700">
                          <tr>
                            <th className="p-2 w-12 text-center">Tur</th>
                            <th className="p-2 w-32">Vade Tarihi</th>
                            <th className="p-2">Gün Sırasındaki Kişi</th>
                            <th className="p-2 w-28 text-right">Altın Tutarı (₺)</th>
                            <th className="p-2 w-24 text-center">Muhammed</th>
                            <th className="p-2 w-28">Not</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {redistributeRounds.map((mr, idx) => (
                            <tr key={idx} className={mr.isUserTurn ? "bg-amber-50/60" : "hover:bg-slate-50"}>
                              <td className="p-2 text-center font-bold text-slate-700">
                                {mr.roundIndex}. Tur
                              </td>
                              <td className="p-2">
                                <input
                                  type="date"
                                  value={mr.dueDate}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setRedistributeRounds((prev) =>
                                      prev.map((r, i) => (i === idx ? { ...r, dueDate: val } : r))
                                    );
                                  }}
                                  className="w-full p-1 border border-slate-300 rounded text-xs font-semibold"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={mr.recipientName}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const isUser = isUserTurnName(val);
                                    setRedistributeRounds((prev) =>
                                      prev.map((r, i) =>
                                        i === idx ? { ...r, recipientName: val, isUserTurn: isUser } : r
                                      )
                                    );
                                  }}
                                  className="w-full p-1 border border-slate-300 rounded text-xs font-semibold"
                                  placeholder="Katılımcı adı..."
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={mr.goldAmount}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setRedistributeRounds((prev) =>
                                      prev.map((r, i) => (i === idx ? { ...r, goldAmount: val } : r))
                                    );
                                  }}
                                  className="w-full p-1 border border-slate-300 rounded text-xs font-bold text-right text-amber-900"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={mr.isUserTurn}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setRedistributeRounds((prev) =>
                                        prev.map((r, i) =>
                                          i === idx ? { ...r, isUserTurn: checked } : r
                                        )
                                      );
                                    }}
                                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                                  />
                                  <span className="text-[10px] font-bold text-amber-800">Sıra Onda</span>
                                </label>
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={mr.notes}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setRedistributeRounds((prev) =>
                                      prev.map((r, i) => (i === idx ? { ...r, notes: val } : r))
                                    );
                                  }}
                                  className="w-full p-1 border border-slate-300 rounded text-xs"
                                  placeholder="Not..."
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              </div>

              {/* Sabit Alt Butonlar */}
              <div className="shrink-0 px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRedistributeModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={redistributeSubmitting}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {redistributeSubmitting ? "Güncelleniyor..." : "Tüm Turlara Uygula ve Güncelle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. TUR DÜZENLE MODALI */}
      {editRoundModalOpen && editingRound && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">
                {editingRound.roundIndex}. Tur Bilgilerini Düzenle
              </h3>
              <button
                type="button"
                onClick={() => setEditRoundModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoundEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Gün Sırasındaki Kişi</label>
                <input
                  type="text"
                  required
                  value={roundForm.recipientName}
                  onChange={(e) => setRoundForm({ ...roundForm, recipientName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Muhammed Ali yazarsanız sistem bu turda sıra kendisinde olduğu için 1 hisse eksik
                  hesaplar.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  O Ayki Altın Değeri (TL)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={roundForm.goldAmount}
                  onChange={(e) =>
                    setRoundForm({ ...roundForm, goldAmount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-amber-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Vade / Ödeme Tarihi</label>
                <input
                  type="date"
                  required
                  value={roundForm.dueDate}
                  onChange={(e) => setRoundForm({ ...roundForm, dueDate: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Not / Açıklama</label>
                <input
                  type="text"
                  value={roundForm.notes}
                  onChange={(e) => setRoundForm({ ...roundForm, notes: e.target.value })}
                  placeholder="İsteğe bağlı not..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditRoundModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={roundSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {roundSubmitting ? "Kaydediliyor..." : "Kaydet ve Senkronize Et"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. TÜM TURLARI VE TAKSİT PLANINI MANUEL DÜZENLEME MODALI (MEVCUT GRUP) */}
      {bulkEditModalOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Sabit Modal Başlığı */}
            <div className="shrink-0 p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {selectedGroup.title} — Taksit Planını Manuel Düzenle
                  </h3>
                  <p className="text-xs text-slate-500">
                    Toplam {bulkRounds.length} turun tüm vadelerini, isimlerini, hisselerini ve tutarlarını serbestçe değiştirin.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBulkEditModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBulkRounds} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
                {/* Sihirbaz / Hızlı Dağıtım Çubuğu */}
                <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-indigo-950 text-xs flex items-center gap-1.5">
                      <Wand2 className="w-4 h-4 text-indigo-600" />
                      <span>Hızlı Tarih Sihirbazı (Otomatik Dağıt):</span>
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleBulkFillDates("THRICE")}
                        className="px-2.5 py-1.5 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-xl font-bold text-indigo-900 text-xs shadow-2xs transition-colors"
                        title="Her ayın 1, 10 ve 20'sine sıralar"
                      >
                        ⚡ Ayda 3 Kez (1, 10, 20)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkFillDates("TWICE")}
                        className="px-2.5 py-1.5 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-xl font-bold text-indigo-900 text-xs shadow-2xs transition-colors"
                        title="Her ayın 1 ve 15'ine sıralar"
                      >
                        Ayda 2 Kez (1, 15)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkFillDates("ONCE")}
                        className="px-2.5 py-1.5 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-xl font-bold text-indigo-900 text-xs shadow-2xs transition-colors"
                        title="Her ayın 10'una sıralar"
                      >
                        Ayda 1 Kez (10&apos;u)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkFillDates("EVERY_10_DAYS")}
                        className="px-2.5 py-1.5 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-xl font-bold text-indigo-900 text-xs shadow-2xs transition-colors"
                        title="İlk tarihten itibaren her 10 günde bir"
                      >
                        +10 Günde Bir
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkFillDates("EVERY_7_DAYS")}
                        className="px-2.5 py-1.5 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-xl font-bold text-indigo-900 text-xs shadow-2xs transition-colors"
                        title="İlk tarihten itibaren haftalık (7 günde bir)"
                      >
                        Haftada Bir (+7 Gün)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-indigo-100 flex-wrap">
                    <span className="font-bold text-indigo-900 text-xs">Toplu Altın Değeri:</span>
                    <input
                      type="number"
                      value={bulkGlobalAmount}
                      onChange={(e) => setBulkGlobalAmount(parseFloat(e.target.value) || 0)}
                      className="w-32 p-1.5 bg-white border border-indigo-200 rounded-lg font-bold text-amber-900 text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyBulkGlobalAmount}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors shadow-2xs"
                    >
                      Tüm Turlara Uygula
                    </button>
                    <span className="text-[10px] text-slate-500">
                      (Veya aşağıdaki tabloda her turun tutarını tek tek değiştirebilirsiniz)
                    </span>
                  </div>
                </div>

                {/* Taksit Tablosu */}
                <div className="border border-slate-200 rounded-2xl shadow-inner bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2.5 px-3 w-14 text-center">Tur</th>
                        <th className="py-2.5 px-3 w-40">Vade Tarihi</th>
                        <th className="py-2.5 px-3">Gün Sırasındaki Kişi</th>
                        <th className="py-2.5 px-3 w-36 text-center">Muhammed Sırası</th>
                        <th className="py-2.5 px-3 w-36 text-right">Altın Tutarı (₺)</th>
                        <th className="py-2.5 px-3 w-36 text-right">Muhammed Borcu</th>
                        <th className="py-2.5 px-3 w-40">Not</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bulkRounds.map((r, idx) => {
                        const isAjda = selectedGroup.goldType === "AJDA_BILEZIK";
                        const payingMembers = selectedGroup.totalMembers - 1;
                        const perMem = isAjda
                          ? (payingMembers > 0 ? r.goldAmount / payingMembers : 0)
                          : (payingMembers > 0 && r.goldAmount > selectedGroup.defaultAmount
                              ? r.goldAmount / payingMembers
                              : selectedGroup.defaultAmount);
                        const effShares = r.isUserTurn
                          ? Math.max(0, selectedGroup.userShareCount - 1)
                          : selectedGroup.userShareCount;
                        const userPay = perMem * effShares;

                        return (
                          <tr
                            key={r.id || idx}
                            className={`transition-colors ${
                              r.isUserTurn ? "bg-amber-50/70" : "hover:bg-slate-50/80"
                            }`}
                          >
                            <td className="py-2 px-3 text-center font-extrabold text-slate-800">
                              {r.roundIndex}. Tur
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="date"
                                required
                                value={r.dueDate}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBulkRounds((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, dueDate: val } : item))
                                  );
                                }}
                                className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                required
                                value={r.recipientName}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const isUser = isUserTurnName(val);
                                  setBulkRounds((prev) =>
                                    prev.map((item, i) =>
                                      i === idx
                                        ? { ...item, recipientName: val, isUserTurn: isUser }
                                        : item
                                    )
                                  );
                                }}
                                className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="Kişi adı..."
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={r.isUserTurn}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setBulkRounds((prev) =>
                                      prev.map((item, i) =>
                                        i === idx ? { ...item, isUserTurn: checked } : item
                                      )
                                    );
                                  }}
                                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-[11px] font-bold text-amber-900">
                                  {r.isUserTurn ? "👑 Sıra Kendisinde" : "Normal Tur"}
                                </span>
                              </label>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                step="any"
                                required
                                value={r.goldAmount}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setBulkRounds((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, goldAmount: val } : item
                                    )
                                  );
                                }}
                                className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-right text-amber-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-black text-amber-950 whitespace-nowrap">
                              {formatCurrency(userPay)}
                              <span className="text-[9px] text-slate-400 block font-normal">
                                ({effShares} hisse)
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={r.notes}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBulkRounds((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, notes: val } : item))
                                  );
                                }}
                                className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none"
                                placeholder="İsteğe bağlı not..."
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sabit Alt Butonlar */}
              <div className="shrink-0 px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Toplam <strong>{bulkRounds.length}</strong> taksit kaydedilecek ve okul giderlerindeki nakit borçlar güncellenecek.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkEditModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={bulkSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 text-white" />
                    <span>{bulkSubmitting ? "Kaydediliyor..." : "Tüm Taksit Planını Kaydet"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
