import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        departments: { include: { department: true } },
        salaryConfig: true,
        payrolls: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
        },
        leaves: {
          orderBy: { startDate: "desc" },
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Personel bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Personel detay hatası:", error);
    return NextResponse.json({ error: "Personel detayları alınamadı" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      tcNo,
      fullName,
      birthDate,
      phone,
      email,
      iban,
      accountNumber,
      title,
      hireDate,
      terminationDate,
      mebAssignmentDate,
      unofficialWorkPeriod,
      sgkStartDate,
      notes,
      status,
      departmentIds = [],
      // Ücret yapılandırması
      salaryType,
      monthlySalary,
      hourlyRate,
      dailyRate,
      officialSalaryPart,
    } = body;

    // Önce departman ilişkilerini güncelle
    await prisma.staffDepartment.deleteMany({
      where: { staffId: id },
    });

    const updated = await prisma.staff.update({
      where: { id },
      data: {
        tcNo,
        fullName,
        birthDate: birthDate ? new Date(birthDate) : null,
        phone,
        email,
        iban,
        accountNumber,
        title,
        hireDate: hireDate ? new Date(hireDate) : null,
        terminationDate: terminationDate ? new Date(terminationDate) : null,
        mebAssignmentDate: mebAssignmentDate ? new Date(mebAssignmentDate) : null,
        unofficialWorkPeriod,
        sgkStartDate: sgkStartDate ? new Date(sgkStartDate) : null,
        notes,
        status,
        salaryConfig: {
          upsert: {
            create: {
              salaryType: salaryType || "MONTHLY",
              monthlySalary: Number(monthlySalary) || 0,
              hourlyRate: Number(hourlyRate) || 0,
              dailyRate: Number(dailyRate) || 0,
              officialSalaryPart: Number(officialSalaryPart) || 0,
            },
            update: {
              salaryType: salaryType || "MONTHLY",
              monthlySalary: Number(monthlySalary) || 0,
              hourlyRate: Number(hourlyRate) || 0,
              dailyRate: Number(dailyRate) || 0,
              officialSalaryPart: Number(officialSalaryPart) || 0,
            },
          },
        },
        departments: {
          create: departmentIds.map((deptId: string) => ({
            departmentId: deptId,
          })),
        },
      },
      include: {
        departments: { include: { department: true } },
        salaryConfig: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Personel güncelleme hatası:", error);
    return NextResponse.json({ error: error?.message || "Güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.staff.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Personel silme hatası:", error);
    return NextResponse.json({ error: "Personel silinemedi" }, { status: 500 });
  }
}
