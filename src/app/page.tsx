import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-800">Sistem Kasir Cashless RFID</h1>
          <p className="text-sm text-gray-500">Business Center & Smart Cafe SMK</p>
        </div>

        <div className="flex flex-col space-y-3">
          <Link
            href="/kasir"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-center transition"
          >
            Buka Halaman Kasir (POS)
          </Link>
          <Link
            href="/admin"
            className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg text-center transition"
          >
            Buka Halaman Admin
          </Link>
          <Link
            href="/supervisor"
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-center transition"
          >
            Buka Halaman Laporan (Supervisor)
          </Link>
          <Link
            href="/login"
            className="w-full py-2.5 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg text-center transition"
          >
            Login Petugas
          </Link>
        </div>

        <div className="text-xs text-gray-400 pt-4 border-t">
          Dikembangkan oleh Tim PPLG SMK — 2026
        </div>
      </div>
    </div>
  );
}
