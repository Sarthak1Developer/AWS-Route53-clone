"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";
import AuthProvider from "./AuthProvider";
import { ConsoleProvider, useConsole } from "./ConsoleContext";
import CloudShell from "./CloudShell";
import KeyboardShortcutsModal from "./KeyboardShortcutsModal";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";
  const { isCloudShellOpen, toggleCloudShell, isShortcutsOpen, toggleShortcuts } = useConsole();

  return (
    <>
      <Header isAuthPage={isAuthPage} />
      {!isAuthPage && <Sidebar />}
      <div
        className={`min-h-screen bg-background flex flex-col transition-all duration-200 ${
          !isAuthPage ? "lg:pl-sidebar-width pl-0" : ""
        }`}
      >
        <main
          className={`relative pt-nav-height w-full flex-1 ${
            !isAuthPage
              ? "px-3 sm:px-6 py-4 max-w-full overflow-x-hidden"
              : "flex items-center justify-center p-4 bg-background"
          }`}
        >
          {children}
        </main>
      </div>

      {/* Embedded AWS CloudShell Terminal */}
      {!isAuthPage && (
        <CloudShell
          isOpen={isCloudShellOpen}
          onClose={toggleCloudShell}
        />
      )}

      {/* Keyboard Shortcuts Cheat Sheet */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={toggleShortcuts}
      />
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleProvider>
      <AuthProvider>
        <LayoutContent>{children}</LayoutContent>
      </AuthProvider>
    </ConsoleProvider>
  );
}
