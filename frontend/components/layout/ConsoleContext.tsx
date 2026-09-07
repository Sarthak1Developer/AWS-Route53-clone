"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface ConsoleContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  isCloudShellOpen: boolean;
  toggleCloudShell: () => void;
  setCloudShellOpen: (open: boolean) => void;
  isShortcutsOpen: boolean;
  toggleShortcuts: () => void;
  setShortcutsOpen: (open: boolean) => void;
  currentRegion: string;
  setCurrentRegion: (region: string) => void;
  tableDensity: "normal" | "dense";
  setTableDensity: (density: "normal" | "dense") => void;
}

const ConsoleContext = createContext<ConsoleContextType | undefined>(undefined);

export function ConsoleProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCloudShellOpen, setCloudShellOpen] = useState(false);
  const [isShortcutsOpen, setShortcutsOpen] = useState(false);
  const [currentRegion, setCurrentRegion] = useState("Global");
  const [tableDensity, setTableDensity] = useState<"normal" | "dense">("normal");

  useEffect(() => {
    // Check saved theme
    const savedTheme = localStorage.getItem("route53_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }

    const savedDensity = localStorage.getItem("route53_table_density");
    if (savedDensity === "dense" || savedDensity === "normal") {
      setTableDensity(savedDensity);
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("route53_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("route53_theme", "light");
      }
      return next;
    });
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleCloudShell = () => setCloudShellOpen((prev) => !prev);
  const toggleShortcuts = () => setShortcutsOpen((prev) => !prev);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when user is typing in an input or textarea
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (e.key === "~" || (e.ctrlKey && e.key === "`")) {
        if (!isInput) {
          e.preventDefault();
          toggleCloudShell();
        }
      } else if (e.key === "?" && !isInput) {
        e.preventDefault();
        toggleShortcuts();
      } else if ((e.key === "t" || e.key === "T") && !isInput) {
        e.preventDefault();
        toggleDarkMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <ConsoleContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        isSidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        isCloudShellOpen,
        toggleCloudShell,
        setCloudShellOpen,
        isShortcutsOpen,
        toggleShortcuts,
        setShortcutsOpen,
        currentRegion,
        setCurrentRegion,
        tableDensity,
        setTableDensity: (density) => {
          setTableDensity(density);
          localStorage.setItem("route53_table_density", density);
        },
      }}
    >
      {children}
    </ConsoleContext.Provider>
  );
}

export function useConsole() {
  const context = useContext(ConsoleContext);
  if (!context) {
    throw new Error("useConsole must be used within a ConsoleProvider");
  }
  return context;
}
