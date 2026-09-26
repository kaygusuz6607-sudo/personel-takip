import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { quoteId, recipientEmail, subject, customMessage } = body;

    if (!recipientEmail || !recipientEmail.includes("@")) {
      return NextResponse.json({ error: "Geçerli bir e-posta adresi giriniz" }, { status: 400 });
    }

    if (quoteId) {
      await prisma.priceQuote.update({
        where: { id: quoteId },
        data: {
          email: recipientEmail,
          status: "SENT",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Fiyat teklifi ${recipientEmail} adresine başarıyla iletildi.`,
    });
  } catch (error) {
    console.error("E-posta gönderme hatası:", error);
    return NextResponse.json({ error: "E-posta gönderilemedi" }, { status: 500 });
  }
}
