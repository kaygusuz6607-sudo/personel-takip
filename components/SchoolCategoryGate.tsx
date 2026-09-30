"use client";

import { useState, useEffect } from "react";
import { School, CheckCircle2, RefreshCw } from "lucide-react";

export type SchoolSectionType = "ANAOKULU" | "ILKOKUL" | "ORTAOKUL" | "LISE" | "KURS";

export const SCHOOL_CATEGORIES: {
  id: SchoolSectionType;
  label: string;
  shortLabel: string;
  desc: string;
  icon: string;
  defaultGrade: string;
}[] = [
  {
    id: "ANAOKULU",
    label: "Anaokulu / Okul Öncesi",
    shortLabel: "Anaokulu",
    desc: "2 Yaş, 3 Yaş, 4 Yaş ve 5 Yaş Hazırlık Grupları",
    icon: "🧸",
    defaultGrade: "2 Yaş (Oyun Grubu)",
  },
  {
    id: "ILKOKUL",
    label: "İlkokul (1 - 4. Sınıflar)",
    shortLabel: "İlkokul",
    desc: "1. Sınıf, 2. Sınıf, 3. Sınıf ve 4. Sınıf",
    icon: "🎒",
    defaultGrade: "1. Sınıf",
  },
  {
    id: "ORTAOKUL",
    label: "Ortaokul (5 - 8. Sınıflar)",
    shortLabel: "Ortaokul",
    desc: "5. Sınıf, 6. Sınıf, 7. Sınıf ve 8. Sınıf (LGS)",
    icon: "📚",
    defaultGrade: "5. Sınıf",
  },
  {
    id: "LISE",
    label: "Lise (9 - 12. Sınıflar)",
    shortLabel: "Lise",
    desc: "9. Sınıf, 10. Sınıf, 11. Sınıf ve 12. Sınıf (YKS)",
    icon: "🎓",
    defaultGrade: "9. Sınıf",
  },
  {
    id: "KURS",
    label: "Kurs / Etüt Merkezi",
    shortLabel: "Kurs & Etüt",
    desc: "LGS, YKS, Mezun ve Okul Takviye Grupları",
    icon: "🎯",
    defaultGrade: "8. Sınıf LGS Kursu",
  },
];

const STORAGE_KEY = "cosmos_school_section";

export function useSchoolCategory() {
  const [schoolSection, setSchoolSectionState] = useState<SchoolSectionType | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SchoolSectionType | null;
      if (saved && SCHOOL_CATEGORIES.some((c) => c.id === saved)) {
        setSchoolSectionState(saved);
      } else {
        setIsSelectorOpen(true);
      }
    } catch {
      setIsSelectorOpen(true);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const setSchoolSection = (sec: SchoolSectionType) => {
    try {
      localStorage.setItem(STORAGE_KEY, sec);
    } catch {}
    setSchoolSectionState(sec);
    setIsSelectorOpen(false);
  };

  const activeCategory =
    SCHOOL_CATEGORIES.find((c) => c.id === schoolSection) || SCHOOL_CATEGORIES[0];

  return {
    schoolSection: schoolSection || "ANAOKULU",
    hasSelectedCategory: Boolean(schoolSection),
    isLoaded,
    isSelectorOpen,
    setIsSelectorOpen,
    setSchoolSection,
    activeCategory,
  };
}

export function SchoolCategoryBadge({
  activeCategory,
  onOpenSelector,
}: {
  activeCategory: (typeof SCHOOL_CATEGORIES)[number];
  onOpenSelector: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpenSelector}
      title="Kurum kademesini değiştirmek için tıklayın"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100/80 border border-teal-200 text-teal-900 text-xs font-bold transition-all shadow-2xs"
    >
      <span className="text-base leading-none">{activeCategory.icon}</span>
      <span>Kurum: {activeCategory.shortLabel}</span>
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white text-teal-700 border border-teal-200 text-[10px] font-semibold">
        <RefreshCw className="w-2.5 h-2.5" />
        Değiştir
      </span>
    </button>
  );
}

export function SchoolCategoryModal({
  isOpen,
  currentSection,
  hasSelectedBefore,
  onSelect,
  onClose,
}: {
  isOpen: boolean;
  currentSection: SchoolSectionType | null;
  hasSelectedBefore: boolean;
  onSelect: (sec: SchoolSectionType) => void;
  onClose?: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 md:p-8 border border-slate-100 space-y-6 animate-in fade-in zoom-in duration-200">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-teal-800 text-white flex items-center justify-center mx-auto shadow-md">
            <School className="w-7 h-7 text-teal-300" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Bu Okul Hangi Kademede Hizmet Veriyor?
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Kurumunuzun eğitim kademesini bir kez seçin. Bundan sonra <strong>Aday Öğrenci (CRM)</strong> ve{" "}
            <strong>Öğrenci Kayıt</strong> ekranlarında size tekrar sorulmadan doğrudan bu kademe ile devam edilecektir.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SCHOOL_CATEGORIES.map((cat) => {
            const isSelected = currentSection === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelect(cat.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 group hover:shadow-md ${
                  isSelected
                    ? "border-teal-700 bg-teal-50/70 shadow-sm"
                    : "border-slate-200 bg-white hover:border-teal-500 hover:bg-slate-50/60"
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-white flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-extrabold text-slate-900 text-sm group-hover:text-teal-800">
                      {cat.label}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">{cat.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {hasSelectedBefore && onClose && (
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              Vazgeç
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
