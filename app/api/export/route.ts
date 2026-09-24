import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { calculateOfficialSplit } from "@/lib/payroll-calculator";
import { calculateDuration } from "@/lib/date-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LEAVE_TYPE_MAP: Record<string, string> = {
  ANNUAL: "Yıllık Ücretli İzin",
  SICK: "Hastalık / Rapor",
  HOLIDAY_COMPENSATION: "Resmi Tatil Telafisi",
  EXCUSE: "Mazeret İzni",
  UNPAID: "Ücretsiz İzin",
};

const MONTH_NAMES = [
  "",
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "payroll"; // payroll, staff, cari, leave, full, all_cari, all_leaves
    const staffId = searchParams.get("staffId");
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const year = parseInt(searchParams.get("year") || String(currentYear));
    const month = parseInt(searchParams.get("month") || String(currentMonth));

    // 1. Aylık Bordro Export (.xlsx)
    if (type === "payroll") {
      const payrolls = await prisma.payroll.findMany({
        where: { year, month },
        include: {
          staff: {
            include: {
              departments: { include: { department: true } },
              salaryConfig: true,
            },
          },
        },
        orderBy: { staff: { fullName: "asc" } },
      });

      const data = payrolls.map((p, idx) => ({
        "Sıra No": idx + 1,
        "Personel Adı": p.staff.fullName,
        "TC Kimlik": p.staff.tcNo,
        Departman: p.staff.departments.map((d) => d.department.name).join(", "),
        Ünvan: p.staff.title || "-",
        "Ücret Tipi": p.staff.salaryConfig?.salaryType || "MONTHLY",
        "Çalışma Günü": p.workDays,
        "Rapor Günü": p.reportDays,
        "Ders Saati": p.lessonHours,
        "Resmi Tatil Günü": p.holidayWorkDays,
        "Tatil Tercihi": p.holidayChoice === "LEAVE_1_TO_1" ? "1'e 1 İzin" : "Çift Yevmiye",
        "Brüt Ücret": p.grossTotal,
        "Ek Ücretler (+)": p.bonusAmount,
        "Ek Ücret Açıklama": p.bonusDescription || "-",
        "Kesintiler (-)": p.deductionAmount,
        "Kesinti Açıklama": p.deductionDescription || "-",
        "Net Ödeme": p.netTotal,
        "Resmi Banka": p.officialAmount,
        "Gayriresmi / Elden": p.unofficialAmount,
        Durum: p.isPaid ? "ÖDENDİ" : "BEKLİYOR",
        "Ödeme Tarihi": p.paidDate ? p.paidDate.toISOString().split("T")[0] : "-",
        "IBAN Numarası": p.staff.iban || "-",
        "Banka Hesap Numarası": p.staff.accountNumber || "-",
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Bordro_${year}_${month}`);

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        headers: {
          "Content-Disposition": `attachment; filename="Bordro_${year}_${month}.xlsx"`,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }

    // 2. Personel Listesi Export (.xlsx)
    if (type === "staff") {
      const staffs = await prisma.staff.findMany({
        include: {
          departments: { include: { department: true } },
          salaryConfig: true,
        },
        orderBy: { fullName: "asc" },
      });

      const data = staffs.map((s, idx) => ({
        "Sıra No": idx + 1,
        "TC Kimlik": s.tcNo,
        "Ad Soyad": s.fullName,
        "Doğum Tarihi": s.birthDate ? s.birthDate.toISOString().split("T")[0] : "-",
        Telefon: s.phone || "-",
        "E-Posta": s.email || "-",
        IBAN: s.iban || "-",
        "Banka Hesap Numarası": s.accountNumber || "-",
        Ünvan: s.title || "-",
        Departman: s.departments.map((d) => d.department.name).join(", "),
        "İşe Giriş": s.hireDate ? s.hireDate.toISOString().split("T")[0] : "-",
        "SGK Başlangıç": s.sgkStartDate ? s.sgkStartDate.toISOString().split("T")[0] : "-",
        "MEB Atama Başlangıç": s.mebAssignmentDate ? s.mebAssignmentDate.toISOString().split("T")[0] : "-",
        "MEB Atama Türü": s.isMebPermanent ? "Süresiz" : "Belirli Süreli",
        "MEB Atama Bitiş": s.isMebPermanent ? "Süresiz" : (s.mebAssignmentEndDate ? s.mebAssignmentEndDate.toISOString().split("T")[0] : "-"),
        "Çalışma Süresi": s.hireDate ? calculateDuration(s.hireDate.toISOString(), new Date().toISOString()) : "-",
        "Ücret Tipi": s.salaryConfig?.salaryType || "MONTHLY",
        "Aylık Maaş": s.salaryConfig?.monthlySalary || 0,
        "Ders Saati Ücreti": s.salaryConfig?.hourlyRate || 0,
        "Günlük Ücret": s.salaryConfig?.dailyRate || 0,
        "Resmi Maaş Kısmı": s.salaryConfig?.officialSalaryPart || 0,
        Durum: s.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Personel_Listesi");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        headers: {
          "Content-Disposition": `attachment; filename="Personel_Listesi.xlsx"`,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }

    // 3. Tek Personel Cari Hesap Dökümü (İşe Başladığından Bugüne)
    if (type === "cari") {
      if (!staffId) return NextResponse.json({ error: "staffId parametresi gereklidir" }, { status: 400 });

      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        include: {
          departments: { include: { department: true } },
          salaryConfig: true,
          payrolls: { orderBy: [{ year: "asc" }, { month: "asc" }] },
        },
      });

      if (!staff) return NextResponse.json({ error: "Personel bulunamadı" }, { status: 404 });

      const cariRows = staff.payrolls.map((p, idx) => {
        const split = calculateOfficialSplit({
          netTotal: p.netTotal,
          monthlySalary: staff.salaryConfig?.monthlySalary || 0,
          year: p.year,
          month: p.month,
          hireDate: staff.hireDate,
          mebAssignmentDate: staff.mebAssignmentDate,
          sgkStartDate: staff.sgkStartDate,
          officialSalaryPart: staff.salaryConfig?.officialSalaryPart || 0,
          reportDays: p.reportDays,
        });

        return {
          "Sıra": idx + 1,
          "Yıl": p.year,
          "Ay": MONTH_NAMES[p.month] || p.month,
          "Çalışma Günü": p.workDays,
          "Ders Saati": p.lessonHours,
          "Rapor Günü": p.reportDays,
          "Temel Hakediş (TL)": p.grossTotal,
          "Ek Ücretler (+) (TL)": p.bonusAmount,
          "Ek Ücret Açıklamaları": p.bonusDescription || "-",
          "Kesintiler / Avanslar (-) (TL)": p.deductionAmount,
          "Kesinti Açıklamaları": p.deductionDescription || "-",
          "Net Ödenecek Tutar (TL)": p.netTotal,
          "Banka (Resmî) (TL)": split.officialAmount,
          "Elden (Nakit) (TL)": split.unofficialAmount,
          "Ödeme Durumu": p.isPaid ? "ÖDENDİ" : "BEKLİYOR",
          "Ödeme Tarihi": p.paidDate ? p.paidDate.toISOString().split("T")[0] : "-",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(cariRows);
      const workbook = XLSX.utils.book_new();
      const safeName = staff.fullName.replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/g, "_");
      XLSX.utils.book_append_sheet(workbook, worksheet, "Cari_Hesap_Ekstresi");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        headers: {
          "Content-Disposition": `attachment; filename="${safeName}_Cari_Hesap_Ekstresi.xlsx"`,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }

    // 4. Tek Personel İzin Dökümü (.xlsx)
    if (type === "leave") {
      if (!staffId) return NextResponse.json({ error: "staffId parametresi gereklidir" }, { status: 400 });

      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        include: {
          leaves: { orderBy: { startDate: "desc" } },
        },
      });

      if (!staff) return NextResponse.json({ error: "Personel bulunamadı" }, { status: 404 });

      const leaveRows = staff.leaves.map((l, idx) => ({
        "Sıra": idx + 1,
        "İzin Türü": LEAVE_TYPE_MAP[l.leaveType] || l.leaveType,
        "Başlangıç Tarihi": l.startDate.toISOString().split("T")[0],
        "Bitiş Tarihi": l.endDate.toISOString().split("T")[0],
        "Gün Sayısı": l.daysCount,
        "Açıklama": l.description || "-",
        "Onay Durumu": l.status === "APPROVED" ? "ONAYLANDI" : l.status === "REJECTED" ? "REDDEDİLDİ" : "BEKLİYOR",
        "Kayıt Tarihi": l.createdAt.toISOString().split("T")[0],
      }));

      const worksheet = XLSX.utils.json_to_sheet(leaveRows);
      const workbook = XLSX.utils.book_new();
      const safeName = staff.fullName.replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/g, "_");
      XLSX.utils.book_append_sheet(workbook, worksheet, "Izin_Dokumu");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        headers: {
          "Content-Disposition": `attachment; filename="${safeName}_Izin_Dokumu.xlsx"`,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }

    // 5. Tam Kapsamlı Personel Dosyası (Hepsi: Özet + Hesap Dökümü + İzin Dökümü - Tek Excelde 3 Sayfa)
    if (type === "full") {
      if (!staffId) return NextResponse.json({ error: "staffId parametresi gereklidir" }, { status: 400 });

      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        include: {
          departments: { include: { department: true } },
          salaryConfig: true,
          payrolls: { orderBy: [{ year: "asc" }, { month: "asc" }] },
          leaves: { orderBy: { startDate: "desc" } },
        },
      });

      if (!staff) return NextResponse.json({ error: "Personel bulunamadı" }, { status: 404 });

      // Sayfa 1: Personel Künyesi & Finansal Özet
      const totalNet = staff.payrolls.reduce((s, p) => s + p.netTotal, 0);
      const totalBank = staff.payrolls.reduce((s, p) => {
        const split = calculateOfficialSplit({
          netTotal: p.netTotal,
          monthlySalary: staff.salaryConfig?.monthlySalary || 0,
          year: p.year,
          month: p.month,
          hireDate: staff.hireDate,
          mebAssignmentDate: staff.mebAssignmentDate,
          sgkStartDate: staff.sgkStartDate,
          officialSalaryPart: staff.salaryConfig?.officialSalaryPart || 0,
          reportDays: p.reportDays,
        });
        return s + split.officialAmount;
      }, 0);
      const totalCash = totalNet - totalBank;
      const totalBonus = staff.payrolls.reduce((s, p) => s + p.bonusAmount, 0);
      const totalDeduction = staff.payrolls.reduce((s, p) => s + p.deductionAmount, 0);
      const totalPaid = staff.payrolls.filter((p) => p.isPaid).reduce((s, p) => s + p.netTotal, 0);
      const totalPending = totalNet - totalPaid;

      const profileData = [
        { "Bilgi Alanı": "Ad Soyad", Değer: staff.fullName },
        { "Bilgi Alanı": "TC Kimlik No", Değer: staff.tcNo },
        { "Bilgi Alanı": "Ünvan & Görev", Değer: staff.title || "-" },
        { "Bilgi Alanı": "Departman(lar)", Değer: staff.departments.map((d) => d.department.name).join(", ") },
        { "Bilgi Alanı": "Telefon", Değer: staff.phone || "-" },
        { "Bilgi Alanı": "E-Posta", Değer: staff.email || "-" },
        { "Bilgi Alanı": "IBAN Numarası", Değer: staff.iban || "-" },
        { "Bilgi Alanı": "Banka Hesap Numarası", Değer: staff.accountNumber || "-" },
        { "Bilgi Alanı": "İşe Başlama Tarihi", Değer: staff.hireDate ? staff.hireDate.toISOString().split("T")[0] : "-" },
        { "Bilgi Alanı": "Resmî SGK Başlangıç Tarihi", Değer: staff.sgkStartDate ? staff.sgkStartDate.toISOString().split("T")[0] : "-" },
        { "Bilgi Alanı": "MEB Atama Başlangıç Tarihi", Değer: staff.mebAssignmentDate ? staff.mebAssignmentDate.toISOString().split("T")[0] : "-" },
        { "Bilgi Alanı": "MEB Atama Süre Türü", Değer: staff.isMebPermanent ? "Süresiz" : "Belirli Süreli" },
        { "Bilgi Alanı": "MEB Atama Bitiş Tarihi", Değer: staff.isMebPermanent ? "Süresiz" : (staff.mebAssignmentEndDate ? staff.mebAssignmentEndDate.toISOString().split("T")[0] : "-") },
        { "Bilgi Alanı": "Toplam Çalışma Süresi", Değer: staff.hireDate ? calculateDuration(staff.hireDate.toISOString(), new Date().toISOString()) : "-" },
        { "Bilgi Alanı": "Ücret Modeli", Değer: staff.salaryConfig?.salaryType || "MONTHLY" },
        { "Bilgi Alanı": "Taban Aylık Maaş", Değer: staff.salaryConfig?.monthlySalary || 0 },
        { "Bilgi Alanı": "---", Değer: "---" },
        { "Bilgi Alanı": "TOPLAM NET HAKEDİŞ (TÜM ZAMANLAR)", Değer: totalNet },
        { "Bilgi Alanı": "BANKADAN YATAN TOPLAM", Değer: totalBank },
        { "Bilgi Alanı": "ELDEN NAKİT ÖDENEN TOPLAM", Değer: totalCash },
        { "Bilgi Alanı": "TOPLAM ALINAN PRİM & EK ÜCRET (+)", Değer: totalBonus },
        { "Bilgi Alanı": "TOPLAM KESİNTİ & AVANSLAR (-)", Değer: totalDeduction },
        { "Bilgi Alanı": "ÖDENMİŞ TOPLAM", Değer: totalPaid },
        { "Bilgi Alanı": "KALAN / BEKLEYEN BAKİYE", Değer: totalPending },
      ];

      // Sayfa 2: Aylık Hesap Dökümü
      const cariRows = staff.payrolls.map((p, idx) => {
        const split = calculateOfficialSplit({
          netTotal: p.netTotal,
          monthlySalary: staff.salaryConfig?.monthlySalary || 0,
          year: p.year,
          month: p.month,
          hireDate: staff.hireDate,
          mebAssignmentDate: staff.mebAssignmentDate,
          sgkStartDate: staff.sgkStartDate,
          officialSalaryPart: staff.salaryConfig?.officialSalaryPart || 0,
          reportDays: p.reportDays,
        });

        return {
          "Sıra": idx + 1,
          "Yıl": p.year,
          "Ay": MONTH_NAMES[p.month] || p.month,
          "Çalışma Günü": p.workDays,
          "Ders Saati": p.lessonHours,
          "Rapor Günü": p.reportDays,
          "Temel Hakediş (TL)": p.grossTotal,
          "Ek Ücretler (+) (TL)": p.bonusAmount,
          "Ek Ücret Açıklamaları": p.bonusDescription || "-",
          "Kesintiler (-) (TL)": p.deductionAmount,
          "Kesinti Açıklamaları": p.deductionDescription || "-",
          "Net Tutar (TL)": p.netTotal,
          "Banka (Resmî) (TL)": split.officialAmount,
          "Elden (Nakit) (TL)": split.unofficialAmount,
          "Ödeme Durumu": p.isPaid ? "ÖDENDİ" : "BEKLİYOR",
          "Ödeme Tarihi": p.paidDate ? p.paidDate.toISOString().split("T")[0] : "-",
        };
      });

      // Sayfa 3: İzin Dökümü
      const leaveRows = staff.leaves.map((l, idx) => ({
        "Sıra": idx + 1,
        "İzin Türü": LEAVE_TYPE_MAP[l.leaveType] || l.leaveType,
        "Başlangıç Tarihi": l.startDate.toISOString().split("T")[0],
        "Bitiş Tarihi": l.endDate.toISOString().split("T")[0],
        "Gün Sayısı": l.daysCount,
        "Açıklama": l.description || "-",
        "Onay Durumu": l.status === "APPROVED" ? "ONAYLANDI" : l.status === "REJECTED" ? "REDDEDİLDİ" : "BEKLİYOR",
      }));

      const workbook = XLSX.utils.book_new();
      const wsProfile = XLSX.utils.json_to_sheet(profileData);
      const wsCari = XLSX.utils.json_to_sheet(cariRows);
      const wsLeaves = XLSX.utils.json_to_sheet(leaveRows);

      XLSX.utils.book_append_sheet(workbook, wsProfile, "Personel_Ozeti");
      XLSX.utils.book_append_sheet(workbook, wsCari, "Hesap_Dokumu");
      XLSX.utils.book_append_sheet(workbook, wsLeaves, "Izin_Dokumu");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      const safeName = staff.fullName.replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/g, "_");

      return new NextResponse(buffer, {
        headers: {
          "Content-Disposition": `attachment; filename="${safeName}_Tam_Personel_Dosyasi.xlsx"`,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }

    // 6. TÜM Personellerin Kapsamlı Cari Özeti & Hareketleri (.xlsx)
    if (type === "all_cari") {
      const allStaff = await prisma.staff.findMany({
        include: {
          departments: { include: { department: true } },
          salaryConfig: true,
          payrolls: { orderBy: [{ year: "asc" }, { month: "asc" }] },
        },
        orderBy: { fullName: "asc" },
      });

      const summaryRows: any[] = [];
      const allTransactions: any[] = [];

      allStaff.forEach((staff, sIdx) => {
        const totalNet = staff.payrolls.reduce((s, p) => s + p.netTotal, 0);
        let totalBank = 0;
        let totalCash = 0;

        staff.payrolls.forEach((p, pIdx) => {
          const split = calculateOfficialSplit({
            netTotal: p.netTotal,
            monthlySalary: staff.salaryConfig?.monthlySalary || 0,
            year: p.year,
            month: p.month,
            hireDate: staff.hireDate,
            mebAssignmentDate: staff.mebAssignmentDate,
            sgkStartDate: staff.sgkStartDate,
            officialSalaryPart: staff.salaryConfig?.officialSalaryPart || 0,
            reportDays: p.reportDays,
          });

          totalBank += split.officialAmount;
          totalCash += split.unofficialAmount;

          allTransactions.push({
            "Personel Adı": staff.fullName,
            "TC Kimlik": staff.tcNo,
            "Departman": staff.departments.map((d) => d.department.name).join(", "),
            "Dönem": `${p.year}/${p.month}`,
            "Temel Hakediş (TL)": p.grossTotal,
            "Ek Ücretler (+)": p.bonusAmount,
            "Ek Ücret Açıklama": p.bonusDescription || "-",
            "Kesintiler (-)": p.deductionAmount,
            "Kesinti Açıklama": p.deductionDescription || "-",
            "Net Tutar (TL)": p.netTotal,
            "Banka (Resmî)": split.officialAmount,
            "Elden (Nakit)": split.unofficialAmount,
            "Durum": p.isPaid ? "ÖDENDİ" : "BEKLİYOR",
            "Ödeme Tarihi": p.paidDate ? p.paidDate.toISOString().split("T")[0] : "-",
          });
        });

        const totalBonus = staff.payrolls.reduce((s, p) => s + p.bonusAmount, 0);
        const totalDeduction = staff.payrolls.reduce((s, p) => s + p.deductionAmount, 0);
        const totalPaid = staff.payrolls.filter((p) => p.isPaid).reduce((s, p) => s + p.netTotal, 0);
        const totalPending = totalNet - totalPaid;

        summaryRows.push({
          "Sıra": sIdx + 1,
          "Personel Adı": staff.fullName,
          "TC Kimlik": staff.tcNo,
          "Departman": staff.departments.map((d) => d.department.name).join(", "),
          "Ünvan": staff.title || "-",
          "İşe Giriş": staff.hireDate ? staff.hireDate.toISOString().split("T")[0] : "-",
          "Dönem Sayısı": staff.payrolls.length,
          "Toplam Net Hakediş (TL)": totalNet,
          "Bankadan Yatan (TL)": totalBank,
          "Elden Ödenen (TL)": totalCash,
          "Toplam Prim (+)": totalBonus,
          "Toplam Kesinti (-)": totalDeduction,
          "Ödenen Tutar (TL)": totalPaid,
          "Kalan Bakiye (TL)": totalPending,
          "Durum": staff.status,
        });
      });

      const workbook = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      const wsTransactions = XLSX.utils.json_to_sheet(allTransactions);

      XLSX.utils.book_append_sheet(workbook, wsSummary, "Tum_Personeller_Cari_Ozet");
      XLSX.utils.book_append_sheet(workbook, wsTransactions, "Tum_Aylik_Hareketler");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        headers: {
          "Content-Disposition": `attachment; filename="Kurum_Genel_Cari_Dokumu.xlsx"`,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }

    return NextResponse.json({ error: "Geçersiz export tipi" }, { status: 400 });
  } catch (error: any) {
    console.error("Export hatası:", error);
    return NextResponse.json({ error: "Excel oluşturulamadı: " + error.message }, { status: 500 });
  }
}
