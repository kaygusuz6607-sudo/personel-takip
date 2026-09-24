import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "payroll"; // payroll, staff, bank
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const year = parseInt(searchParams.get("year") || String(currentYear));
    const month = parseInt(searchParams.get("month") || String(currentMonth));

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
        "SGK Kesintisi": p.sgkEmployee,
        "İşsizlik Kesintisi": p.unemploymentEmployee,
        "Gelir Vergisi": p.incomeTax,
        "Damga Vergisi": p.stampTax,
        "Toplam Kesinti": p.totalDeductions,
        "Net Ödeme": p.netTotal,
        "Resmi Banka": p.officialAmount,
        "Gayriresmi / Elden": p.unofficialAmount,
        Durum: p.isPaid ? "ÖDENDİ" : "BEKLİYOR",
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

    return NextResponse.json({ error: "Geçersiz export tipi" }, { status: 400 });
  } catch (error) {
    console.error("Export hatası:", error);
    return NextResponse.json({ error: "Excel oluşturulamadı" }, { status: 500 });
  }
}
