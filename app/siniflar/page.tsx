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
  Baby,
  BookOpen,
  Sparkles,
  FileSpreadsheet,
  Printer,
  Download,
  Phone,
  Loader2,
  Check,
  Settings2,
  CheckSquare,
  Square,
  FileText,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  useSchoolCategory,
  SchoolCategoryBadge,
  SchoolCategoryModal,
} from "@/components/SchoolCategoryGate";

interface Staff {
  id: string;
  fullName: string;
  title: string | null;
  phone: string | null;
  status?: string;
  terminationDate?: string | null;
}

interface ClassroomStudent {
  id: string;
  studentNo: string | null;
  tcNo: string;
  fullName: string;
  status: string;
  gender?: string | null;
  birthDate?: string | null;
  bloodGroup?: string | null;
  healthNotes?: string | null;
  emergencyContact?: string | null;
  fatherName?: string | null;
  fatherPhone?: string | null;
  fatherJob?: string | null;
  motherName?: string | null;
  motherPhone?: string | null;
  motherJob?: string | null;
  guardianRelation?: string | null;
  primaryPhone: string;
  primaryEmail?: string | null;
  homeAddress?: string | null;
  cityDistrict?: string | null;
  serviceUsed?: boolean;
  mealUsed?: boolean;
  enrollmentDate?: string | null;
  photoUrl: string | null;
  netAmount?: number;
}

interface Classroom {
  id: string;
  name: string;
  section: "ANAOKULU" | "ILKOKUL" | "ORTAOKUL" | "LISE" | "KURS";
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

interface ExportOptions {
  includeParentInfo: boolean; // Anne-Baba Adı, Telefonu, Mesleği, Veli Tel, Adres
  includeBasicInfo: boolean; // No, TC, Cinsiyet, Doğum Tarihi, Kan Grubu
  includeServices: boolean; // Servis, Yemek
  includeAttendanceColumn: boolean; // İmza / Yoklama sütunu (yazdırma için)
  separateSheetsPerClass: boolean; // Her sınıf ayrı Excel sayfasında (sekmesinde)
  includeMasterSheet: boolean; // Tüm Okul Genel Liste sayfası
}

const SECTIONS = [
  { id: "ALL", label: "Tüm Kademeler", icon: "🏫" },
  { id: "ANAOKULU", label: "Anaokulu / Okul Öncesi", icon: "🧸" },
  { id: "ILKOKUL", label: "İlkokul (1-4)", icon: "🎒" },
  { id: "ORTAOKUL", label: "Ortaokul (5-8)", icon: "📚" },
  { id: "LISE", label: "Lise (9-12)", icon: "🎓" },
  { id: "KURS", label: "Özel Kurs / Mezun", icon: "🎯" },
];

const GRADE_LEVELS = [
  // Anaokulu
  { id: "2_YAS", label: "2 Yaş (Oyun Grubu / Kreş)", section: "ANAOKULU" },
  { id: "3_YAS", label: "3 Yaş (Oyun Grubu / Minikler)", section: "ANAOKULU" },
  { id: "4_YAS", label: "4 Yaş (Küçük Grup)", section: "ANAOKULU" },
  { id: "5_YAS", label: "5 Yaş / Anasınıfı (İlkokula Hazırlık)", section: "ANAOKULU" },
  // İlkokul
  { id: "1", label: "1. Sınıf", section: "ILKOKUL" },
  { id: "2", label: "2. Sınıf", section: "ILKOKUL" },
  { id: "3", label: "3. Sınıf", section: "ILKOKUL" },
  { id: "4", label: "4. Sınıf", section: "ILKOKUL" },
  // Ortaokul
  { id: "5", label: "5. Sınıf", section: "ORTAOKUL" },
  { id: "6", label: "6. Sınıf", section: "ORTAOKUL" },
  { id: "7", label: "7. Sınıf", section: "ORTAOKUL" },
  { id: "8", label: "8. Sınıf (LGS Hazırlık)", section: "ORTAOKUL" },
  // Lise
  { id: "9", label: "9. Sınıf", section: "LISE" },
  { id: "10", label: "10. Sınıf", section: "LISE" },
  { id: "11", label: "11. Sınıf", section: "LISE" },
  { id: "12", label: "12. Sınıf (YKS Hazırlık)", section: "LISE" },
  // Kurs
  { id: "MEZUN", label: "Mezun Grubu", section: "KURS" },
];

export default function SiniflarPage() {
  const {
    schoolSection,
    hasSelectedCategory,
    isSelectorOpen,
    setIsSelectorOpen,
    setSchoolSection,
    activeCategory,
  } = useSchoolCategory();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState("ALL");
  const [gradeFilter, setGradeFilter] = useState("ALL");

  // Modallar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [modalStudentSearch, setModalStudentSearch] = useState("");

  // Dışa Aktarma & Yazdırma Seçenekleri Modalı
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportTargetClassroomId, setExportTargetClassroomId] = useState<string>("ALL");
  const [isExporting, setIsExporting] = useState(false);

