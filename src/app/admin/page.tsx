"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import Card from "@/components/ui/Card";
import { MenuItem } from "@/types";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"topup" | "menu" | "siswa">("topup");

  // State Top-up
  const [rfidTopup, setRfidTopup] = useState("");
  const [nominalTopup, setNominalTopup] = useState("");
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupMessage, setTopupMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // State Menu
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [namaMenu, setNamaMenu] = useState("");
  const [hargaMenu, setHargaMenu] = useState("");
  const [savingMenu, setSavingMenu] = useState(false);

  // State Siswa
  interface SiswaAdminItem {
    nisn: number;
    nama: string;
    rfid_id: number | null;
    saldo: number;
  }
  const [siswaList, setSiswaList] = useState<SiswaAdminItem[]>([]);
  const [nisnBaru, setNisnBaru] = useState("");
  const [namaSiswaBaru, setNamaSiswaBaru] = useState("");
  const [rfidSiswaBaru, setRfidSiswaBaru] = useState("");
  const [savingSiswa, setSavingSiswa] = useState(false);

  useEffect(() => {
    fetchMenus();
    fetchSiswa();
  }, []);

  const fetchMenus = async () => {
    try {
      const res = await fetch("/api/admin?type=menu");
      const json = await res.json();
      if (json.success) setMenuList(json.data || []);
    } catch {
      console.error("Gagal load menu");
    }
  };

  const fetchSiswa = async () => {
    try {
      const res = await fetch("/api/admin?type=siswa");
      const json = await res.json();
      if (json.success) setSiswaList(json.data || []);
    } catch {
      console.error("Gagal load siswa");
    }
  };

  // Submit Topup
  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopupLoading(true);
    setTopupMessage(null);

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "topup",
          rfid_id: Number(rfidTopup),
          nominal: Number(nominalTopup),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setTopupMessage({ text: json.message || "Top-up saldo berhasil!", type: "success" });
        setRfidTopup("");
        setNominalTopup("");
        fetchSiswa();
      } else {
        setTopupMessage({ text: json.message || "Gagal melakukan top-up", type: "error" });
      }
    } catch {
      setTopupMessage({ text: "Terjadi kesalahan jaringan", type: "error" });
    } finally {
      setTopupLoading(false);
    }
  };

  // Submit Menu Baru
  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaMenu.trim() || !hargaMenu) return;

    setSavingMenu(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_menu",
          nama_menu: namaMenu.trim(),
          harga: Number(hargaMenu),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setNamaMenu("");
        setHargaMenu("");
        fetchMenus();
      } else {
        alert(json.message || "Gagal menyimpan menu");
      }
    } catch {
      alert("Terjadi kesalahan jaringan");
    } finally {
      setSavingMenu(false);
    }
  };

  // Submit Siswa Baru
  const handleAddSiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisnBaru || !namaSiswaBaru || !rfidSiswaBaru) return;

    setSavingSiswa(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_siswa",
          nisn: Number(nisnBaru),
          nama: namaSiswaBaru.trim(),
          rfid_id: Number(rfidSiswaBaru),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setNisnBaru("");
        setNamaSiswaBaru("");
        setRfidSiswaBaru("");
        fetchSiswa();
      } else {
        alert(json.message || "Gagal mendaftarkan siswa");
      }
    } catch {
      alert("Terjadi kesalahan jaringan");
    } finally {
      setSavingSiswa(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar title="Dashboard Admin — Manajemen Sistem" />

      <div className="flex flex-1">
        <Sidebar role="admin" />

        <main className="flex-1 p-6 space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-2 border-b border-gray-300 pb-2">
            <button
              onClick={() => setActiveTab("topup")}
              className={`px-4 py-2 text-sm font-semibold rounded ${
                activeTab === "topup" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              💳 Top-Up Saldo
            </button>
            <button
              onClick={() => setActiveTab("menu")}
              className={`px-4 py-2 text-sm font-semibold rounded ${
                activeTab === "menu" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              🍔 Kelola Menu Produk
            </button>
            <button
              onClick={() => setActiveTab("siswa")}
              className={`px-4 py-2 text-sm font-semibold rounded ${
                activeTab === "siswa" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              🎓 Data Siswa & RFID
            </button>
          </div>

          {/* TAB 1: TOP-UP SALDO */}
          {activeTab === "topup" && (
            <div className="max-w-xl">
              <Card title="Pengisian Saldo Kartu Siswa (Top-up)">
                {topupMessage && (
                  <div
                    className={`p-3 mb-4 rounded text-sm ${
                      topupMessage.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {topupMessage.text}
                  </div>
                )}

                <form onSubmit={handleTopup} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Nomor Kartu RFID Siswa
                    </label>
                    <input
                      type="number"
                      value={rfidTopup}
                      onChange={(e) => setRfidTopup(e.target.value)}
                      required
                      placeholder="Contoh: 33333"
                      className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Nominal Top-up (Rp)
                    </label>
                    <input
                      type="number"
                      value={nominalTopup}
                      onChange={(e) => setNominalTopup(e.target.value)}
                      required
                      min={1000}
                      step={1000}
                      placeholder="Contoh: 20000"
                      className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={topupLoading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-sm transition disabled:opacity-50"
                  >
                    {topupLoading ? "Memproses Top-up..." : "Simpan Top-up"}
                  </button>
                </form>
              </Card>
            </div>
          )}

          {/* TAB 2: KELOLA MENU */}
          {activeTab === "menu" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Tambah Menu Baru">
                <form onSubmit={handleAddMenu} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Nama Menu / Produk
                    </label>
                    <input
                      type="text"
                      value={namaMenu}
                      onChange={(e) => setNamaMenu(e.target.value)}
                      required
                      placeholder="Contoh: Soto Ayam"
                      className="w-full px-3 py-2 border rounded text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Harga (Rp)
                    </label>
                    <input
                      type="number"
                      value={hargaMenu}
                      onChange={(e) => setHargaMenu(e.target.value)}
                      required
                      placeholder="Contoh: 10000"
                      className="w-full px-3 py-2 border rounded text-sm focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingMenu}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
                  >
                    {savingMenu ? "Menyimpan..." : "Tambah Menu"}
                  </button>
                </form>
              </Card>

              <Card title="Daftar Menu Saat Ini">
                <div className="divide-y max-h-96 overflow-y-auto">
                  {menuList.map((m) => (
                    <div key={m.id} className="py-2 flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-800">{m.nama_menu}</span>
                      <span className="font-semibold text-blue-600">
                        Rp {m.harga.toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: DATA SISWA */}
          {activeTab === "siswa" && (
            <div className="space-y-6">
              <Card title="Daftarkan Siswa & Kartu RFID Baru">
                <form onSubmit={handleAddSiswa} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">NISN</label>
                    <input
                      type="number"
                      value={nisnBaru}
                      onChange={(e) => setNisnBaru(e.target.value)}
                      required
                      placeholder="10005"
                      className="w-full px-3 py-2 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      value={namaSiswaBaru}
                      onChange={(e) => setNamaSiswaBaru(e.target.value)}
                      required
                      placeholder="Ahmad Fauzi"
                      className="w-full px-3 py-2 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">ID RFID Kartu</label>
                    <input
                      type="number"
                      value={rfidSiswaBaru}
                      onChange={(e) => setRfidSiswaBaru(e.target.value)}
                      required
                      placeholder="44444"
                      className="w-full px-3 py-2 border rounded text-sm"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      disabled={savingSiswa}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
                    >
                      {savingSiswa ? "Mendaftarkan..." : "Daftarkan Siswa"}
                    </button>
                  </div>
                </form>
              </Card>

              <Card title="Daftar Siswa & Saldo Terdaftar">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-gray-600 text-xs">
                        <th className="py-2 px-3">NISN</th>
                        <th className="py-2 px-3">Nama</th>
                        <th className="py-2 px-3">RFID ID</th>
                        <th className="py-2 px-3">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {siswaList.map((s, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="py-2 px-3">{s.nisn}</td>
                          <td className="py-2 px-3 font-medium text-gray-800">{s.nama}</td>
                          <td className="py-2 px-3 font-mono text-xs">{s.rfid_id || "-"}</td>
                          <td className="py-2 px-3 font-semibold text-blue-600">
                            Rp {(s.saldo || 0).toLocaleString("id-ID")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
