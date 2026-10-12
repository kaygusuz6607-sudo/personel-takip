"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FolderArchive,
  Upload,
  Download,
  Search,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  FileCheck,
  File,
  Image as ImageIcon,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  Building2,
  Users,
  Coins,
  GraduationCap,
  Landmark,
  Folder,
  X,
  Plus,
  ArrowUpDown,
  Tag,
  HardDrive,
  ExternalLink,
} from "lucide-react";

interface SchoolDocument {
  id: string;
  title: string;
  category: string;
  fileName: string;
  fileExtension: string;
  fileSize: number;
  fileSizeFormatted: string;
  mimeType: string;
  filePath?: string | null;
  description?: string | null;
  tags?: string | null;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { id: "ALL", label: "Tüm Evraklar", icon: FolderArchive, color: "teal" },
  { id: "Kayıt & Veli Evrakları", label: "Kayıt & Veli Evrakları", icon: FileText, color: "blue" },
  { id: "MEB & Resmi Yazışmalar", label: "MEB & Resmi Yazışmalar", icon: Landmark, color: "rose" },
  { id: "Personel & İK Evrakları", label: "Personel & İK Evrakları", icon: Users, color: "emerald" },
  { id: "Muhasebe & Mali Evraklar", label: "Muhasebe & Mali Evraklar", icon: Coins, color: "amber" },
  { id: "Eğitim & Rehberlik Evrakları", label: "Eğitim & Rehberlik Evrakları", icon: GraduationCap, color: "purple" },
  { id: "Kurumsal Şablonlar & Formlar", label: "Kurumsal Şablonlar", icon: Building2, color: "indigo" },
  { id: "Diğer Belgeler", label: "Diğer Belgeler", icon: Folder, color: "slate" },
];

