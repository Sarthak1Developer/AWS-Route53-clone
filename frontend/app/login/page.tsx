"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(username, password);
      // Save token to cookie or localStorage
      document.cookie = `auth_token=${data.token}; path=/; max-age=86400`;
      router.push("/hosted-zones");
    } catch (err: any) {
      setError(err.message || "Failed to login. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f2f3f3] absolute inset-0 z-50">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm border border-[#eaeded]">
        <div className="flex justify-center mb-6">
          <div className="text-2xl font-bold text-[#232f3e] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ff9900] text-3xl">cloud</span>
            Amazon Web Services
          </div>
        </div>
        
        <h1 className="text-xl font-normal text-[#16191f] mb-4 text-center">Sign in as IAM user</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-[#fdf3f3] border border-[#d13212] text-[#d13212] text-sm rounded flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold text-[#16191f] mb-1" htmlFor="username">
              IAM user name
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-8 px-2 border border-[#aab7b8] rounded focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb] focus:outline-none text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-[#16191f] mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-8 px-2 border border-[#aab7b8] rounded focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb] focus:outline-none text-sm"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full h-8 mt-2 bg-[#ff9900] hover:bg-[#ec9103] active:bg-[#df8a03] text-[#111111] font-bold rounded text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
