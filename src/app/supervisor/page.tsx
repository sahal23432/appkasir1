"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import Card from "@/components/ui/Card";

interface TransaksiItemDetail {
  id: number;
  jumlah: number;
  harga_satuan: number;
  subtotal: number;
  menu?: {
    nama_menu: string;
  };
}

interface TransaksiRecord {
  id: number;
  tanggal: string;
  total_harga: number;
  status: string;
  rfid_id: number;
  user?: {
    siswa?: {
      nama: string;
    };
  };
  items?: TransaksiItemDetail[];
}

interface SupervisorReport {
  totalPendapatan: number;
  totalTransaksi: number;
  transaksiTerbaru: TransaksiRecord[];
}

export default function SupervisorPage() {
  const [report, setReport] = useState<SupervisorReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/supervisor");
      const json = await res.json();
      if (json.success) {
        setReport(json.data);
      }
    } catch {
      console.error("Gagal load data laporan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar title="Laporan & Monitoring Penjualan (Supervisor)" />

      <div className="flex flex-1">
        <Sidebar role="admin" />

        <main className="flex-1 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">Ringkasan Operasional Kasir</h1>
            <button
              onClick={fetchReport}
              className="px-3 py-1.5 bg-white border border-gray-300 text-sm font-medium rounded hover:bg-gray-50"
            >
              🔄 Refresh Data
            </button>
          </div>

          {/* Kartu Metrik Ringkasan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <p className="text-xs font-semibold text-gray-500 uppercase">Total Omzet Penjualan</p>
              <p className="text-2xl font-bold text-emerald-600 mt-2">
                Rp {(report?.totalPendapatan || 0).toLocaleString("id-ID")}
              </p>
            </Card>

            <Card>
              <p className="text-xs font-semibold text-gray-500 uppercase">Jumlah Transaksi Sukses</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {(report?.totalTransaksi || 0)} Transaksi
              </p>
            </Card>

            <Card>
              <p className="text-xs font-semibold text-gray-500 uppercase">Metode Pembayaran</p>
              <p className="text-lg font-bold text-gray-800 mt-2">100% Cashless RFID</p>
            </Card>
          </div>

          {/* Tabel Riwayat Transaksi Terbaru */}
          <Card title="Riwayat Transaksi Terakhir">
            {loading ? (
              <p className="text-sm text-gray-500">Memuat laporan...</p>
            ) : !report?.transaksiTerbaru || report.transaksiTerbaru.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Belum ada data transaksi yang tercatat</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-600 text-xs">
                      <th className="py-2 px-3">ID</th>
                      <th className="py-2 px-3">Waktu</th>
                      <th className="py-2 px-3">Siswa / RFID</th>
                      <th className="py-2 px-3">Item Pembelian</th>
                      <th className="py-2 px-3">Total Belanja</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {report.transaksiTerbaru.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="py-2 px-3 font-mono text-xs">#{t.id}</td>
                        <td className="py-2 px-3 text-xs text-gray-500">
                          {new Date(t.tanggal).toLocaleString("id-ID")}
                        </td>
                        <td className="py-2 px-3 font-medium">
                          {t.user?.siswa?.nama || `RFID: ${t.rfid_id}`}
                        </td>
                        <td className="py-2 px-3 text-xs">
                          {t.items?.map((i) => `${i.menu?.nama_menu || "Item"} (${i.jumlah}x)`).join(", ") || "-"}
                        </td>
                        <td className="py-2 px-3 font-semibold text-emerald-600">
                          Rp {t.total_harga.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}
