import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      title,
      assetType,
      owner,
      inspectionDate,
      insuranceDate,
      kaskoDate,
      housingDate,
      notes,
    } = body;

    const updated = await prisma.assetTracking.update({
      where: { id },
      data: {
        title,
        assetType,
        owner,
        inspectionDate: inspectionDate ? new Date(inspectionDate) : null,
        insuranceDate: insuranceDate ? new Date(insuranceDate) : null,
        kaskoDate: kaskoDate ? new Date(kaskoDate) : null,
        housingDate: housingDate ? new Date(housingDate) : null,
        notes,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Varlık güncelleme hatası:", error);
    return NextResponse.json({ error: error?.message || "Güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.assetTracking.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Varlık silme hatası:", error);
    return NextResponse.json({ error: "Silinemedi" }, { status: 500 });
  }
}
