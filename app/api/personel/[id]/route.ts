import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncStaffPayrolls } from "@/lib/payroll-sync";

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
      phone2,
      email,
      iban,
      accountNumber,
      title,
      hireDate,
      terminationDate,
      mebAssignmentDate,
      mebAssignmentEndDate,
      isMebPermanent,
      isMebEndNotified,
      unofficialWorkPeriod,
      sgkStartDate,
      notes,
      status,
      photoUrl,
      departmentIds = [],
      // Ücret yapılandırması
      salaryType,
      monthlySalary,
      hourlyRate,
      dailyRate,
      officialSalaryPart,
    } = body;

    const existingStaff = await prisma.staff.findUnique({
      where: { id },
      include: { salaryConfig: true },
    });

    if (!existingStaff) {
      return NextResponse.json({ error: "Personel bulunamadı" }, { status: 404 });
    }

    if (departmentIds !== undefined && Array.isArray(departmentIds)) {
      await prisma.staffDepartment.deleteMany({
        where: { staffId: id },
      });
    }

    const isPermanent =
      isMebPermanent === undefined
        ? (existingStaff.isMebPermanent ?? true)
        : (isMebPermanent === true || isMebPermanent === "true");

    const updateData: any = {};
    if (tcNo !== undefined) updateData.tcNo = tcNo;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (birthDate !== undefined) updateData.birthDate = birthDate ? new Date(birthDate) : null;
    if (phone !== undefined) updateData.phone = phone;
    if (phone2 !== undefined) updateData.phone2 = phone2;
    if (email !== undefined) updateData.email = email;
    if (iban !== undefined) updateData.iban = iban;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
    if (title !== undefined) updateData.title = title;
    if (hireDate !== undefined) updateData.hireDate = hireDate ? new Date(hireDate) : null;
    if (terminationDate !== undefined) updateData.terminationDate = terminationDate ? new Date(terminationDate) : null;
    if (mebAssignmentDate !== undefined) {
      updateData.mebAssignmentDate = mebAssignmentDate ? new Date(mebAssignmentDate) : null;
      updateData.isMebPermanent = mebAssignmentDate ? isPermanent : false;
      if (mebAssignmentEndDate !== undefined) {
        updateData.mebAssignmentEndDate =
          mebAssignmentDate && !isPermanent && mebAssignmentEndDate ? new Date(mebAssignmentEndDate) : null;
      }
    }
    if (isMebEndNotified !== undefined) {
      updateData.isMebEndNotified = Boolean(isMebEndNotified);
    } else if (mebAssignmentEndDate !== undefined) {
      updateData.isMebEndNotified = false;
    }
    if (unofficialWorkPeriod !== undefined) updateData.unofficialWorkPeriod = unofficialWorkPeriod;
    if (sgkStartDate !== undefined) updateData.sgkStartDate = sgkStartDate ? new Date(sgkStartDate) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;

    const salaryCreateOrUpdate = {
      salaryType: salaryType !== undefined ? salaryType : (existingStaff.salaryConfig?.salaryType || "MONTHLY"),
      monthlySalary: monthlySalary !== undefined ? Number(monthlySalary) || 0 : (existingStaff.salaryConfig?.monthlySalary || 0),
      hourlyRate: hourlyRate !== undefined ? Number(hourlyRate) || 0 : (existingStaff.salaryConfig?.hourlyRate || 0),
      dailyRate: dailyRate !== undefined ? Number(dailyRate) || 0 : (existingStaff.salaryConfig?.dailyRate || 0),
      officialSalaryPart: officialSalaryPart !== undefined ? Number(officialSalaryPart) || 0 : (existingStaff.salaryConfig?.officialSalaryPart || 0),
    };

    const updated = await prisma.staff.update({
      where: { id },
      data: {
        ...updateData,
        salaryConfig: {
          upsert: {
            create: salaryCreateOrUpdate,
            update: salaryCreateOrUpdate,
          },
        },
        ...(departmentIds !== undefined && Array.isArray(departmentIds)
          ? {
              departments: {
                create: departmentIds.map((deptId: string) => ({
                  departmentId: deptId,
                })),
              },
            }
          : {}),
      },
      include: {
        departments: { include: { department: true } },
        salaryConfig: true,
      },
    });

    // Personelin açık/ödenmemiş bordrolarını ve cari hareketlerini güncel maaş ile anında eşleştir
    await syncStaffPayrolls(id, { createCurrentIfMissing: true });

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
