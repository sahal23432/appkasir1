import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { RoleUser } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// GET /api/admin?type=siswa | menu
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "siswa") {
      const siswa = await prisma.siswa.findMany({
        include: {
          users: true,
          saldo: true,
        },
        orderBy: { nisn: "asc" },
      });

      const formatted = siswa.map((s) => ({
        nisn: s.nisn,
        nama: s.nama,
        rfid_id: s.users?.[0]?.rfid_id ?? null,
        saldo: s.saldo?.[0] ? Number(s.saldo[0].saldo) : 0,
      }));

      return NextResponse.json({ success: true, data: formatted });
    }

    if (type === "menu") {
      const menus = await prisma.menu.findMany({ orderBy: { id: "asc" } });
      return NextResponse.json({ success: true, data: menus });
    }

    return NextResponse.json({ success: true, message: "Admin API Ready." });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal memuat data";
    console.error("Error GET /api/admin:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data", error: errMsg },
      { status: 500 }
    );
  }
}

// POST /api/admin -> Top-up, Tambah Menu, Tambah Siswa
export async function POST(request: Request) {
  try {
    // Hanya admin yang bisa memanggil POST admin
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Hanya Admin yang dapat melakukan operasi ini" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // ── 1. TOP-UP SALDO ──────────────────────────────────────
    if (action === "topup") {
      const rfidNumber = parseInt(String(body.rfid_id), 10);
      const nominalNumber = parseInt(String(body.nominal), 10);

      if (isNaN(rfidNumber) || isNaN(nominalNumber) || nominalNumber < 1000) {
        return NextResponse.json(
          { success: false, message: "RFID atau nominal tidak valid (min. Rp 1.000)" },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { rfid_id: rfidNumber },
        include: { saldo: true, siswa: true },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: `RFID ${rfidNumber} tidak ditemukan` },
          { status: 404 }
        );
      }

      let saldoRecord = user.saldo?.[0];

      if (!saldoRecord) {
        saldoRecord = await prisma.saldo.create({
          data: { rfid_id: user.rfid_id, nisn: user.siswa.nisn, saldo: 0 },
        });
      }

      const newSaldo = Number(saldoRecord.saldo) + nominalNumber;

      await prisma.$transaction(async (tx) => {
        await tx.saldo.update({
          where: { rfid_id_nisn: { rfid_id: saldoRecord.rfid_id, nisn: saldoRecord.nisn } },
          data: { saldo: newSaldo },
        });
        await tx.topup.create({
          data: {
            rfid_id: rfidNumber,
            nominal: nominalNumber,
            keterangan: `Top-up tunai untuk ${user.siswa.nama}`,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: `Top-up Rp ${nominalNumber.toLocaleString("id-ID")} untuk ${user.siswa.nama} berhasil! Saldo baru: Rp ${newSaldo.toLocaleString("id-ID")}`,
        data: { rfid_id: rfidNumber, nama: user.siswa.nama, saldoBaru: newSaldo },
      });
    }

    // ── 2. TAMBAH MENU ───────────────────────────────────────
    if (action === "add_menu") {
      const { nama_menu, harga } = body;
      if (!nama_menu || !harga) {
        return NextResponse.json(
          { success: false, message: "Nama menu dan harga wajib diisi" },
          { status: 400 }
        );
      }

      const newMenu = await prisma.menu.create({
        data: {
          nama_menu: String(nama_menu).trim(),
          harga: parseInt(String(harga), 10),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Menu berhasil ditambahkan",
        data: newMenu,
      });
    }

    // ── 3. TAMBAH SISWA & DAFTARKAN RFID ────────────────────
    if (action === "add_siswa") {
      const nisnNum = parseInt(String(body.nisn), 10);
      const rfidNum = parseInt(String(body.rfid_id), 10);
      const namaStr = String(body.nama ?? "").trim();

      if (!nisnNum || !namaStr || !rfidNum) {
        return NextResponse.json(
          { success: false, message: "NISN, Nama, dan RFID ID wajib diisi" },
          { status: 400 }
        );
      }

      const existingSiswa = await prisma.siswa.findFirst({
        where: { OR: [{ nisn: nisnNum }, { nama: namaStr }] },
      });
      if (existingSiswa) {
        return NextResponse.json(
          { success: false, message: "Siswa dengan NISN atau Nama tersebut sudah terdaftar" },
          { status: 400 }
        );
      }

      const existingRfid = await prisma.user.findUnique({ where: { rfid_id: rfidNum } });
      if (existingRfid) {
        return NextResponse.json(
          { success: false, message: `Kartu RFID ${rfidNum} sudah dipakai oleh pengguna lain` },
          { status: 400 }
        );
      }

      const defaultPasswordHash = await bcrypt.hash("123456", 10);

      const result = await prisma.$transaction(async (tx) => {
        const siswa = await tx.siswa.create({ data: { nisn: nisnNum, nama: namaStr } });
        const user = await tx.user.create({
          data: {
            rfid_id: rfidNum,
            username: siswa.nama,
            password: defaultPasswordHash,
            role: RoleUser.kasir,
          },
        });
        const saldo = await tx.saldo.create({
          data: { rfid_id: rfidNum, nisn: nisnNum, saldo: 0 },
        });
        return { siswa, user, saldo };
      });

      return NextResponse.json({
        success: true,
        message: `Siswa ${result.siswa.nama} berhasil didaftarkan (RFID: ${rfidNum}, Password awal: 123456)`,
        data: result,
      });
    }

    return NextResponse.json(
      { success: false, message: `Aksi '${action}' tidak dikenali` },
      { status: 400 }
    );
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal memproses";
    console.error("Error POST /api/admin:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memproses permintaan", error: errMsg },
      { status: 500 }
    );
  }
}
