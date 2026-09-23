"use client";

import { useState } from "react";
import { FileSpreadsheet, Download, Calendar, Users, DollarSign, CheckCircle2 } from "lucide-react";

export default function RaporlarPage() {
  const [year, setYear] = useState(2024);
  const [month, setMonth] = useState(8);

  const months = [
    { num: 1, name: "Ocak" },
    { num: 2, name: "Şubat" },
    { num: 3, name: "Mart" },
    { num: 4, name: "Nisan" },
    { num: 5, name: "Mayıs" },
    { num: 6, name: "Haziran" },
    { num: 7, name: "Temmuz" },
    { num: 8, name: "Ağustos" },
    { num: 9, name: "Eylül" },
    { num: 10, name: "Ekim" },
    { num: 11, name: "Kasım" },
    { num: 12, name: "Aralık" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Raporlar & Excel Aktarımı</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Resmi muhasebe dökümleri, personel listeleri ve banka ödeme tabloları
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aylık Bordro Tablosu İndir */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Aylık Bordro / Tahakkuk Tablosu</h2>
              <p className="text-xs text-slate-500 mt-1">
                Seçilen aya ait tüm personellerin çalışma günleri, raporları, ders saatleri, SGK kesintileri, net ödemeleri ve IBAN bilgileri içeren tam Excel dosyası.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>

              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-teal-800"
              >
                {months.map((m) => (
                  <option key={m.num} value={m.num}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <a
            href={`/api/export?type=payroll&year=${year}&month=${month}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{year} / {months.find(m => m.num === month)?.name} Bordrosunu İndir (.xlsx)</span>
          </a>
        </div>

        {/* Tüm Personel Listesi İndir */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Genel Personel & İletişim Listesi</h2>
              <p className="text-xs text-slate-500 mt-1">
                Kayıtlı tüm aktif ve pasif personellerin TC Kimlik, telefon, e-posta, doğum tarihi, işe giriş, MEB atama, SGK başlangıç ve ücret tanımlamaları.
              </p>
            </div>
          </div>

          <a
            href="/api/export?type=staff"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Tüm Personel Listesini İndir (.xlsx)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
