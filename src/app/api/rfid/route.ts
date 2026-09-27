import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/rfid?rfid=12345
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rfidParam = searchParams.get("rfid");

    if (!rfidParam) {
      return NextResponse.json(
        { success: false, message: "Parameter rfid wajib disertakan" },
        { status: 400 }
      );
    }

    const rfidNumber = parseInt(rfidParam, 10);
    if (isNaN(rfidNumber)) {
      return NextResponse.json(
        { success: false, message: "Format RFID harus berupa angka" },
        { status: 400 }
      );
    }

    // Cari data user beserta relasi siswa dan saldo
    const user = await prisma.user.findUnique({
      where: { rfid_id: rfidNumber },
      include: {
        siswa: true,
        saldo: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: `Kartu RFID ${rfidNumber} belum terdaftar di sistem` },
        { status: 404 }
      );
    }

    // Ambil saldo terkini
    const saldoData = user.saldo?.[0];
    const saldoAmount = saldoData ? Number(saldoData.saldo) : 0;

    return NextResponse.json({
      success: true,
      data: {
        rfid_id: user.rfid_id,
        nisn: user.siswa.nisn,
        nama: user.siswa.nama,
        role: user.role,
        saldo: saldoAmount,
      },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Terjadi kesalahan server";
    console.error("Error API RFID GET:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server", error: errMsg },
      { status: 500 }
    );
  }
}

// POST /api/rfid -> Digunakan oleh hardware ESP32 atau webhook
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawRfid = body.rfid_id || body.uid || body.rfid;

    if (!rawRfid) {
      return NextResponse.json(
        { success: false, message: "Body rfid_id / uid wajib disertakan" },
        { status: 400 }
      );
    }

    const rfidNumber = parseInt(String(rawRfid), 10);
    if (isNaN(rfidNumber)) {
      return NextResponse.json(
        { success: false, message: "Format RFID harus berupa angka" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { rfid_id: rfidNumber },
      include: {
        siswa: true,
        saldo: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Kartu tidak dikenal" },
        { status: 404 }
      );
    }

    const saldoData = user.saldo?.[0];
    const saldoAmount = saldoData ? Number(saldoData.saldo) : 0;

    return NextResponse.json({
      success: true,
      message: "Kartu valid",
      data: {
        rfid_id: user.rfid_id,
        nama: user.siswa.nama,
        nisn: user.siswa.nisn,
        saldo: saldoAmount,
      },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal memproses kartu";
    console.error("Error API RFID POST:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memproses kartu", error: errMsg },
      { status: 500 }
    );
  }
}
