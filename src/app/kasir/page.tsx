"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import { MenuItem, CartItem, StudentProfile } from "@/types";

export default function KasirPage() {
  // State Siswa & RFID
  const [rfidInput, setRfidInput] = useState("");
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);

  // State Menu Produk & Keranjang
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // State Transaksi & Struk
  const [processing, setProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<{
    transaksiId: number;
    studentName: string;
    total: number;
    sisaSaldo: number;
    items: CartItem[];
    tanggal: string;
  } | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Ambil data menu saat komponen dimuat
  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    setLoadingMenu(true);
    try {
      const res = await fetch("/api/kasir");
      const json = await res.json();
      if (json.success) {
        setMenuList(json.data || []);
      }
    } catch {
      console.error("Gagal mengambil daftar menu");
    } finally {
      setLoadingMenu(false);
    }
  };

  // Pencarian Siswa via Tap Kartu / Input RFID
  const handleCheckRfid = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!rfidInput.trim()) return;

    setLoadingStudent(true);
    setStudentError(null);
    try {
      const res = await fetch(`/api/rfid?rfid=${encodeURIComponent(rfidInput.trim())}`);
      const json = await res.json();
      if (json.success && json.data) {
        setStudent(json.data);
      } else {
        setStudent(null);
        setStudentError(json.message || "Kartu RFID tidak terdaftar");
      }
    } catch {
      setStudentError("Gagal menghubungi server");
    } finally {
      setLoadingStudent(false);
    }
  };

  // Tambah item ke keranjang
  const addToCart = (menu: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.menu.id === menu.id);
      if (existing) {
        return prev.map((item) =>
          item.menu.id === menu.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * menu.harga,
              }
            : item
        );
      }
      return [...prev, { menu, quantity: 1, subtotal: menu.harga }];
    });
  };

  // Kurang / Hapus item dari keranjang
  const updateQuantity = (menuId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.menu.id === menuId) {
            const newQty = item.quantity + delta;
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.menu.harga,
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  // Hitung total belanja
  const totalAmount = cart.reduce((acc, item) => acc + item.subtotal, 0);

  // Proses Checkout Transaksi
  const handleCheckout = async () => {
    if (!student) {
      alert("Harap tempelkan / masukkan kartu RFID siswa terlebih dahulu");
      return;
    }
    if (cart.length === 0) {
      alert("Keranjang belanja masih kosong");
      return;
    }
    if ((student.saldo || 0) < totalAmount) {
      setCheckoutError("Saldo siswa tidak mencukupi untuk pembayaran ini!");
      return;
    }

    setProcessing(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/kasir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfid_id: student.rfid_id,
          items: cart.map((item) => ({
            menu_id: item.menu.id,
            jumlah: item.quantity,
          })),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setLastReceipt({
          transaksiId: json.data.transaksiId,
          studentName: student.nama,
          total: totalAmount,
          sisaSaldo: json.data.sisaSaldo,
          items: [...cart],
          tanggal: new Date().toLocaleString("id-ID"),
        });
        setIsReceiptOpen(true);

        // Perbarui saldo di UI & reset cart
        setStudent((prev) => (prev ? { ...prev, saldo: json.data.sisaSaldo } : null));
        setCart([]);
      } else {
        setCheckoutError(json.message || "Transaksi gagal diproses");
      }
    } catch {
      setCheckoutError("Terjadi kesalahan jaringan saat proses transaksi");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar title="Sistem Kasir Cashless — Terminal POS" />

      <div className="flex flex-1">
        <Sidebar role="kasir" />

        <main className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* KOLOM 1 & 2: Identitas Siswa & Daftar Produk */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bagian Scan RFID Siswa */}
              <Card title="1. Identitas Siswa (Tap RFID)">
                <form onSubmit={handleCheckRfid} className="flex gap-2">
                  <input
                    type="number"
                    value={rfidInput}
                    onChange={(e) => setRfidInput(e.target.value)}
                    placeholder="Tempelkan kartu RFID atau masukkan kode ID (contoh: 33333)"
                    className="flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={loadingStudent}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loadingStudent ? "Mengecek..." : "Periksa Kartu"}
                  </button>
                </form>

                {studentError && (
                  <p className="mt-2 text-sm text-red-600">{studentError}</p>
                )}

                {student && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800">{student.nama}</p>
                      <p className="text-xs text-gray-500">NISN: {student.nisn} | RFID: {student.rfid_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Saldo Kartu:</p>
                      <p className="text-lg font-bold text-blue-700">
                        Rp {student.saldo?.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Daftar Menu / Produk */}
              <Card title="2. Pilihan Menu & Produk">
                {loadingMenu ? (
                  <p className="text-sm text-gray-500">Memuat daftar produk...</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {menuList.map((menu) => (
                      <button
                        key={menu.id}
                        type="button"
                        onClick={() => addToCart(menu)}
                        className="p-3 border rounded text-left hover:bg-blue-50 transition border-gray-200 flex flex-col justify-between"
                      >
                        <span className="font-medium text-sm text-gray-800">{menu.nama_menu}</span>
                        <span className="text-xs font-semibold text-blue-600 mt-2">
                          Rp {menu.harga.toLocaleString("id-ID")}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* KOLOM 3: Keranjang Belanja & Checkout */}
            <div className="space-y-6">
              <Card title="3. Keranjang Belanja (Cart)">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Belum ada menu yang dipilih
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="divide-y max-h-80 overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div key={item.menu.id} className="py-2 flex justify-between items-center text-sm">
                          <div>
                            <p className="font-medium text-gray-800">{item.menu.nama_menu}</p>
                            <p className="text-xs text-gray-500">
                              Rp {item.menu.harga.toLocaleString("id-ID")} x {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-700">
                              Rp {item.subtotal.toLocaleString("id-ID")}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.menu.id, -1)}
                              className="w-6 h-6 border rounded bg-gray-50 hover:bg-gray-200 text-xs font-bold"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.menu.id, 1)}
                              className="w-6 h-6 border rounded bg-gray-50 hover:bg-gray-200 text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t space-y-2">
                      <div className="flex justify-between font-bold text-base text-gray-900">
                        <span>Total Pembayaran:</span>
                        <span>Rp {totalAmount.toLocaleString("id-ID")}</span>
                      </div>

                      {checkoutError && (
                        <div className="p-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded">
                          {checkoutError}
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={processing || cart.length === 0}
                        onClick={handleCheckout}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-sm transition disabled:opacity-50"
                      >
                        {processing ? "Memproses Transaksi..." : "Bayar Sekarang (Deduksi Saldo)"}
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Struk Digital */}
      {lastReceipt && (
        <Modal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          title="Bukti Pembayaran (Struk Digital)"
        >
          <div className="space-y-4 text-sm">
            <div className="text-center pb-2 border-b">
              <p className="font-bold text-base">SMK BUSINESS CENTER</p>
              <p className="text-xs text-gray-500">{lastReceipt.tanggal}</p>
              <p className="text-xs text-gray-500">ID Transaksi: #{lastReceipt.transaksiId}</p>
            </div>

            <div className="flex justify-between text-xs text-gray-600">
              <span>Siswa:</span>
              <span className="font-medium text-gray-800">{lastReceipt.studentName}</span>
            </div>

            <div className="divide-y text-xs">
              {lastReceipt.items.map((item) => (
                <div key={item.menu.id} className="py-1 flex justify-between">
                  <span>{item.menu.nama_menu} x{item.quantity}</span>
                  <span>Rp {item.subtotal.toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t space-y-1 text-xs">
              <div className="flex justify-between font-bold text-sm">
                <span>Total:</span>
                <span>Rp {lastReceipt.total.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Sisa Saldo:</span>
                <span>Rp {lastReceipt.sisaSaldo.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <button
              onClick={() => setIsReceiptOpen(false)}
              className="w-full py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-900"
            >
              Tutup Struk
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
