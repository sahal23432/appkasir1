import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// GET /api/kasir -> Mengambil seluruh daftar menu
export async function GET() {
  try {
    const menus = await prisma.menu.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: menus,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal memuat menu";
    console.error("Error GET /api/kasir:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat menu", error: errMsg },
      { status: 500 }
    );
  }
}

interface CartRequestItem {
  menu_id: number;
  jumlah: number;
}

// POST /api/kasir -> Memproses transaksi checkout kasir dengan transaksi atomik
export async function POST(request: Request) {
  try {
    // Verifikasi sesi login
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Anda harus login untuk melakukan transaksi" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { rfid_id, items } = body as { rfid_id: number; items: CartRequestItem[] };

    if (!rfid_id || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Data transaksi tidak valid (RFID atau item kosong)" },
        { status: 400 }
      );
    }

    const rfidNumber = parseInt(String(rfid_id), 10);

    // 1. Ambil data user & saldo dari database
    const user = await prisma.user.findUnique({
      where: { rfid_id: rfidNumber },
      include: {
        siswa: true,
        saldo: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Kartu RFID tidak ditemukan" },
        { status: 404 }
      );
    }

    const currentSaldoRecord = user.saldo?.[0];
    if (!currentSaldoRecord) {
      return NextResponse.json(
        { success: false, message: "Data saldo siswa belum diatur, hubungi Admin untuk top-up perdana" },
        { status: 400 }
      );
    }

    const currentSaldoNumber = Number(currentSaldoRecord.saldo);

    // 2. Validasi & kalkulasi harga item dari database (server-side, anti-manipulasi)
    const menuIds = items.map((i) => Number(i.menu_id));
    const menusInDb = await prisma.menu.findMany({
      where: { id: { in: menuIds } },
    });

    const menuMap = new Map<number, { nama_menu: string; harga: number }>();
    menusInDb.forEach((m) => menuMap.set(m.id, { nama_menu: m.nama_menu, harga: m.harga }));

    let calculatedTotal = 0;
    const detailPayload: {
      menu_id: number;
      jumlah: number;
      harga_satuan: number;
      subtotal: number;
    }[] = [];

    for (const item of items) {
      const menu = menuMap.get(Number(item.menu_id));
      if (!menu) {
        return NextResponse.json(
          { success: false, message: `Menu ID ${item.menu_id} tidak ditemukan di database` },
          { status: 400 }
        );
      }

      const qty = parseInt(String(item.jumlah), 10);
      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json(
          { success: false, message: `Jumlah item ${menu.nama_menu} tidak valid` },
          { status: 400 }
        );
      }

      const subtotal = menu.harga * qty;
      calculatedTotal += subtotal;
      detailPayload.push({
        menu_id: item.menu_id,
        jumlah: qty,
        harga_satuan: menu.harga,
        subtotal,
      });
    }

    // 3. Validasi kecukupan saldo
    if (currentSaldoNumber < calculatedTotal) {
      return NextResponse.json(
        {
          success: false,
          message: `Saldo tidak mencukupi. Total: Rp ${calculatedTotal.toLocaleString("id-ID")}, Saldo: Rp ${currentSaldoNumber.toLocaleString("id-ID")}`,
        },
        { status: 400 }
      );
    }

    const newSaldoNumber = currentSaldoNumber - calculatedTotal;

    // 4. Atomic Transaction: Potong saldo + catat transaksi + catat detail item
    const result = await prisma.$transaction(async (tx) => {
      await tx.saldo.update({
        where: {
          rfid_id_nisn: {
            rfid_id: currentSaldoRecord.rfid_id,
            nisn: currentSaldoRecord.nisn,
          },
        },
        data: { saldo: newSaldoNumber },
      });

      const newTransaction = await tx.transaksi.create({
        data: {
          rfid_id: rfidNumber,
          total_harga: calculatedTotal,
          status: "SUCCESS",
          items: {
            create: detailPayload.map((d) => ({
              menu_id: d.menu_id,
              jumlah: d.jumlah,
              harga_satuan: d.harga_satuan,
              subtotal: d.subtotal,
            })),
          },
        },
      });

      return newTransaction;
    });

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil!",
      data: {
        transaksiId: result.id,
        total: calculatedTotal,
        sisaSaldo: newSaldoNumber,
      },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Terjadi kesalahan";
    console.error("Error POST /api/kasir:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat memproses transaksi", error: errMsg },
      { status: 500 }
    );
  }
}
