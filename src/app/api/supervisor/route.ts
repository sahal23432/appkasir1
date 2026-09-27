import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// GET /api/supervisor -> Laporan keuangan & riwayat transaksi
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Anda harus login untuk melihat laporan" },
        { status: 401 }
      );
    }

    // Ambil 50 transaksi terbaru
    const transactions = await prisma.transaksi.findMany({
      where: { status: "SUCCESS" },
      include: {
        user: { include: { siswa: true } },
        items: { include: { menu: true } },
      },
      orderBy: { tanggal: "desc" },
      take: 50,
    });

    // Hitung agregat
    const aggregate = await prisma.transaksi.aggregate({
      where: { status: "SUCCESS" },
      _sum: { total_harga: true },
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalPendapatan: aggregate._sum.total_harga || 0,
        totalTransaksi: aggregate._count.id || 0,
        transaksiTerbaru: transactions,
      },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal memuat laporan";
    console.error("Error GET /api/supervisor:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat laporan", error: errMsg },
      { status: 500 }
    );
  }
}