export default function DosyalarPage() {
  const [documents, setDocuments] = useState<SchoolDocument[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtreler
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL"); // ALL, WORD, EXCEL, PDF, IMAGE
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");

  // Yükleme & Düzenleme Modalları
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<SchoolDocument | null>(null);

  // Upload Form State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("Kayıt & Veli Evrakları");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Edit Form State
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("Kayıt & Veli Evrakları");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Veri Çekme
  const fetchDocuments = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/dosyalar");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        setCategoryCounts(data.categoryCounts || {});
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error("Evraklar yüklenemedi:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Dosya Türü Meta (İkon, Renk, Etiket)
  const getFileTypeMeta = (ext: string) => {
    const e = (ext || "").toLowerCase();
    switch (e) {
      case "docx":
      case "doc":
        return {
          type: "WORD",
          label: "WORD",
          icon: FileText,
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          badge: "bg-blue-100 text-blue-800 border-blue-300",
          border: "border-blue-400",
        };
      case "xlsx":
      case "xls":
      case "csv":
        return {
          type: "EXCEL",
          label: "EXCEL",
          icon: FileSpreadsheet,
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
          border: "border-emerald-400",
        };
      case "pdf":
        return {
          type: "PDF",
          label: "PDF",
          icon: FileCheck,
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          badge: "bg-rose-100 text-rose-800 border-rose-300",
          border: "border-rose-400",
        };
      case "jpg":
      case "jpeg":
      case "png":
        return {
          type: "IMAGE",
          label: "RESİM",
          icon: ImageIcon,
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          badge: "bg-purple-100 text-purple-800 border-purple-300",
          border: "border-purple-400",
        };
      default:
        return {
          type: "OTHER",
          label: (e || "DOSYA").toUpperCase(),
          icon: File,
          bg: "bg-slate-50 text-slate-700 border-slate-200",
          badge: "bg-slate-100 text-slate-800 border-slate-300",
          border: "border-slate-400",
        };
    }
  };

  // Filtreleme
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Kategori
      if (selectedCategory !== "ALL" && doc.category !== selectedCategory) {
        return false;
      }

      // Dosya Türü
      if (selectedType !== "ALL") {
        const meta = getFileTypeMeta(doc.fileExtension);
        if (meta.type !== selectedType) return false;
      }

      // Arama
      if (searchTerm.trim() !== "") {
        const q = searchTerm.toLowerCase();
        const matchTitle = doc.title.toLowerCase().includes(q);
        const matchName = doc.fileName.toLowerCase().includes(q);
        const matchDesc = (doc.description || "").toLowerCase().includes(q);
        const matchTags = (doc.tags || "").toLowerCase().includes(q);
        if (!matchTitle && !matchName && !matchDesc && !matchTags) return false;
      }

      return true;
    });
  }, [documents, selectedCategory, selectedType, searchTerm]);

  // Dosya Seçimi Değiştiğinde
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setUploadFile(f);
      if (!uploadTitle) {
        const base = f.name.replace(/\.[^/.]+$/, "");
        setUploadTitle(base);
      }
    }
  };

  // Sürükle Bırak
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      setUploadFile(f);
      if (!uploadTitle) {
        const base = f.name.replace(/\.[^/.]+$/, "");
        setUploadTitle(base);
      }
    }
  };

  // Yükleme Gönder
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert("Lütfen bir dosya seçin.");
      return;
    }

    try {
      setIsUploading(true);
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("title", uploadTitle.trim() || uploadFile.name);
      fd.append("category", uploadCategory);
      fd.append("description", uploadDescription.trim());
      fd.append("tags", uploadTags.trim());

      const res = await fetch("/api/dosyalar", {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        setIsUploadModalOpen(false);
        setUploadFile(null);
        setUploadTitle("");
        setUploadDescription("");
        setUploadTags("");
        await fetchDocuments();
      } else {
        const err = await res.json();
        alert(err.error || "Yükleme başarısız.");
      }
    } catch {
      alert("Sunucu hatası oluştu.");
    } finally {
      setIsUploading(false);
    }
  };

  // Düzenleme Aç
  const openEditModal = (doc: SchoolDocument) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditCategory(doc.category);
    setEditDescription(doc.description || "");
    setEditTags(doc.tags || "");
    setIsEditModalOpen(true);
  };

  // Düzenleme Gönder
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    try {
      setIsEditing(true);
      const res = await fetch(`/api/dosyalar/${editingDoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          category: editCategory,
          description: editDescription,
          tags: editTags,
        }),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        setEditingDoc(null);
        await fetchDocuments();
      } else {
        const err = await res.json();
        alert(err.error || "Güncelleme başarısız.");
      }
    } catch {
      alert("Hata oluştu.");
    } finally {
      setIsEditing(false);
    }
  };

  // Dosya Sil
  const handleDeleteDoc = async (doc: SchoolDocument) => {
    if (!confirm(`"${doc.title}" isimli evrakı sistemden ve arşivden silmek istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/dosyalar/${doc.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchDocuments();
      } else {
        alert("Silinemedi.");
      }
    } catch {
      alert("Hata oluştu.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 md:p-6 lg:p-8 space-y-6">
      {/* ÜST BAŞLIK & İŞLEM BUTONLARI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-teal-600 to-indigo-700 text-white rounded-2xl shadow-md">
            <FolderArchive className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Evrak & Dosya Yönetim Merkezi
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                Okul Arşivi
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Word (.docx), Excel (.xlsx), PDF ve taranmış okul belgelerini kullanım alanlarına göre gruplandırıp dilediğiniz zaman tek tıkla indirin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchDocuments}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-teal-600" : ""}`} />
            <span>Yenile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setUploadFile(null);
              setUploadTitle("");
              setUploadDescription("");
              setUploadTags("");
              setIsUploadModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-sm hover:shadow transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>+ Yeni Evrak Yükle</span>
          </button>
        </div>
      </div>

      {/* KPI KARTLARI */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Toplam Evrak */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 block">Toplam Evrak</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{stats.totalCount} Adet</div>
            <span className="text-[10px] text-slate-400 font-medium">Arşivde Kayıtlı</span>
          </div>

          {/* Word (.docx) */}
          <div className="bg-white p-3.5 rounded-2xl border border-blue-200 shadow-2xs bg-gradient-to-b from-white to-blue-50/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-700">Word Belgeleri</span>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-black text-blue-900 mt-0.5">{stats.wordCount} Adet</div>
            <span className="text-[10px] text-blue-600 font-medium">.docx / .doc Şablonlar</span>
          </div>

          {/* Excel (.xlsx) */}
          <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-2xs bg-gradient-to-b from-white to-emerald-50/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700">Excel Tabloları</span>
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-emerald-900 mt-0.5">{stats.excelCount} Adet</div>
            <span className="text-[10px] text-emerald-600 font-medium">.xlsx / .xls Çizelgeler</span>
          </div>

          {/* PDF */}
          <div className="bg-white p-3.5 rounded-2xl border border-rose-200 shadow-2xs bg-gradient-to-b from-white to-rose-50/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700">PDF Evrakları</span>
              <FileCheck className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl font-black text-rose-900 mt-0.5">{stats.pdfCount} Adet</div>
            <span className="text-[10px] text-rose-600 font-medium">Resmi & İmzalı PDF'ler</span>
          </div>

          {/* Toplam Boyut */}
          <div className="bg-white p-3.5 rounded-2xl border border-purple-200 shadow-2xs bg-gradient-to-b from-white to-purple-50/20 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-700">Arşiv Boyutu</span>
              <HardDrive className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xl font-black text-purple-900 mt-0.5">{stats.totalSizeFormatted}</div>
            <span className="text-[10px] text-purple-600 font-medium">Bulut & Disk Depolama</span>
          </div>
        </div>
      )}

      {/* KULLANIM YERİNE GÖRE KATEGORİ SEKMELERİ */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSel = selectedCategory === cat.id;
            const count = cat.id === "ALL" ? documents.length : categoryCounts[cat.id] || 0;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                  isSel
                    ? "bg-teal-700 text-white shadow-2xs"
                    : "bg-slate-100/80 hover:bg-slate-200/80 text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isSel ? "bg-teal-800 text-teal-100" : "bg-white text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ARAMA VE DOSYA TÜRÜ FİLTRELERİ */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Evrak adı, dosya adı, etiket ara..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-teal-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1">
              {[
                { id: "ALL", label: "Tümü" },
                { id: "WORD", label: "Word (.docx)" },
                { id: "EXCEL", label: "Excel (.xlsx)" },
                { id: "PDF", label: "PDF" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedType === t.id
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="border-l border-slate-200 pl-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode("GRID")}
                className={`p-1.5 rounded-lg text-xs ${viewMode === "GRID" ? "bg-teal-100 text-teal-800" : "text-slate-400 hover:bg-slate-100"}`}
                title="Kart Görünümü"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("LIST")}
                className={`p-1.5 rounded-lg text-xs ${viewMode === "LIST" ? "bg-teal-100 text-teal-800" : "text-slate-400 hover:bg-slate-100"}`}
                title="Tablo Görünümü"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EVRAK LİSTESİ */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-600" />
          <p className="text-xs font-bold">Evraklar yükleniyor...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-4">
          <div className="p-4 rounded-full bg-slate-100 inline-block">
            <FolderArchive className="w-12 h-12 text-slate-300" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Henüz Bu Kategoriye Evrak Yüklenmedi</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Okulda kullanılan Word, Excel, PDF belgelerini yükleyerek arşivleyebilir veya sohbette bana gönderebilirsiniz; hemen ilgili kategoriye eklerim.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold rounded-xl shadow-2xs"
          >
            <Upload className="w-4 h-4" />
            <span>İlk Evrakı Yükle</span>
          </button>
        </div>
      ) : viewMode === "GRID" ? (
        /* ================= KART GÖRÜNÜMÜ ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map((doc) => {
            const meta = getFileTypeMeta(doc.fileExtension);
            const Icon = meta.icon;

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-2.5 rounded-xl border ${meta.bg}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${meta.badge}`}>
                        {meta.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => openEditModal(doc)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-2">
                      {doc.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate" title={doc.fileName}>
                      {doc.fileName}
                    </p>
                  </div>

                  {doc.description && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 bg-slate-50 p-2 rounded-lg">
                      {doc.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-medium">{doc.fileSizeFormatted}</span>
                    <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      {doc.category}
                    </span>
                  </div>

                  <a
                    href={`/api/dosyalar/${doc.id}/download`}
                    download={doc.fileName}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-extrabold rounded-xl shadow-2xs hover:shadow transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Dosyayı İndir</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= TABLO GÖRÜNÜMÜ ================= */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold">
                <tr>
                  <th className="py-3 px-4">Evrak Adı & Dosya</th>
                  <th className="py-3 px-3">Tür</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Boyut</th>
                  <th className="py-3 px-3">Yükleme Tarihi</th>
                  <th className="py-3 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocuments.map((doc) => {
                  const meta = getFileTypeMeta(doc.fileExtension);
                  const Icon = meta.icon;

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl border ${meta.bg}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block text-xs">
                              {doc.title}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono block">
                              {doc.fileName}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${meta.badge}`}>
                          {meta.label}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800">{doc.category}</span>
                      </td>

                      <td className="py-3 px-3 font-mono font-medium text-slate-600">
                        {doc.fileSizeFormatted}
                      </td>

                      <td className="py-3 px-3 text-slate-500">
                        {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("tr-TR") : "-"}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/api/dosyalar/${doc.id}/download`}
                            download={doc.fileName}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-extrabold text-[11px]"
                          >
                            <Download className="w-3 h-3" />
                            <span>İndir</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => openEditModal(doc)}
                            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg"
                            title="Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(doc)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: YENİ EVRAK YÜKLE ================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-teal-700 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-teal-200" />
                <h3 className="font-extrabold text-base">Yeni Evrak Yükle</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
              {/* Sürükle Bırak / Dosya Seç */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-teal-500 bg-teal-50/60"
                    : uploadFile
                    ? "border-emerald-400 bg-emerald-50/30"
                    : "border-slate-300 hover:border-teal-400 bg-slate-50/50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {uploadFile ? (
                  <div className="space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <span className="font-extrabold text-xs text-slate-800 block">
                      {uploadFile.name}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      ({(uploadFile.size / 1024).toFixed(1)} KB) • Dosyayı değiştirmek için tıklayın
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Upload className="w-8 h-8 text-teal-600 mx-auto" />
                    <span className="font-bold text-xs text-slate-700 block">
                      Dosyayı buraya sürükleyin veya <u>tıklayarak seçin</u>
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Word (.docx), Excel (.xlsx), PDF, Resim veya Arşiv dosyaları
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Evrak Başlığı / Görünen Ad *
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Örn: 2026-2027 Öğrenci Kayıt Sözleşmesi..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kullanım Alanı / Kategori *
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 focus:outline-teal-500"
                >
                  {CATEGORIES.filter((c) => c.id !== "ALL").map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Açıklama / Kullanım Notu (Opsiyonel)
                </label>
                <textarea
                  rows={2}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Bu belgenin ne zaman, hangi durumlarda kullanılacağı hakkında kısa not..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all disabled:opacity-50"
                >
                  {isUploading ? "Yükleniyor..." : "✓ Evrakı Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: EVRAK DÜZENLE ================= */}
      {isEditModalOpen && editingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-indigo-700 to-teal-700 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-base">Evrak Bilgilerini Düzenle</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Evrak Başlığı *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori *
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50"
                >
                  {CATEGORIES.filter((c) => c.id !== "ALL").map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all"
                >
                  {isEditing ? "Kaydediliyor..." : "Güncelle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