  // Dışa Aktarma Tercihleri
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeParentInfo: true, // Anne & Baba Bilgileri (Tel, Adres vs.)
    includeBasicInfo: true,  // No, TC, Cinsiyet, Doğum Tarihi, Kan Grubu
    includeServices: true,   // Servis, Yemek
    includeAttendanceColumn: true, // İmza / Yoklama Kutusu
    separateSheetsPerClass: true,  // Her Sınıf Ayrı Excel Sayfası
    includeMasterSheet: true,      // Tüm Okul Genel Listesi
  });

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    section: "ANAOKULU" as "ANAOKULU" | "ILKOKUL" | "ORTAOKUL" | "LISE" | "KURS",
    gradeLevel: "3_YAS",
    branch: "Papatyalar Sınıfı",
    capacity: 16,
    academicYear: "2025-2026",
    roomNumber: "Zemin Kat - 1",
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
        const list: Staff[] = Array.isArray(data) ? data : data.staff || [];
        setStaffList(list);
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

  const openAddModal = (defaultSection = schoolSection) => {
    setEditingClassroom(null);
    const firstGradeForSection =
      GRADE_LEVELS.find((g) => g.section === defaultSection)?.id || "3_YAS";
    const defBranch = defaultSection === "ANAOKULU" ? "Minik Kalpler" : "A Şubesi";
    setFormData({
      name: "",
      section: defaultSection as any,
      gradeLevel: firstGradeForSection,
      branch: defBranch,
      capacity: defaultSection === "ANAOKULU" ? 14 : 18,
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
      section: c.section || "ANAOKULU",
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
    setModalStudentSearch("");
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

  // Dışa Aktarma Modalını Aç (Genel veya Belirli Sınıf İçin)
  const openExportModal = (classroomId: string = "ALL") => {
    setExportTargetClassroomId(classroomId);
    setIsExportModalOpen(true);
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

  // ================= EXCEL DIŞA AKTARMA ENGINE =================
  const sanitizeSheetName = (name: string, existingNames: Set<string>): string => {
    let clean = (name || "Sinif").replace(/[\\/:*?[\]]/g, "_").trim().slice(0, 28);
    if (!clean) clean = "Sinif";
    let uniqueName = clean;
    let counter = 1;
    while (existingNames.has(uniqueName.toLowerCase())) {
      uniqueName = `${clean.slice(0, 25)}_${counter}`;
      counter++;
    }
    existingNames.add(uniqueName.toLowerCase());
    return uniqueName;
  };

  const buildStudentRow = (
    st: ClassroomStudent,
    idx: number,
    includeClassName = false,
    className = "",
    sectionName = ""
  ) => {
    const row: Record<string, any> = {};

    if (includeClassName) {
      row["Sınıf Adı"] = className;
      row["Kademe"] = sectionName;
    }

    row["Sıra No"] = idx + 1;

    if (exportOptions.includeBasicInfo) {
      row["Öğrenci No"] = st.studentNo || "";
      row["T.C. Kimlik No"] = st.tcNo || "";
      row["Adı Soyadı"] = st.fullName || "";
      row["Cinsiyet"] =
        st.gender === "FEMALE"
          ? "Kız"
          : st.gender === "MALE"
          ? "Erkek"
          : st.gender || "";
      row["Doğum Tarihi"] = st.birthDate
        ? new Date(st.birthDate).toLocaleDateString("tr-TR")
        : "";
      row["Kan Grubu"] = st.bloodGroup || "";
    } else {
      row["Öğrenci No"] = st.studentNo || "";
      row["Adı Soyadı"] = st.fullName || "";
    }

    if (exportOptions.includeParentInfo) {
      row["Anne Adı"] = st.motherName || "";
      row["Anne Telefonu"] = st.motherPhone || "";
      row["Anne Mesleği"] = st.motherJob || "";
      row["Baba Adı"] = st.fatherName || "";
      row["Baba Telefonu"] = st.fatherPhone || "";
      row["Baba Mesleği"] = st.fatherJob || "";
      row["Veli / Bildirim Tel"] = st.primaryPhone || "";
      row["Veli E-Posta"] = st.primaryEmail || "";
      row["Ev Adresi"] = st.homeAddress || "";
      row["İlçe / Şehir"] = st.cityDistrict || "";
    } else {
      row["Veli Telefonu"] = st.primaryPhone || "";
    }

    if (exportOptions.includeServices) {
      row["Servis"] = st.serviceUsed ? "Var" : "Yok";
      row["Yemek"] = st.mealUsed ? "Var" : "Yok";
    }

    row["Kayıt Durumu"] =
      st.status === "ACTIVE"
        ? "Aktif"
        : st.status === "PASSIVE"
        ? "Pasif"
        : st.status === "GRADUATED"
        ? "Mezun"
        : st.status;

    return row;
  };

  const getColWidths = (includeClassName = false) => {
    const widths: { wch: number }[] = [];
    if (includeClassName) {
      widths.push({ wch: 18 }); // Sınıf
      widths.push({ wch: 12 }); // Kademe
    }
    widths.push({ wch: 8 }); // Sıra No
    if (exportOptions.includeBasicInfo) {
      widths.push({ wch: 12 }); // No
      widths.push({ wch: 14 }); // TC
      widths.push({ wch: 25 }); // Ad Soyad
      widths.push({ wch: 10 }); // Cinsiyet
      widths.push({ wch: 13 }); // Doğum Tarihi
      widths.push({ wch: 10 }); // Kan Grubu
    } else {
      widths.push({ wch: 12 });
      widths.push({ wch: 25 });
    }
    if (exportOptions.includeParentInfo) {
      widths.push({ wch: 18 }); // Anne Adı
      widths.push({ wch: 16 }); // Anne Tel
      widths.push({ wch: 16 }); // Anne Meslek
      widths.push({ wch: 18 }); // Baba Adı
      widths.push({ wch: 16 }); // Baba Tel
      widths.push({ wch: 16 }); // Baba Meslek
      widths.push({ wch: 18 }); // Veli Tel
      widths.push({ wch: 22 }); // E-posta
      widths.push({ wch: 30 }); // Adres
      widths.push({ wch: 15 }); // İlçe
    } else {
      widths.push({ wch: 18 });
    }
    if (exportOptions.includeServices) {
      widths.push({ wch: 10 }); // Servis
      widths.push({ wch: 10 }); // Yemek
    }
    widths.push({ wch: 12 }); // Durum
    return widths;
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);

      // 1) Tek bir sınıf mı, tüm sınıflar mı?
      if (exportTargetClassroomId !== "ALL") {
        const res = await fetch(`/api/siniflar/${exportTargetClassroomId}`);
        if (!res.ok) throw new Error("Sınıf bilgisi alınamadı");
        const singleClass: Classroom = await res.json();
        const students = singleClass.students || [];

        if (students.length === 0) {
          alert(`"${singleClass.name}" sınıfında kayıtlı öğrenci bulunmuyor.`);
          return;
        }

        const rows = students.map((st, idx) => buildStudentRow(st, idx, false));
        const ws = XLSX.utils.json_to_sheet(rows);
        ws["!cols"] = getColWidths(false);

        const wb = XLSX.utils.book_new();
        const safeSheetName = (singleClass.name || "Sinif")
          .replace(/[\\/:*?[\]]/g, "_")
          .slice(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

        const parentTag = exportOptions.includeParentInfo ? "_VeliDetayli" : "";
        const fileName = `${singleClass.name.replace(/[\\/:*?"<>|]/g, "_")}${parentTag}_Ogrenci_Listesi.xlsx`;
        XLSX.writeFile(wb, fileName);
        setIsExportModalOpen(false);
        return;
      }

      // 2) TÜM SINIFLAR DIŞA AKTARMA (Ayrı sayfalarda / sekmelerde)
      const res = await fetch("/api/siniflar?includeStudents=true");
      if (!res.ok) throw new Error("Sınıflar alınamadı");
      const fullClassrooms: Classroom[] = await res.json();

      if (!fullClassrooms || fullClassrooms.length === 0) {
        alert("Dışa aktarılacak sınıf bulunamadı.");
        return;
      }

      const wb = XLSX.utils.book_new();
      const existingSheetNames = new Set<string>();

      // Sayfa A: Sınıf & Kontenjan İcmali / Özeti
      const summaryRows = fullClassrooms.map((c) => ({
        "Sınıf Adı": c.name,
        "Kademe": c.section,
        "Seviye": c.gradeLevel,
        "Şube": c.branch || "-",
        "Öğretmen": c.teacherStaff?.fullName || "Atanmadı",
        "Kontenjan": c.capacity,
        "Kayıtlı Öğrenci": c.activeStudentCount,
        "Doluluk Oranı": `%${c.occupancyRate}`,
        "Derslik": c.roomNumber || "-",
      }));
      const summaryWs = XLSX.utils.json_to_sheet(summaryRows);
      summaryWs["!cols"] = [
        { wch: 22 },
        { wch: 14 },
        { wch: 10 },
        { wch: 16 },
        { wch: 24 },
        { wch: 12 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
      ];
      const summarySheetName = sanitizeSheetName("Sınıf & Kontenjan Özeti", existingSheetNames);
      XLSX.utils.book_append_sheet(wb, summaryWs, summarySheetName);

      // Sayfa B: Tüm Okul Genel Listesi (İstenirse)
      if (exportOptions.includeMasterSheet) {
        const masterRows: any[] = [];
        fullClassrooms.forEach((c) => {
          (c.students || []).forEach((st, idx) => {
            masterRows.push(buildStudentRow(st, idx, true, c.name, c.section));
          });
        });

        if (masterRows.length > 0) {
          const masterWs = XLSX.utils.json_to_sheet(masterRows);
          masterWs["!cols"] = getColWidths(true);
          const masterSheetName = sanitizeSheetName("Tüm Okul Genel Liste", existingSheetNames);
          XLSX.utils.book_append_sheet(wb, masterWs, masterSheetName);
        }
      }

      // Sayfa C..N: HER SINIF AYRI BİR EXCEL SAYFASINDA (SEKMESİNDE)
      if (exportOptions.separateSheetsPerClass) {
        fullClassrooms.forEach((c) => {
          const cStudents = c.students || [];
          if (cStudents.length > 0) {
            const classRows = cStudents.map((st, idx) => buildStudentRow(st, idx, false));
            const classWs = XLSX.utils.json_to_sheet(classRows);
            classWs["!cols"] = getColWidths(false);

            const tabName = sanitizeSheetName(c.name, existingSheetNames);
            XLSX.utils.book_append_sheet(wb, classWs, tabName);
          }
        });
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      const parentTag = exportOptions.includeParentInfo ? "_VeliDetayli" : "";
      XLSX.writeFile(wb, `Tum_Siniflar_Ogrenci_Listeleri${parentTag}_${dateStr}.xlsx`);
      setIsExportModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Excel dosyası hazırlanırken bir hata oluştu.");
    } finally {
      setIsExporting(false);
    }
  };

  // ================= YAZDIRMA / PDF ENGINE =================
  const handlePrint = async () => {
    try {
      setIsExporting(true);
      let targetClasses: Classroom[] = [];

      if (exportTargetClassroomId !== "ALL") {
        const res = await fetch(`/api/siniflar/${exportTargetClassroomId}`);
        if (!res.ok) throw new Error();
        const singleClass = await res.json();
        targetClasses = [singleClass];
      } else {
        const res = await fetch("/api/siniflar?includeStudents=true");
        if (!res.ok) throw new Error();
        targetClasses = await res.json();
      }

      const classesWithStudents = targetClasses.filter(
        (c) => c.students && c.students.length > 0
      );

      if (classesWithStudents.length === 0) {
        alert("Yazdırılacak öğrenci bulunamadı.");
        return;
      }

      const printWindow = window.open("", "_blank", "width=1000,height=800");
      if (!printWindow) {
        alert("Yazdırma penceresi açılamadı. Lütfen tarayıcı açılır pencere (pop-up) engelleyicisini kontrol edin.");
        return;
      }

      const pagesHtml = classesWithStudents
        .map((c) => {
          const students = c.students || [];
          const rowsHtml = students
            .map((st, idx) => {
              return `
              <tr>
                <td style="text-align: center; font-weight: bold; width: 28px;">${idx + 1}</td>
                <td style="text-align: center; width: 45px;">${st.studentNo || "-"}</td>
                ${
                  exportOptions.includeBasicInfo
                    ? `<td style="text-align: center; font-family: monospace; width: 85px;">${st.tcNo || "-"}</td>`
                    : ""
                }
                <td style="font-weight: 600;">${st.fullName}</td>
                <td style="text-align: center; width: 42px;">${
                  st.gender === "FEMALE" ? "Kız" : st.gender === "MALE" ? "Erkek" : "-"
                }</td>
                ${
                  exportOptions.includeParentInfo
                    ? `
                      <td>
                        <strong>${st.motherName || "-"}</strong>
                        ${st.motherPhone ? `<br/><span style="font-family: monospace; font-size: 9.5px; color: #047857;">📞 ${st.motherPhone}</span>` : ""}
                        ${st.motherJob ? `<span style="color: #64748b; font-size: 9px;"> (${st.motherJob})</span>` : ""}
                      </td>
                      <td>
                        <strong>${st.fatherName || "-"}</strong>
                        ${st.fatherPhone ? `<br/><span style="font-family: monospace; font-size: 9.5px; color: #047857;">📞 ${st.fatherPhone}</span>` : ""}
                        ${st.fatherJob ? `<span style="color: #64748b; font-size: 9px;"> (${st.fatherJob})</span>` : ""}
                      </td>
                      <td style="text-align: center; font-family: monospace; font-weight: 600; width: 85px;">
                        ${st.primaryPhone || "-"}
                      </td>
                    `
                    : `
                      <td style="text-align: center; font-family: monospace; width: 85px;">
                        ${st.primaryPhone || "-"}
                      </td>
                    `
                }
                ${
                  exportOptions.includeServices
                    ? `
                      <td style="text-align: center; font-size: 10px; width: 32px;">${st.serviceUsed ? "✓" : "-"}</td>
                      <td style="text-align: center; font-size: 10px; width: 32px;">${st.mealUsed ? "✓" : "-"}</td>
                    `
                    : ""
                }
                ${
                  exportOptions.includeAttendanceColumn
                    ? `<td style="width: 75px;"></td>`
                    : ""
                }
              </tr>
            `;
            })
            .join("");

          return `
            <div class="class-page">
              <div class="header">
                <div>
                  <div class="school-title">Öğrenci Sınıf & Yoklama Listesi</div>
                  <div class="sub-title">${c.name} ${c.branch ? `(${c.branch})` : ""}</div>
                </div>
                <div class="meta-box">
                  <div><strong>Öğretmen:</strong> ${c.teacherStaff?.fullName || "Belirtilmemiş"}</div>
                  <div><strong>Dönem:</strong> ${c.academicYear} | <strong>Derslik:</strong> ${c.roomNumber || "-"}</div>
                  <div><strong>Tarih:</strong> ${new Date().toLocaleDateString("tr-TR")}</div>
                </div>
              </div>

              <div class="meta-badges">
                <div><strong>Mevcut:</strong> ${students.length} Öğrenci</div>
                <div><strong>Kız:</strong> ${students.filter((s) => s.gender === "FEMALE").length}</div>
                <div><strong>Erkek:</strong> ${students.filter((s) => s.gender === "MALE").length}</div>
                <div><strong>Servis:</strong> ${students.filter((s) => s.serviceUsed).length}</div>
                <div><strong>Yemek:</strong> ${students.filter((s) => s.mealUsed).length}</div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>No</th>
                    ${exportOptions.includeBasicInfo ? `<th>T.C. Kimlik</th>` : ""}
                    <th>Öğrenci Adı Soyadı</th>
                    <th>Cins.</th>
                    ${
                      exportOptions.includeParentInfo
                        ? `
                          <th>Anne Bilgisi (Ad & Tel)</th>
                          <th>Baba Bilgisi (Ad & Tel)</th>
                          <th>Veli Telefonu</th>
                        `
                        : `<th>Veli İletişim Tel</th>`
                    }
                    ${exportOptions.includeServices ? `<th>Serv.</th><th>Yem.</th>` : ""}
                    ${exportOptions.includeAttendanceColumn ? `<th>İmza / Yoklama</th>` : ""}
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>

              <div class="signatures">
                <div class="sig-block">
                  <div>${c.teacherStaff?.fullName || "Sınıf Öğretmeni"}</div>
                  <div style="font-size: 9.5px; color: #64748b;">${
                    c.section === "ANAOKULU" ? "Sınıf Öğretmeni" : "Sınıf Rehber Öğretmeni"
                  }</div>
                  <div class="sig-line">İmza</div>
                </div>
                <div class="sig-block">
                  <div>Okul Yönetimi</div>
                  <div style="font-size: 9.5px; color: #64748b;">Müdür / Müdür Yardımcısı</div>
                  <div class="sig-line">İmza / Kaşe</div>
                </div>
              </div>
            </div>
          `;
        })
        .join("");

      const html = `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <title>Sınıf Öğrenci Listeleri</title>
          <style>
            @page {
              size: A4 ${exportOptions.includeParentInfo ? "landscape" : "portrait"};
              margin: 10mm;
            }
            body {
              font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              font-size: 10.5px;
              color: #1e293b;
              margin: 0;
              padding: 0;
            }
            .class-page {
              page-break-after: always;
              break-after: page;
              padding: 8px 12px;
            }
            .class-page:last-child {
              page-break-after: auto;
              break-after: auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0f766e;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .school-title {
              font-size: 15px;
              font-weight: 800;
              color: #0f766e;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .sub-title {
              font-size: 13px;
              font-weight: bold;
              color: #1e293b;
              margin-top: 2px;
            }
            .meta-box {
              font-size: 10px;
              color: #475569;
              text-align: right;
              line-height: 1.35;
            }
            .meta-badges {
              display: flex;
              gap: 12px;
              margin-bottom: 10px;
              font-size: 10px;
              background: #f8fafc;
              padding: 6px 10px;
              border-radius: 6px;
              border: 1px solid #e2e8f0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background-color: #f1f5f9;
              color: #0f172a;
              font-weight: 700;
              font-size: 9.5px;
              text-transform: uppercase;
              border: 1px solid #cbd5e1;
              padding: 5px 4px;
            }
            td {
              border: 1px solid #cbd5e1;
              padding: 5px 6px;
              font-size: 10px;
              vertical-align: middle;
            }
            tr:nth-child(even) td {
              background-color: #f8fafc;
            }
            .signatures {
              margin-top: 25px;
              display: flex;
              justify-content: space-between;
              padding: 0 40px;
            }
            .sig-block {
              text-align: center;
              font-size: 10.5px;
            }
            .sig-line {
              margin-top: 35px;
              border-top: 1px dashed #64748b;
              width: 170px;
              padding-top: 4px;
              font-weight: 600;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .class-page {
                page-break-after: always;
                break-after: page;
              }
            }
          </style>
        </head>
        <body>
          ${pagesHtml}
          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      setIsExportModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Yazdırma sayfası hazırlanırken bir hata oluştu.");
    } finally {
      setIsExporting(false);
    }
  };

  // Filtreleme
  const filteredClassrooms = classrooms.filter((c) => {
    const matchSearch =
      !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.branch && c.branch.toLowerCase().includes(search.toLowerCase())) ||
      (c.teacherStaff && c.teacherStaff.fullName.toLowerCase().includes(search.toLowerCase()));

    const matchSection = selectedSection === "ALL" || c.section === selectedSection;
    const matchGrade = gradeFilter === "ALL" || c.gradeLevel === gradeFilter;

    return matchSearch && matchSection && matchGrade;
  });

  const totalCapacity = classrooms.reduce((s, c) => s + c.capacity, 0);
  const totalEnrolled = classrooms.reduce((s, c) => s + c.activeStudentCount, 0);
  const overallOccupancy = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  // Modal içindeki filtrelenmiş öğrenci listesi
  const modalStudents = (selectedClassroom?.students || []).filter((st) => {
    if (!modalStudentSearch.trim()) return true;
    const q = modalStudentSearch.toLowerCase();
    return (
      st.fullName.toLowerCase().includes(q) ||
      (st.studentNo && st.studentNo.toLowerCase().includes(q)) ||
      (st.tcNo && st.tcNo.includes(q)) ||
      (st.primaryPhone && st.primaryPhone.includes(q)) ||
      (st.motherName && st.motherName.toLowerCase().includes(q)) ||
      (st.fatherName && st.fatherName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 lg:p-8 space-y-6">
      <SchoolCategoryModal
        isOpen={isSelectorOpen}
        currentSection={hasSelectedCategory ? schoolSection : null}
        hasSelectedBefore={hasSelectedCategory}
        onSelect={(sec) => setSchoolSection(sec)}
        onClose={() => setIsSelectorOpen(false)}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-800 text-white shadow-xs">
            <School className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Sınıflar & Şubeler</h1>
            <p className="text-xs text-slate-500 font-medium">
              Sınıf kontenjanları, şubeler, öğrenci listeleri ve sınıf öğretmenleri yönetimi
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SchoolCategoryBadge
            activeCategory={activeCategory}
            onOpenSelector={() => setIsSelectorOpen(true)}
          />

          {/* Sınıf Listeleri Al / Dışa Aktar Modalı Butonu */}
          <button
            onClick={() => openExportModal("ALL")}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all"
            title="Sınıfları ayrı sayfalarda Excel olarak indir veya yazdır"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Sınıf Listeleri Al (Excel / Yazdır)</span>
          </button>

          <button
            onClick={() => openAddModal(schoolSection)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Sınıf Oluştur</span>
          </button>
        </div>
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
          <span className="text-[10px] text-slate-400 mt-1 block">
            {activeCategory.icon} {activeCategory.label}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider block">
            Kayıtlı Öğrenci
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-teal-800">{totalEnrolled}</span>
            <GraduationCap className="w-4 h-4 text-teal-600" />
          </div>
          <span className="text-[10px] text-teal-600 mt-1 block">Aktif öğrenci mevcudu</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Toplam Kontenjan
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-slate-800">{totalCapacity}</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Kalan Boş: {Math.max(0, totalCapacity - totalEnrolled)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
            Genel Doluluk Oranı
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-blue-700">%{overallOccupancy}</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-[10px] text-blue-600 mt-1 block">Kapasite kullanım oranı</span>
        </div>
      </div>

      {/* Arama & Alt Seviye Filtresi */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Sınıf adı, şube veya rehber öğretmen ara..."
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
          {GRADE_LEVELS.filter((g) => g.section === schoolSection).map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sınıf Kartları Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredClassrooms.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <School className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Henüz sınıf bulunmuyor.</p>
            <p className="text-xs text-slate-400">Yukarıdaki butondan yeni sınıf tanımlayabilirsiniz.</p>
          </div>
        ) : (
          filteredClassrooms.map((c) => {
            const isFull = c.activeStudentCount >= c.capacity;
            const isAnaokulu = c.section === "ANAOKULU";
            return (
              <div
                key={c.id}
                onClick={() => openDetailModal(c)}
                className={`bg-white rounded-2xl border p-4 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${
                  isAnaokulu ? "hover:border-pink-500 border-pink-100" : "hover:border-teal-500 border-slate-200"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider block ${
                          isAnaokulu ? "text-pink-600" : "text-teal-700"
                        }`}
                      >
                        {isAnaokulu ? "🧸 Okul Öncesi / Anaokulu" : `${c.gradeLevel}. Seviye`}
                        {c.branch ? ` • ${c.branch}` : ""}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-800 group-hover:text-teal-700 transition-colors">
                        {c.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Kart Hızlı Listeyi Al (Excel / Yazdır Ayarları) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openExportModal(c.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title="Bu Sınıfın Listesini Al (Excel / Yazdır)"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(c);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(c.id, c.name);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Sil"
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
                            : isAnaokulu
                            ? "bg-pink-500"
                            : "bg-teal-600"
                        }`}
                        style={{ width: `${Math.min(100, c.occupancyRate)}%` }}
                      />
                    </div>
                  </div>

                  {/* Öğretmen ve Derslik */}
                  <div className="text-[11px] text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">
                        <strong>{isAnaokulu ? "Sınıf Öğretmeni:" : "Rehber Öğretmen:"}</strong>{" "}
                        {c.teacherStaff ? (
                          <span className="font-semibold text-teal-800">
                            {c.teacherStaff.fullName}
                            {c.teacherStaff.title ? ` (${c.teacherStaff.title})` : ""}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Atanmadı</span>
                        )}
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

                <div
                  className={`pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold ${
                    isAnaokulu ? "text-pink-600" : "text-teal-700"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    Öğrenci Listesi ({c.activeStudentCount})
                  </span>
                  <span>&rarr;</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= MODAL: DIŞA AKTARMA & YAZDIRMA AYARLARI ================= */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Başlık */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Sınıf Öğrenci Listesi Alma
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Ayrı sayfalı Excel veya yazdırılabilir yoklama listesi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs overflow-y-auto max-h-[75vh]">
              {/* Hedef Sınıf Seçimi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  1. Hangi Sınıfın Listesi Alınacak?
                </label>
                <select
                  value={exportTargetClassroomId}
                  onChange={(e) => setExportTargetClassroomId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                >
                  <option value="ALL">🏫 TÜM SINIFLAR (Tüm Sınıflar Ayrı Excel Sayfalarında)</option>
                  <optgroup label="Tek Bir Sınıf Seç">
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.activeStudentCount} Öğrenci)
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {exportTargetClassroomId === "ALL"
                    ? "Tüm sınıflar Excel çalışma kitabında ayrı ayrı sayfalara (sekmelere) aktarılır."
                    : "Yalnızca seçilen bu sınıfın listesi dışa aktarılır."}
                </p>
              </div>

              {/* Dahil Edilecek Bilgiler (Seçenekler) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-700">
                  2. Listeye Dahil Edilecek Bilgiler (Seçenekler):
                </label>

                {/* Anne & Baba Bilgileri (Birlikte) */}
                <div
                  onClick={() =>
                    setExportOptions({
                      ...exportOptions,
                      includeParentInfo: !exportOptions.includeParentInfo,
                    })
                  }
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    exportOptions.includeParentInfo
                      ? "bg-teal-50/50 border-teal-300"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="mt-0.5 text-teal-700">
                    {exportOptions.includeParentInfo ? (
                      <CheckSquare className="w-4 h-4 text-teal-700" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">
                      Anne & Baba Bilgileri Birlikte Eklensin (Telefon, Meslek, Adres)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Anne Adı, Anne Telefonu, Mesleği, Baba Adı, Baba Telefonu, Mesleği, Veli İletişim Tel ve Ev Adresi sütunları eklenir.
                    </p>
                  </div>
                </div>

                {/* Kimlik & Temel Bilgiler */}
                <div
                  onClick={() =>
                    setExportOptions({
                      ...exportOptions,
                      includeBasicInfo: !exportOptions.includeBasicInfo,
                    })
                  }
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    exportOptions.includeBasicInfo
                      ? "bg-teal-50/50 border-teal-300"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="mt-0.5 text-teal-700">
                    {exportOptions.includeBasicInfo ? (
                      <CheckSquare className="w-4 h-4 text-teal-700" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">
                      Öğrenci Kimlik & Temel Bilgileri
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Öğrenci No, T.C. Kimlik No, Cinsiyet (Kız/Erkek), Doğum Tarihi ve Kan Grubu sütunları.
                    </p>
                  </div>
                </div>

                {/* Hizmet Bilgileri */}
                <div
                  onClick={() =>
                    setExportOptions({
                      ...exportOptions,
                      includeServices: !exportOptions.includeServices,
                    })
                  }
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    exportOptions.includeServices
                      ? "bg-teal-50/50 border-teal-300"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="mt-0.5 text-teal-700">
                    {exportOptions.includeServices ? (
                      <CheckSquare className="w-4 h-4 text-teal-700" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">
                      Okul Hizmetleri (Servis & Yemek)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Öğrencinin servis ve yemek kullanım durumu belirtilir.
                    </p>
                  </div>
                </div>

                {/* Boş İmza / Yoklama Kutucuğu (Yazdırma için) */}
                <div
                  onClick={() =>
                    setExportOptions({
                      ...exportOptions,
                      includeAttendanceColumn: !exportOptions.includeAttendanceColumn,
                    })
                  }
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    exportOptions.includeAttendanceColumn
                      ? "bg-teal-50/50 border-teal-300"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="mt-0.5 text-teal-700">
                    {exportOptions.includeAttendanceColumn ? (
                      <CheckSquare className="w-4 h-4 text-teal-700" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">
                      Boş Yoklama / İmza Kutusu
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Yazdırılan listelerde veya çıktılarda öğretmen/yoklama imzası için boş sütun ekler.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tüm Sınıflar İçin Excel Sayfa Yapılandırması */}
              {exportTargetClassroomId === "ALL" && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block font-bold text-slate-700">
                    3. Excel Çalışma Kitabı Sayfa Düzeni:
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={exportOptions.separateSheetsPerClass}
                      onChange={(e) =>
                        setExportOptions({
                          ...exportOptions,
                          separateSheetsPerClass: e.target.checked,
                        })
                      }
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span>Her sınıf ayrı bir Excel sayfasında (sekmesinde) açılsın</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeMasterSheet}
                      onChange={(e) =>
                        setExportOptions({
                          ...exportOptions,
                          includeMasterSheet: e.target.checked,
                        })
                      }
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span>İlk sayfa olarak "Tüm Okul Genel Listesi" sayfası eklensin</span>
                  </label>
                </div>
              )}
            </div>

            {/* Modal Aksiyon Butonları */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition-colors"
              >
                Vazgeç
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-all"
                >
                  {isExporting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Printer className="w-3.5 h-3.5" />
                  )}
                  <span>Yazdır / PDF Al</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-all"
                >
                  {isExporting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  )}
                  <span>Excel İndir (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    {editingClassroom ? "Sınıfı Düzenle" : "Yeni Sınıf / Şube Tanımla"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {activeCategory.icon} {activeCategory.label}
                  </p>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sınıf / Yaş Seviyesi *</label>
                  <select
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                  >
                    {GRADE_LEVELS.filter((g) => g.section === formData.section).map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Şube / Branş</label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder={formData.section === "ANAOKULU" ? "Papatyalar, Uğur Böcekleri" : "A Şubesi, Sayısal"}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sınıfın Tam Adı *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={
                    formData.section === "ANAOKULU"
                      ? "Örn: Minikler 3 Yaş (Papatyalar), Hazırlık 5 Yaş"
                      : "Örn: 1-A İlkokul, 8-A LGS"
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                />
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
                    placeholder="Zemin Kat - 1, Kat 2"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {formData.section === "ANAOKULU" ? "Sınıf / Okul Öncesi Öğretmeni" : "Sınıf Rehber Öğretmeni"}
                </label>
                <select
                  value={formData.teacherStaffId}
                  onChange={(e) => setFormData({ ...formData, teacherStaffId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                >
                  <option value="">Öğretmen Seçiniz...</option>
                  {(() => {
                    const activeStaff = staffList.filter((s) => s.status !== "PASSIVE" && !s.terminationDate);
                    const isTeacher = (s: Staff) => {
                      const t = (s.title || "").toLowerCase();
                      return (
                        t.includes("öğretmen") ||
                        t.includes("ogretmen") ||
                        t.includes("eğit") ||
                        t.includes("egit") ||
                        t.includes("koordinatör") ||
                        t.includes("psikolog") ||
                        t.includes("satranç") ||
                        t.includes("spor") ||
                        t.includes("dans") ||
                        t.includes("müdür")
                      );
                    };
                    const teachers = activeStaff
                      .filter(isTeacher)
                      .sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));
                    const others = activeStaff
                      .filter((s) => !isTeacher(s))
                      .sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));

                    return (
                      <>
                        {teachers.length > 0 && (
                          <optgroup label="🎓 Öğretmenler & Eğitim Kadrosu">
                            {teachers.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.fullName} {s.title ? `(${s.title})` : ""}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {others.length > 0 && (
                          <optgroup label="👥 Diğer Personeller">
                            {others.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.fullName} {s.title ? `(${s.title})` : ""}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </>
                    );
                  })()}
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                  {selectedClassroom.section === "ANAOKULU" ? "🧸 Anaokulu Öğrenci Listesi" : "Sınıf Öğrenci Listesi"}
                </span>
                <h3 className="text-lg font-extrabold text-slate-800">{selectedClassroom.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedClassroom.section === "ANAOKULU" ? "Sınıf Öğretmeni: " : "Rehber Öğretmen: "}
                  <strong className="text-teal-900 font-bold">
                    {selectedClassroom.teacherStaff?.fullName || "Atanmadı"}
                  </strong>
                  {selectedClassroom.teacherStaff?.title && (
                    <span className="text-slate-500"> ({selectedClassroom.teacherStaff.title})</span>
                  )}
                  {selectedClassroom.roomNumber && ` • Derslik: ${selectedClassroom.roomNumber}`}
                  {` • Dönem: ${selectedClassroom.academicYear}`}
                </p>
              </div>

              {/* Aksiyon Butonları */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => openExportModal(selectedClassroom.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all"
                  title="Listeyi Excel veya Yazdır olarak al (Seçenekler)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Listeyi Al / İndir</span>
                </button>

                <button
                  onClick={() => setSelectedClassroom(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Hızlı İstatistik & Arama Çubuğu */}
            <div className="px-5 py-3 bg-slate-100/60 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-teal-100 text-teal-800 font-bold">
                  Mevcut: {selectedClassroom.students?.length || 0} / {selectedClassroom.capacity}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-pink-100 text-pink-700 font-semibold">
                  Kız: {selectedClassroom.students?.filter((s) => s.gender === "FEMALE").length || 0}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 font-semibold">
                  Erkek: {selectedClassroom.students?.filter((s) => s.gender === "MALE").length || 0}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-semibold">
                  Servis: {selectedClassroom.students?.filter((s) => s.serviceUsed).length || 0}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-semibold">
                  Yemek: {selectedClassroom.students?.filter((s) => s.mealUsed).length || 0}
                </span>
              </div>

              {/* Sınıf İçi Arama */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Sınıf içinde öğrenci / veli ara..."
                  value={modalStudentSearch}
                  onChange={(e) => setModalStudentSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Öğrenci Tablosu */}
            <div className="p-5 overflow-y-auto flex-1">
              {!selectedClassroom.students || selectedClassroom.students.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-600">Bu sınıfa henüz kayıtlı öğrenci bulunmuyor.</p>
                  <p className="text-[11px] text-slate-400">
                    Öğrenci kayıt sayfasından öğrencinin sınıfını seçerek buraya atayabilirsiniz.
                  </p>
                </div>
              ) : modalStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Arama kriterinize uygun öğrenci bulunamadı.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                        <th className="py-2.5 px-3 text-center w-12">#</th>
                        <th className="py-2.5 px-3">Öğrenci Bilgileri</th>
                        <th className="py-2.5 px-3 text-center">Cinsiyet</th>
                        <th className="py-2.5 px-3">Veli Bilgisi & İletişim</th>
                        <th className="py-2.5 px-3 text-center">Hizmetler</th>
                        <th className="py-2.5 px-3 text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {modalStudents.map((st, idx) => (
                        <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3">
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{st.fullName}</p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                                <span>No: <strong className="text-slate-600">{st.studentNo || "-"}</strong></span>
                                <span>•</span>
                                <span>TC: {st.tcNo}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {st.gender === "FEMALE" ? (
                              <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-semibold text-[10px]">
                                Kız
                              </span>
                            ) : st.gender === "MALE" ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold text-[10px]">
                                Erkek
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="space-y-0.5">
                              <p className="text-slate-700 font-medium">
                                {st.motherName ? `A: ${st.motherName}` : ""}
                                {st.fatherName ? `${st.motherName ? " / " : ""}B: ${st.fatherName}` : ""}
                                {!st.motherName && !st.fatherName && "Veli"}
                              </p>
                              <div className="flex items-center gap-1 text-[11px] font-mono text-teal-800 font-semibold">
                                <Phone className="w-3 h-3 text-teal-600" />
                                <span>{st.primaryPhone || "-"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {st.serviceUsed && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                                  Servis
                                </span>
                              )}
                              {st.mealUsed && (
                                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold">
                                  Yemek
                                </span>
                              )}
                              {!st.serviceUsed && !st.mealUsed && (
                                <span className="text-slate-400 text-[10px]">-</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Link
                              href={`/ogrenciler?search=${encodeURIComponent(st.fullName)}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold text-xs transition-colors"
                            >
                              <span>Kartı Gör</span>
                              <span>&rarr;</span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
