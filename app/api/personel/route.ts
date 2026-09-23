import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { tcNo: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (departmentId) {
      where.departments = {
        some: {
          departmentId: departmentId,
        },
      };
    }

    const staffs = await prisma.staff.findMany({
      where,
      include: {
        departments: {
          include: { department: true },
        },
        salaryConfig: true,
        leaves: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json(staffs);
  } catch (error) {
    console.error("Personel listesi hatası:", error);
    return NextResponse.json({ error: "Personeller getirilemedi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tcNo,
      fullName,
      birthDate,
      phone,
      email,
      iban,
      title,
      hireDate,
      terminationDate,
      mebAssignmentDate,
      unofficialWorkPeriod,
      sgkStartDate,
      notes,
      status = "ACTIVE",
      departmentIds = [],
      // Ücret yapılandırması
      salaryType = "MONTHLY",
      monthlySalary = 0,
      hourlyRate = 0,
      dailyRate = 0,
      officialSalaryPart = 0,
    } = body;

    if (!tcNo || !fullName) {
      return NextResponse.json(
        { error: "TC Kimlik No ve Ad Soyad zorunludur." },
        { status: 400 }
      );
    }

    // TC no benzersizlik kontrolü
    const existing = await prisma.staff.findUnique({
      where: { tcNo },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bu TC Kimlik numarasına ait bir personel zaten kayıtlı." },
        { status: 400 }
      );
    }

    const newStaff = await prisma.staff.create({
      data: {
        tcNo,
        fullName,
        birthDate: birthDate ? new Date(birthDate) : null,
        phone,
        email,
        iban,
        title,
        hireDate: hireDate ? new Date(hireDate) : new Date(),
        terminationDate: terminationDate ? new Date(terminationDate) : null,
        mebAssignmentDate: mebAssignmentDate ? new Date(mebAssignmentDate) : null,
        unofficialWorkPeriod,
        sgkStartDate: sgkStartDate ? new Date(sgkStartDate) : null,
        notes,
        status,
        salaryConfig: {
          create: {
            salaryType,
            monthlySalary: Number(monthlySalary) || 0,
            hourlyRate: Number(hourlyRate) || 0,
            dailyRate: Number(dailyRate) || 0,
            officialSalaryPart: Number(officialSalaryPart) || 0,
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

    return NextResponse.json(newStaff, { status: 201 });
  } catch (error: any) {
    console.error("Personel ekleme hatası:", error);
    return NextResponse.json(
      { error: error?.message || "Personel eklenirken hata oluştu" },
      { status: 500 }
    );
  }
}
