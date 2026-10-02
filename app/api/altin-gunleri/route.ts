import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TR_MONTHS = [
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

function formatDateStr(day: number, month: number, year: number): string {
  return `${day} ${TR_MONTHS[month] || month} ${year}`;
}

function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function checkIsUserTurn(name: string): boolean {
  if (!name) return false;
  const n = name.toLowerCase().trim();
  return (
    n.includes("muhammed") ||
    n.includes("muhammet") ||
    n.includes("maç") ||
    n.includes("mac")
  );
}

function parseDaysList(daysInput: any): number[] {
  if (Array.isArray(daysInput)) {
    const parsed = daysInput
      .map((d) => parseInt(String(d), 10))
      .filter((d) => !isNaN(d) && d >= 1 && d <= 31);
    if (parsed.length > 0) {
      return Array.from(new Set(parsed)).sort((a, b) => a - b);
    }
  } else if (typeof daysInput === "string" && daysInput.trim()) {
    const parts = daysInput
      .split(/[,;\s]+/)
      .map((p) => parseInt(p.trim(), 10))
      .filter((d) => !isNaN(d) && d >= 1 && d <= 31);
    if (parts.length > 0) {
      return Array.from(new Set(parts)).sort((a, b) => a - b);
    }
  }
  return [1, 10, 20]; // Varsayılan: 1, 10, 20 (Ayda 3 kez)
}

function calculateRoundDate(
  roundIndex: number, // 1-indexed (1, 2, 3...)
  days: number[], // e.g. [1, 10, 20]
  sYear: number,
  sMonth: number
): { date: Date; year: number; month: number; day: number; dueDateStr: string } {
  const K = Math.max(1, days.length);
  const zeroIndex = roundIndex - 1;
  const monthOffset = Math.floor(zeroIndex / K);
  const dayIndex = zeroIndex % K;

  const targetMonthOffset = sMonth - 1 + monthOffset;
  const rYear = sYear + Math.floor(targetMonthOffset / 12);
  const rMonth = (targetMonthOffset % 12) + 1;

  const targetDay = days[dayIndex];
  const lastDay = new Date(rYear, rMonth, 0).getDate();
  const safeDay = Math.min(targetDay, lastDay);

  const date = new Date(rYear, rMonth - 1, safeDay, 12, 0, 0);
  const dueDateStr = formatDateStr(safeDay, rMonth, rYear);

  return { date, year: rYear, month: rMonth, day: safeDay, dueDateStr };
}

export async function GET() {
  try {
    const groups = await prisma.goldDayGroup.findMany({
      include: {
        rounds: {
          orderBy: { roundIndex: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const todayISO = getTodayISO();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRounds: any[] = [];
    const upcomingRounds: any[] = [];

    let totalCommitment = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let totalUserTurnAmount = 0;

    for (const group of groups) {
      for (const round of group.rounds) {
        totalCommitment += round.userAmountToPay;
        totalPaid += round.paidAmount;
        if (!round.isPaid) {
          totalRemaining += round.userAmountToPay;
        }
        if (round.isUserTurn) {
          totalUserTurnAmount += round.goldAmount;
        }

        if (!round.isPaid) {
          const roundDate = new Date(round.dueDate);
          roundDate.setHours(0, 0, 0, 0);
          const rISO = `${roundDate.getFullYear()}-${String(roundDate.getMonth() + 1).padStart(2, "0")}-${String(roundDate.getDate()).padStart(2, "0")}`;

          const diffDays = Math.round((roundDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          const itemWithGroup = {
            ...round,
            groupTitle: group.title,
            goldTypeLabel: group.goldTypeLabel || group.goldType,
            totalMembers: group.totalMembers,
            daysLeft: diffDays,
          };

          if (rISO === todayISO || diffDays === 0) {
            todayRounds.push(itemWithGroup);
          } else if (diffDays > 0 && diffDays <= 3) {
            upcomingRounds.push(itemWithGroup);
          }
        }
      }
    }

    return NextResponse.json({
      groups,
      todayRounds,
      upcomingRounds,
      stats: {
        totalGroups: groups.length,
        totalCommitment: Number(totalCommitment.toFixed(2)),
        totalPaid: Number(totalPaid.toFixed(2)),
        totalRemaining: Number(totalRemaining.toFixed(2)),
        totalUserTurnAmount: Number(totalUserTurnAmount.toFixed(2)),
      },
    });
  } catch (error: any) {
    console.error("Altın günleri listesi alınırken hata:", error);
    return NextResponse.json({ error: error.message || "Liste alınamadı" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      goldType = "AJDA_BILEZIK",
      goldTypeLabel = "Ajda Bilezik",
      totalMembers = 26,
      userShareCount = 1,
      defaultAmount = 63150,
      meetingFrequency = "THRICE_MONTHLY",
      daysList = "1,10,20",
      dayOfMonth = 1,
      startYear = 2026,
      startMonth = 10,
      notes = "",
      memberNames = [],
      customRounds = null,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Grup adı zorunludur" }, { status: 400 });
    }

    const tMembers = Math.max(2, Number(totalMembers) || 26);
    const uShares = Math.max(1, Number(userShareCount) || 1);
    const defAmt = Math.max(0, Number(defaultAmount) || 0);
    const sYear = Number(startYear) || 2026;
    const sMonth = Number(startMonth) || 10;

    const parsedDays = parseDaysList(daysList || (dayOfMonth ? [dayOfMonth] : [1, 10, 20]));
    const daysStr = parsedDays.join(",");
    const primaryDay = parsedDays[0] || (Number(dayOfMonth) || 1);

    // 1. Grubu Oluştur
    const group = await prisma.goldDayGroup.create({
      data: {
        title: title.trim(),
        goldType,
        goldTypeLabel,
        totalMembers: tMembers,
        userShareCount: uShares,
        defaultAmount: defAmt,
        meetingFrequency,
        daysList: daysStr,
        dayOfMonth: primaryDay,
        startYear: sYear,
        startMonth: sMonth,
        notes: notes || "",
        status: "ACTIVE",
      },
    });

    // 2. Turları (Rounds) ve Okul Giderleri Taksit Kayıtlarını Oluştur
    const isCeyrek = goldType === "CEYREK_ALTIN";
    const payingMembersCount = tMembers - 1; // Gün sahibi ödeme yapmaz!
    const perMemberAmount = isCeyrek
      ? defAmt
      : (payingMembersCount > 0 ? Number((defAmt / payingMembersCount).toFixed(2)) : 0);
    const poolGoldAmount = isCeyrek ? defAmt * payingMembersCount : defAmt;

    const roundsToCreate: any[] = [];

    if (Array.isArray(customRounds) && customRounds.length > 0) {
      // Özel tanımlı turlar
      for (let i = 0; i < customRounds.length; i++) {
        const cr = customRounds[i];
        const roundIndex = i + 1;
        const recipientName = cr.recipientName || `Katılımcı ${roundIndex}`;
        const isUserTurn =
          Boolean(cr.isUserTurn) || checkIsUserTurn(recipientName);

        const roundPayingCount = tMembers - 1;
        const goldAmount = isCeyrek
          ? (Number(cr.goldAmount) > defAmt ? Number(cr.goldAmount) : defAmt * roundPayingCount)
          : (Number(cr.goldAmount) || defAmt);
        const roundPerMember = isCeyrek
          ? defAmt
          : (roundPayingCount > 0 ? Number((goldAmount / roundPayingCount).toFixed(2)) : 0);

        // Muhammed Ali'nin bu tur ödeyeceği hisse sayısı:
        // Eğer gün sırası kendisindeyse katıldığı 5 hisseden 1'i ödemez, kalan 4 hissesi öder!
        const effectiveUserShares = isUserTurn ? Math.max(0, uShares - 1) : uShares;
        const userAmountToPay = Number((roundPerMember * effectiveUserShares).toFixed(2));

        const rDueDate = cr.dueDate
          ? new Date(cr.dueDate)
          : calculateRoundDate(roundIndex, parsedDays, sYear, sMonth).date;
        const rYear = rDueDate.getFullYear();
        const rMonth = rDueDate.getMonth() + 1;
        const rDueDateStr = formatDateStr(rDueDate.getDate(), rMonth, rYear);

        roundsToCreate.push({
          roundIndex,
          dueDate: rDueDate,
          dueDateStr: rDueDateStr,
          year: rYear,
          month: rMonth,
          recipientName,
          isUserTurn,
          goldAmount,
          payingMembersCount: roundPayingCount,
          perMemberAmount: roundPerMember,
          userShareCount: effectiveUserShares,
          userAmountToPay,
          isPaid: Boolean(cr.isPaid),
          paidDate: cr.isPaid ? new Date() : null,
          paidAmount: cr.isPaid ? userAmountToPay : 0,
          notes: cr.notes || "",
        });
      }
    } else {
      // Otomatik Turları Oluştur (Ayda 1, 2 veya 3 kez belirlenen günlere dağıtarak)
      for (let i = 0; i < tMembers; i++) {
        const roundIndex = i + 1;
        const { date: rDueDate, year: rYear, month: rMonth, day: rDay, dueDateStr: rDueDateStr } =
          calculateRoundDate(roundIndex, parsedDays, sYear, sMonth);

        const recipientName =
          Array.isArray(memberNames) && memberNames[i] && String(memberNames[i]).trim()
            ? String(memberNames[i]).trim()
            : `Katılımcı ${roundIndex}`;

        const isUserTurn = checkIsUserTurn(recipientName);

        // Muhammed Ali sıra kendisindeyse 1 eksik hisse öder
        const effectiveUserShares = isUserTurn ? Math.max(0, uShares - 1) : uShares;
        const userAmountToPay = Number((perMemberAmount * effectiveUserShares).toFixed(2));
        const roundGoldAmount = poolGoldAmount;

        roundsToCreate.push({
          roundIndex,
          dueDate: rDueDate,
          dueDateStr: rDueDateStr,
          year: rYear,
          month: rMonth,
          recipientName,
          isUserTurn,
          goldAmount: roundGoldAmount,
          payingMembersCount,
          perMemberAmount,
          userShareCount: effectiveUserShares,
          userAmountToPay,
          isPaid: false,
          notes: isUserTurn
            ? (isCeyrek
                ? `🎉 Gün Sırası Muhammed Ali'de — Toplam ${payingMembersCount} Çeyrek (₺${roundGoldAmount.toLocaleString("tr-TR")}) teslim alınacak (${effectiveUserShares} hisse ödenecek)`
                : `🎉 Gün Sırası Muhammed Ali'de — Toplam ₺${defAmt.toLocaleString("tr-TR")} teslim alınacak (${effectiveUserShares} hisse ödenecek)`)
            : "",
        });
      }
    }

    // 3. Turları Veritabanına Yaz ve Her Biri İçin SchoolExpense Kaydı Oluştur
    for (const rData of roundsToCreate) {
      let expenseId: string | null = null;

      try {
        const userTurnNote = rData.isUserTurn
          ? ` (Muhammed Ali Sırası - ${rData.userShareCount} Hisse)`
          : ` (${rData.userShareCount} Hisse)`;

        const dayNum = rData.dueDate.getDate();
        const expenseDesc = isCeyrek
          ? `Altın Günü | Grup: ${group.title} | Sıra: ${rData.recipientName}${userTurnNote} | Kişi Başı: 1 Çeyrek (₺${rData.perMemberAmount.toLocaleString("tr-TR")}) | Toplam Altın: ${rData.payingMembersCount} Çeyrek (₺${rData.goldAmount.toLocaleString("tr-TR")})`
          : `Altın Günü | Grup: ${group.title} | Sıra: ${rData.recipientName}${userTurnNote} | Toplam Altın: ₺${rData.goldAmount.toLocaleString("tr-TR")} (${rData.payingMembersCount} kişi) | Kişi Başı: ₺${rData.perMemberAmount.toLocaleString("tr-TR")}`;

        const expense = await prisma.schoolExpense.create({
          data: {
            title: `🪙 Altın Günü: ${group.title} (Sıra: ${rData.recipientName})`,
            category: "GOLD_DAY",
            subCategory: group.goldTypeLabel || group.goldType,
            period: `${rData.month}.Ay (${dayNum}. Gün)`,
            installmentInfo: `${rData.roundIndex}t/${tMembers}t`,
            dueDate: rData.dueDate,
            dueDateStr: rData.dueDateStr,
            amountDue: rData.userAmountToPay,
            amountPaid: rData.isPaid ? rData.userAmountToPay : 0,
            amountRemaining: rData.isPaid ? 0 : rData.userAmountToPay,
            status: rData.isPaid ? "PAID" : "PENDING",
            periodStatus: "Cari Dönem",
            paymentMethod: "CASH", // Altın günü kesinlikle NAKİT ödenir
            monthIndex: rData.month,
            description: expenseDesc,
          },
        });
        expenseId = expense.id;
      } catch (expErr) {
        console.error("Altın günü SchoolExpense oluşturma hatası:", expErr);
      }

      await prisma.goldDayRound.create({
        data: {
          groupId: group.id,
          ...rData,
          expenseId,
        },
      });
    }

    const createdGroup = await prisma.goldDayGroup.findUnique({
      where: { id: group.id },
      include: {
        rounds: { orderBy: { roundIndex: "asc" } },
      },
    });

    return NextResponse.json(createdGroup, { status: 201 });
  } catch (error: any) {
    console.error("Altın günü grubu oluşturulurken hata:", error);
    return NextResponse.json({ error: error.message || "Grup oluşturulamadı" }, { status: 500 });
  }
}

// Tur durumunu güncelleme (Nakit Ödendi / Bekliyor veya Tutar Revizyonu)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      roundId,
      groupId,
      action = "UPDATE_ROUND", // "UPDATE_ROUND" | "TOGGLE_PAID" | "UPDATE_GOLD_AMOUNT" | "UPDATE_GROUP"
      isPaid,
      goldAmount,
      recipientName,
      dueDate,
      notes,
    } = body;

    if (action === "TOGGLE_PAID" && roundId) {
      const round = await prisma.goldDayRound.findUnique({ where: { id: roundId } });
      if (!round) return NextResponse.json({ error: "Tur bulunamadı" }, { status: 404 });

      const newIsPaid = isPaid !== undefined ? Boolean(isPaid) : !round.isPaid;
      const updated = await prisma.goldDayRound.update({
        where: { id: roundId },
        data: {
          isPaid: newIsPaid,
          paidDate: newIsPaid ? new Date() : null,
          paidAmount: newIsPaid ? round.userAmountToPay : 0,
        },
      });

      // Eşleşen SchoolExpense kaydını da güncelle
      if (round.expenseId) {
        try {
          await prisma.schoolExpense.update({
            where: { id: round.expenseId },
            data: {
              status: newIsPaid ? "PAID" : "PENDING",
              amountPaid: newIsPaid ? round.userAmountToPay : 0,
              amountRemaining: newIsPaid ? 0 : round.userAmountToPay,
            },
          });
        } catch {}
      }

      return NextResponse.json(updated);
    }

    if (action === "UPDATE_ROUND" && roundId) {
      const round = await prisma.goldDayRound.findUnique({
        where: { id: roundId },
        include: { group: true },
      });
      if (!round) return NextResponse.json({ error: "Tur bulunamadı" }, { status: 404 });

      const newRecipient = recipientName !== undefined ? recipientName.trim() : round.recipientName;
      const isUserTurn =
        body.isUserTurn !== undefined
          ? Boolean(body.isUserTurn)
          : checkIsUserTurn(newRecipient);

      const isCeyrek = round.group.goldType === "CEYREK_ALTIN";
      const payingCount = round.group.totalMembers - 1;
      const defAmt = round.group.defaultAmount;
      const newGoldAmount = isCeyrek
        ? (goldAmount !== undefined && Number(goldAmount) > defAmt ? Number(goldAmount) : defAmt * payingCount)
        : (goldAmount !== undefined ? Math.max(0, Number(goldAmount)) : round.goldAmount);
      const perMember = isCeyrek
        ? defAmt
        : (payingCount > 0 ? Number((newGoldAmount / payingCount).toFixed(2)) : 0);
      const effectiveUserShares = isUserTurn
        ? Math.max(0, round.group.userShareCount - 1)
        : round.group.userShareCount;
      const userAmount = Number((perMember * effectiveUserShares).toFixed(2));

      let newDueDate = round.dueDate;
      let newDueDateStr = round.dueDateStr;
      let newYear = round.year;
      let newMonth = round.month;

      if (dueDate) {
        newDueDate = new Date(dueDate);
        newYear = newDueDate.getFullYear();
        newMonth = newDueDate.getMonth() + 1;
        newDueDateStr = formatDateStr(newDueDate.getDate(), newMonth, newYear);
      }

      const finalIsPaid = isPaid !== undefined ? Boolean(isPaid) : round.isPaid;

      const updated = await prisma.goldDayRound.update({
        where: { id: roundId },
        data: {
          recipientName: newRecipient,
          isUserTurn,
          goldAmount: newGoldAmount,
          perMemberAmount: perMember,
          userShareCount: effectiveUserShares,
          userAmountToPay: userAmount,
          dueDate: newDueDate,
          dueDateStr: newDueDateStr,
          year: newYear,
          month: newMonth,
          isPaid: finalIsPaid,
          paidDate: finalIsPaid ? (round.paidDate || new Date()) : null,
          paidAmount: finalIsPaid ? userAmount : 0,
          notes: notes !== undefined ? notes : round.notes,
        },
      });

      // SchoolExpense senkronizasyonu
      if (round.expenseId) {
        try {
          const roundExpDesc = isCeyrek
            ? `Altın Günü | Grup: ${round.group.title} | Sıra: ${newRecipient} | Kişi Başı: 1 Çeyrek (₺${perMember.toLocaleString("tr-TR")}) | Toplam Altın: ${payingCount} Çeyrek (₺${newGoldAmount.toLocaleString("tr-TR")}) | Muhammed Ali (${effectiveUserShares} Hisse)`
            : `Altın Günü | Grup: ${round.group.title} | Sıra: ${newRecipient} | Toplam Altın: ₺${newGoldAmount.toLocaleString("tr-TR")} / ${payingCount} kişi | Muhammed Ali (${effectiveUserShares} Hisse)`;

          await prisma.schoolExpense.update({
            where: { id: round.expenseId },
            data: {
              title: `🪙 Altın Günü: ${round.group.title} (Sıra: ${newRecipient})`,
              dueDate: newDueDate,
              dueDateStr: newDueDateStr,
              amountDue: userAmount,
              amountRemaining: finalIsPaid ? 0 : userAmount,
              amountPaid: finalIsPaid ? userAmount : 0,
              status: finalIsPaid ? "PAID" : "PENDING",
              monthIndex: newMonth,
              period: `${newMonth}.Ay`,
              description: roundExpDesc,
            },
          });
        } catch {}
      }

      return NextResponse.json(updated);
    }

    if (action === "UPDATE_GROUP" && groupId) {
      const {
        title,
        notes: groupNotes,
        defaultAmount,
        daysList: newDaysList,
        meetingFrequency: newFreq,
        startYear: newStartYear,
        startMonth: newStartMonth,
      } = body;

      const updatedGroup = await prisma.goldDayGroup.update({
        where: { id: groupId },
        data: {
          ...(title ? { title: title.trim() } : {}),
          ...(groupNotes !== undefined ? { notes: groupNotes } : {}),
          ...(defaultAmount !== undefined ? { defaultAmount: Number(defaultAmount) || 0 } : {}),
          ...(newDaysList !== undefined ? { daysList: newDaysList } : {}),
          ...(newFreq !== undefined ? { meetingFrequency: newFreq } : {}),
          ...(newStartYear !== undefined ? { startYear: Number(newStartYear) } : {}),
          ...(newStartMonth !== undefined ? { startMonth: Number(newStartMonth) } : {}),
        },
      });
      return NextResponse.json(updatedGroup);
    }

    if (action === "REDISTRIBUTE_DATES" && groupId) {
      const {
        daysList: newDaysList,
        startYear: newStartYear,
        startMonth: newStartMonth,
        meetingFrequency: newFreq,
      } = body;

      const group = await prisma.goldDayGroup.findUnique({
        where: { id: groupId },
        include: { rounds: { orderBy: { roundIndex: "asc" } } },
      });
      if (!group) return NextResponse.json({ error: "Grup bulunamadı" }, { status: 404 });

      const parsedDays = parseDaysList(newDaysList || group.daysList || [1, 10, 20]);
      const sYear = newStartYear ? Number(newStartYear) : group.startYear;
      const sMonth = newStartMonth ? Number(newStartMonth) : group.startMonth;
      const daysStr = parsedDays.join(",");

      await prisma.goldDayGroup.update({
        where: { id: groupId },
        data: {
          daysList: daysStr,
          dayOfMonth: parsedDays[0] || 1,
          startYear: sYear,
          startMonth: sMonth,
          ...(newFreq ? { meetingFrequency: newFreq } : {}),
        },
      });

      for (const round of group.rounds) {
        const { date: rDueDate, year: rYear, month: rMonth, day: rDay, dueDateStr: rDueDateStr } =
          calculateRoundDate(round.roundIndex, parsedDays, sYear, sMonth);

        await prisma.goldDayRound.update({
          where: { id: round.id },
          data: {
            dueDate: rDueDate,
            dueDateStr: rDueDateStr,
            year: rYear,
            month: rMonth,
          },
        });

        if (round.expenseId) {
          try {
            await prisma.schoolExpense.update({
              where: { id: round.expenseId },
              data: {
                dueDate: rDueDate,
                dueDateStr: rDueDateStr,
                monthIndex: rMonth,
                period: `${rMonth}.Ay (${rDay}. Gün)`,
              },
            });
          } catch {}
        }
      }

      const refreshed = await prisma.goldDayGroup.findUnique({
        where: { id: groupId },
        include: { rounds: { orderBy: { roundIndex: "asc" } } },
      });
      return NextResponse.json(refreshed);
    }

    if (action === "UPDATE_ROUND_DATE" && roundId && dueDate) {
      const round = await prisma.goldDayRound.findUnique({
        where: { id: roundId },
        include: { group: true },
      });
      if (!round) return NextResponse.json({ error: "Tur bulunamadı" }, { status: 404 });

      const d = new Date(dueDate);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
      }
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const dueDateStr = formatDateStr(d.getDate(), month, year);

      const updated = await prisma.goldDayRound.update({
        where: { id: roundId },
        data: {
          dueDate: d,
          dueDateStr,
          year,
          month,
        },
      });

      if (round.expenseId) {
        try {
          await prisma.schoolExpense.update({
            where: { id: round.expenseId },
            data: {
              dueDate: d,
              dueDateStr,
              monthIndex: month,
              period: `${month}.Ay (${d.getDate()}. Gün)`,
            },
          });
        } catch {}
      }

      return NextResponse.json(updated);
    }

    if (action === "BULK_UPDATE_ROUNDS" && groupId && Array.isArray(body.rounds)) {
      const group = await prisma.goldDayGroup.findUnique({
        where: { id: groupId },
      });
      if (!group) return NextResponse.json({ error: "Grup bulunamadı" }, { status: 404 });

      if (body.daysList !== undefined || body.meetingFrequency !== undefined) {
        await prisma.goldDayGroup.update({
          where: { id: groupId },
          data: {
            ...(body.daysList !== undefined ? { daysList: body.daysList } : {}),
            ...(body.meetingFrequency !== undefined ? { meetingFrequency: body.meetingFrequency } : {}),
          },
        });
      }

      const isCeyrek = group.goldType === "CEYREK_ALTIN";
      const payingCount = group.totalMembers - 1;
      const defAmt = group.defaultAmount;

      for (const item of body.rounds) {
        if (!item.id) continue;
        const recipientName = (item.recipientName || "").trim() || "Katılımcı";
        const isUserTurn =
          item.isUserTurn !== undefined
            ? Boolean(item.isUserTurn)
            : checkIsUserTurn(recipientName);

        const goldAmount = isCeyrek
          ? (Number(item.goldAmount) > defAmt ? Number(item.goldAmount) : defAmt * payingCount)
          : Math.max(0, Number(item.goldAmount) || defAmt);
        const perMember = isCeyrek
          ? defAmt
          : (payingCount > 0 ? Number((goldAmount / payingCount).toFixed(2)) : 0);
        const effectiveUserShares = isUserTurn
          ? Math.max(0, group.userShareCount - 1)
          : group.userShareCount;
        const userAmount = Number((perMember * effectiveUserShares).toFixed(2));

        let dueDate = new Date(item.dueDate);
        if (isNaN(dueDate.getTime())) continue;

        const year = dueDate.getFullYear();
        const month = dueDate.getMonth() + 1;
        const dueDateStr = formatDateStr(dueDate.getDate(), month, year);

        const updatedRound = await prisma.goldDayRound.update({
          where: { id: item.id },
          data: {
            dueDate,
            dueDateStr,
            year,
            month,
            recipientName,
            isUserTurn,
            goldAmount,
            perMemberAmount: perMember,
            userShareCount: effectiveUserShares,
            userAmountToPay: userAmount,
            notes: item.notes !== undefined ? item.notes : undefined,
          },
        });

        if (updatedRound.expenseId) {
          try {
            const bulkExpDesc = isCeyrek
              ? `Altın Günü | Grup: ${group.title} | Sıra: ${recipientName} | Kişi Başı: 1 Çeyrek (₺${perMember.toLocaleString("tr-TR")}) | Toplam Altın: ${payingCount} Çeyrek (₺${goldAmount.toLocaleString("tr-TR")}) | Muhammed Ali (${effectiveUserShares} Hisse)`
              : `Altın Günü | Grup: ${group.title} | Sıra: ${recipientName} | Toplam Altın: ₺${goldAmount.toLocaleString("tr-TR")} / ${payingCount} kişi | Muhammed Ali (${effectiveUserShares} Hisse)`;

            await prisma.schoolExpense.update({
              where: { id: updatedRound.expenseId },
              data: {
                title: `🪙 Altın Günü: ${group.title} (Sıra: ${recipientName})`,
                dueDate,
                dueDateStr,
                amountDue: userAmount,
                amountRemaining: updatedRound.isPaid ? 0 : userAmount,
                amountPaid: updatedRound.isPaid ? userAmount : 0,
                status: updatedRound.isPaid ? "PAID" : "PENDING",
                monthIndex: month,
                period: `${month}.Ay (${dueDate.getDate()}. Gün)`,
                description: bulkExpDesc,
              },
            });
          } catch {}
        }
      }

      const refreshedGroup = await prisma.goldDayGroup.findUnique({
        where: { id: groupId },
        include: { rounds: { orderBy: { roundIndex: "asc" } } },
      });

      return NextResponse.json(refreshedGroup);
    }

    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  } catch (error: any) {
    console.error("Altın günü güncellenirken hata:", error);
    return NextResponse.json({ error: error.message || "Güncelleme yapılamadı" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const roundId = searchParams.get("roundId");

    if (groupId) {
      // Gruba ait turların SchoolExpense kayıtlarını sil
      const rounds = await prisma.goldDayRound.findMany({
        where: { groupId },
        select: { expenseId: true },
      });

      const expenseIds = rounds.map((r) => r.expenseId).filter(Boolean) as string[];
      if (expenseIds.length > 0) {
        await prisma.schoolExpense.deleteMany({
          where: { id: { in: expenseIds } },
        });
      }

      await prisma.goldDayGroup.delete({ where: { id: groupId } });
      return NextResponse.json({ success: true, message: "Grup ve tüm gider kayıtları silindi" });
    }

    if (roundId) {
      const round = await prisma.goldDayRound.findUnique({ where: { id: roundId } });
      if (round && round.expenseId) {
        await prisma.schoolExpense.delete({ where: { id: round.expenseId } }).catch(() => {});
      }
      await prisma.goldDayRound.delete({ where: { id: roundId } });
      return NextResponse.json({ success: true, message: "Tur silindi" });
    }

    return NextResponse.json({ error: "groupId veya roundId zorunludur" }, { status: 400 });
  } catch (error: any) {
    console.error("Altın günü silinirken hata:", error);
    return NextResponse.json({ error: error.message || "Silinemedi" }, { status: 500 });
  }
}
