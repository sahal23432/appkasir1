"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push("/kasir");
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan saat mencoba masuk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-sm bg-white p-6 rounded-lg border border-gray-300 shadow-sm space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800">Login Petugas Kasir</h1>
          <p className="text-xs text-gray-500 mt-1">Masuk dengan akun Kasir atau Admin</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Contoh: Petugas Kasir"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-sm transition disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Masuk ke Sistem"}
          </button>
        </form>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 space-y-1">
          <div className="font-semibold text-gray-700">Akun Bawaan (Default):</div>
          <div>• Admin: <code>Petugas Admin</code> / <code>password123</code></div>
          <div>• Kasir: <code>Petugas Kasir</code> / <code>password123</code></div>
        </div>
      </div>
    </div>
  );
}
