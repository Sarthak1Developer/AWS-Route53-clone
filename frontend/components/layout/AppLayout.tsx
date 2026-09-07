"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";
import AuthProvider from "./AuthProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";

  return (
    <AuthProvider>
      <Header isAuthPage={isAuthPage} />
      {!isAuthPage && <Sidebar />}
      <div
        className={`min-h-screen bg-background flex flex-col transition-all duration-200 ${
          !isAuthPage ? "pl-sidebar-width" : ""
        }`}
      >
        <main
          className={`relative pt-nav-height w-full flex-1 ${
            !isAuthPage
              ? "px-space-xl py-space-lg"
              : "flex items-center justify-center p-4 bg-[#f2f3f3]"
          }`}
        >
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
