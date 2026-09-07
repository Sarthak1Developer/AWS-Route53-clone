"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConsole } from "./ConsoleContext";
import ConsolePreferencesModal from "./ConsolePreferencesModal";
import InstallAppModal from "./InstallAppModal";
import { getHostedZones, HostedZone } from "@/lib/api";

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: "success" | "info" | "warning";
}

const REGIONS = [
  { id: "global", name: "Global", desc: "Route 53 does not require region selection" },
  { id: "us-east-1", name: "US East (N. Virginia)", desc: "us-east-1" },
  { id: "us-east-2", name: "US East (Ohio)", desc: "us-east-2" },
  { id: "us-west-1", name: "US West (N. California)", desc: "us-west-1" },
  { id: "us-west-2", name: "US West (Oregon)", desc: "us-west-2" },
  { id: "eu-west-1", name: "Europe (Ireland)", desc: "eu-west-1" },
  { id: "ap-south-1", name: "Asia Pacific (Mumbai)", desc: "ap-south-1" },
  { id: "ap-southeast-1", name: "Asia Pacific (Singapore)", desc: "ap-southeast-1" },
];

const AWS_SERVICES = [
  { name: "Route 53", category: "Networking & Content Delivery", desc: "Scalable DNS and Domain Name Registration", href: "/hosted-zones" },
  { name: "Hosted Zones", category: "Route 53", desc: "Manage DNS records for public and private zones", href: "/hosted-zones" },
  { name: "Health Checks", category: "Route 53", desc: "Monitor web application and endpoint availability", href: "/health-checks" },
  { name: "Traffic Policies", category: "Route 53", desc: "Visual DNS traffic routing configurations", href: "/traffic-policies" },
  { name: "Resolver Endpoints", category: "Route 53", desc: "Hybrid DNS resolution across VPCs and on-premises", href: "/resolver" },
  { name: "Route 53 Profiles", category: "Route 53", desc: "Standardize DNS configurations across multiple VPCs", href: "/profiles" },
  { name: "EC2", category: "Compute", desc: "Virtual servers in the cloud", href: "/dashboard" },
  { name: "S3", category: "Storage", desc: "Scalable object storage in the cloud", href: "/dashboard" },
  { name: "VPC", category: "Networking & Content Delivery", desc: "Isolated cloud resources and subnets", href: "/resolver" },
  { name: "CloudFront", category: "Networking & Content Delivery", desc: "Global content delivery network (CDN)", href: "/dashboard" },
  { name: "RDS", category: "Database", desc: "Managed relational database service", href: "/dashboard" },
  { name: "IAM", category: "Security, Identity, & Compliance", desc: "Manage access to AWS services and resources", href: "/dashboard" },
];

export default function Header({ isAuthPage = false }: { isAuthPage?: boolean }) {
  const router = useRouter();
  const { toggleSidebar, toggleCloudShell, currentRegion, setCurrentRegion } = useConsole();

  // Dropdown States
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // PWA Install States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [zones, setZones] = useState<HostedZone[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "n-1",
      title: "DNS Propagation In Sync",
      desc: "All global nameservers successfully synced for registered zones.",
      time: "10m ago",
      read: false,
      type: "success",
    },
    {
      id: "n-2",
      title: "Health Check Passed",
      desc: "Status: 100% healthy across all monitored target endpoints.",
      time: "1h ago",
      read: false,
      type: "info",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    getHostedZones().then(setZones).catch(console.error);

    // Check if already in standalone display mode
    if (typeof window !== "undefined") {
      if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
        setIsInstalled(true);
      }
    }

    const installHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const appInstalledHandler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", installHandler);
    window.addEventListener("appinstalled", appInstalledHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", installHandler);
      window.removeEventListener("appinstalled", appInstalledHandler);
    };
  }, []);

  // Keyboard shortcut Alt+S or / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if ((e.altKey && (e.key === "s" || e.key === "S")) || (e.key === "/" && !isInput)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === "Escape") {
        setIsServicesOpen(false);
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
        setIsRegionOpen(false);
        setIsAccountOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/login";
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Filtered Services
  const filteredServices = AWS_SERVICES.filter(
    (s) =>
      s.name.toLowerCase().includes(serviceFilter.toLowerCase()) ||
      s.category.toLowerCase().includes(serviceFilter.toLowerCase()) ||
      s.desc.toLowerCase().includes(serviceFilter.toLowerCase())
  );

  // Filtered Search Results
  const matchingZones = zones.filter((z) =>
    z.domain_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    z.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const matchingServices = AWS_SERVICES.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-nav-height bg-on-tertiary-container border-b border-tertiary text-on-tertiary flex items-center justify-between px-2 sm:px-4 select-none">
        {/* Left Section: Mobile Menu + AWS Logo + Services Dropdown */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {!isAuthPage && (
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-1.5 text-white hover:text-primary-fixed rounded transition-colors cursor-pointer"
              title="Toggle Navigation Menu"
              aria-label="Toggle Navigation Menu"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
          )}

          <Link href="/hosted-zones" className="flex items-center gap-1.5 sm:gap-2 hover:opacity-90 transition-opacity">
            <img
              alt="AWS Route 53 Service Icon"
              className="h-7 w-auto object-contain shrink-0"
              src="https://lh3.googleusercontent.com/aida/AEtjO1Wltdknruls2mSQuZWubw4cvL8g9GCz1ZmhQQtnXUQTApRngvBnixCie1IL_WjjqxL73fdD_UR-pXkR5CxlMDJBV7uMx5WjcYKe3-TLEsopFGIX6cG2jEz7PYxbHcQSpQDKPl9No31uFXSwLjwK8xuUxDkFmv8AhaPT40jokc8gIlyHuacmJRBggIgS-WvxSVISuaMkDCzYhonKAPK-7B3IVPXpdICDowvLpUZIT-aFVbsRuXEW36_5HnDE"
            />
            <span className="font-title-md text-title-md font-bold tracking-tight text-white hidden xs:inline">
              AWS
            </span>
          </Link>

          {!isAuthPage && (
            <div className="relative">
              <button
                onClick={() => {
                  setIsServicesOpen(!isServicesOpen);
                  setIsSearchOpen(false);
                  setIsNotificationsOpen(false);
                  setIsRegionOpen(false);
                  setIsAccountOpen(false);
                }}
                className={`flex items-center gap-1 text-white hover:text-primary-fixed text-label-sm font-label-sm px-2 py-1 rounded transition-colors cursor-pointer ${
                  isServicesOpen ? "bg-[#1b2533] text-primary-fixed ring-1 ring-tertiary" : ""
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">grid_view</span>
                <span className="hidden sm:inline font-label-sm">Services</span>
                <span className="material-symbols-outlined text-[14px]">
                  {isServicesOpen ? "expand_less" : "expand_more"}
                </span>
              </button>

              {/* Services Dropdown Menu */}
              {isServicesOpen && (
                <div
                  className="absolute left-0 top-full mt-1 w-80 sm:w-96 bg-surface-container-lowest text-on-surface rounded-lg shadow-2xl border border-surface-container-high overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-3 border-b border-surface-container-high bg-surface-container-low">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary text-[16px]">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="Search services..."
                        className="w-full h-8 pl-8 pr-3 bg-surface rounded text-body-sm border border-surface-container-high focus:outline-none focus:border-secondary shadow-inner"
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2 divide-y divide-surface-container-high/40">
                    {filteredServices.length > 0 ? (
                      filteredServices.map((srv, idx) => (
                        <Link
                          key={idx}
                          href={srv.href}
                          onClick={() => setIsServicesOpen(false)}
                          className="flex flex-col p-2 hover:bg-surface-container-high/50 rounded transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-label-md text-on-surface group-hover:text-secondary">
                              {srv.name}
                            </span>
                            <span className="text-[10px] text-tertiary uppercase font-semibold">
                              {srv.category}
                            </span>
                          </div>
                          <span className="text-[11px] text-tertiary line-clamp-1">{srv.desc}</span>
                        </Link>
                      ))
                    ) : (
                      <div className="p-4 text-center text-body-sm text-tertiary">
                        No services matching &quot;{serviceFilter}&quot;
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center Section: Global Search Bar */}
        {!isAuthPage && (
          <div className="flex-1 max-w-xl mx-2 sm:mx-4 relative min-w-0">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-2 text-tertiary-fixed-dim text-[16px]">
                search
              </span>
              <input
                ref={searchInputRef}
                className="w-full h-7 pl-7 pr-14 sm:pr-16 bg-[#161f2e] text-white placeholder:text-gray-400 text-body-sm font-body-sm rounded border border-gray-600 focus:outline-none focus:border-secondary-container text-xs"
                placeholder="Search services, hosted zones, and docs..."
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
              />
              <span className="absolute right-1.5 hidden sm:flex items-center gap-space-xxs bg-on-tertiary-container px-1.5 py-0.5 rounded text-[10px] font-code-sm text-tertiary-fixed-dim border border-tertiary">
                Alt+S
              </span>
            </div>

            {/* Live Search Command Palette Dropdown */}
            {isSearchOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsSearchOpen(false)}
                />
                <div
                  className="absolute left-0 right-0 top-full mt-1 bg-surface-container-lowest text-on-surface rounded-lg shadow-2xl border border-surface-container-high overflow-hidden z-50 max-h-96 overflow-y-auto divide-y divide-surface-container-high/40 animate-in fade-in slide-in-from-top-1 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  {searchQuery && (
                    <div className="p-2 bg-surface-container-low text-[11px] font-bold text-tertiary uppercase tracking-wider">
                      Matching Hosted Zones ({matchingZones.length})
                    </div>
                  )}
                  {searchQuery && matchingZones.length > 0 && (
                    <div className="p-1">
                      {matchingZones.slice(0, 5).map((zone) => (
                        <Link
                          key={zone.id}
                          href={`/hosted-zones/${zone.id}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="flex items-center justify-between p-2 rounded hover:bg-surface-container-high/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary text-[16px]">public</span>
                            <span className="font-bold text-body-sm">{zone.domain_name}</span>
                          </div>
                          <span className="text-[11px] font-code-sm text-tertiary truncate max-w-[120px]">
                            {zone.id}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="p-2 bg-surface-container-low text-[11px] font-bold text-tertiary uppercase tracking-wider">
                    {searchQuery ? `Matching Services (${matchingServices.length})` : "Quick Navigation"}
                  </div>
                  <div className="p-1">
                    {(searchQuery ? matchingServices : AWS_SERVICES.slice(0, 6)).map((srv, i) => (
                      <Link
                        key={i}
                        href={srv.href}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center justify-between p-2 rounded hover:bg-surface-container-high/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary-container text-[16px]">
                            arrow_outward
                          </span>
                          <span className="font-semibold text-body-sm">{srv.name}</span>
                        </div>
                        <span className="text-[10px] text-tertiary">{srv.category}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Right Section: Install Pill + CloudShell + Notifications + Region + Account + Settings + Logout */}
        {!isAuthPage && (
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Install Web App Pill Button (matching Image 3) */}
            {!isInstalled && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 h-6.5 px-3 rounded-full bg-[#c2e7ff] hover:bg-[#b3dcfb] active:bg-[#9eccf8] text-[#001d35] dark:bg-[#004a77] dark:hover:bg-[#005c94] dark:text-[#c2e7ff] text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
                title="Install AWS Route 53 Web App"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4M12 6.5v6.5m-3-3l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-bold tracking-tight">Install</span>
              </button>
            )}

            {/* CloudShell Button */}
            <button
              onClick={toggleCloudShell}
              className="h-7 px-1.5 sm:px-2 flex items-center justify-center text-white hover:text-primary-fixed transition-colors rounded hover:bg-white/10 cursor-pointer"
              title="AWS CloudShell (CLI)"
              aria-label="Toggle AWS CloudShell Terminal"
            >
              <span className="material-symbols-outlined text-[18px]">terminal</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsServicesOpen(false);
                  setIsSearchOpen(false);
                  setIsRegionOpen(false);
                  setIsAccountOpen(false);
                }}
                className="relative h-7 px-1.5 sm:px-2 flex items-center justify-center text-white hover:text-primary-fixed transition-colors rounded hover:bg-white/10 cursor-pointer"
                title="Notifications"
                aria-label="View notifications"
              >
                <span className="material-symbols-outlined text-[18px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-primary-container text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer Dropdown */}
              {isNotificationsOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-80 sm:w-96 bg-surface-container-lowest text-on-surface rounded-lg shadow-2xl border border-surface-container-high overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-3 border-b border-surface-container-high bg-surface-container-low flex items-center justify-between">
                    <span className="font-bold text-label-md">Notifications ({notifications.length})</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[11px] text-secondary hover:underline font-semibold cursor-pointer"
                      >
                        Mark all read
                      </button>
                      <button
                        onClick={clearNotifications}
                        className="text-[11px] text-tertiary hover:text-on-surface cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-surface-container-high/40">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 transition-colors ${
                            !n.read ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-surface-container"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-body-sm text-on-surface">{n.title}</span>
                            <span className="text-[10px] text-tertiary">{n.time}</span>
                          </div>
                          <p className="text-body-sm text-tertiary">{n.desc}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-body-sm text-tertiary">
                        No active notifications.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Region Selector */}
            <div className="relative hidden md:block">
              <button
                onClick={() => {
                  setIsRegionOpen(!isRegionOpen);
                  setIsServicesOpen(false);
                  setIsSearchOpen(false);
                  setIsNotificationsOpen(false);
                  setIsAccountOpen(false);
                }}
                className="flex items-center gap-1 h-7 px-1.5 sm:px-2 text-white hover:text-primary-fixed text-label-sm font-label-sm transition-colors rounded hover:bg-white/10 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">public</span>
                <span className="truncate max-w-[90px]">{currentRegion}</span>
                <span className="material-symbols-outlined text-[14px]">
                  {isRegionOpen ? "expand_less" : "expand_more"}
                </span>
              </button>

              {/* Region Dropdown */}
              {isRegionOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-64 bg-surface-container-lowest text-on-surface rounded-lg shadow-2xl border border-surface-container-high overflow-hidden z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-2 border-b border-surface-container-high text-[11px] font-bold text-tertiary uppercase">
                    Select AWS Region
                  </div>
                  {REGIONS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setCurrentRegion(r.name.split(" ")[0]);
                        setIsRegionOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-body-sm flex items-center justify-between hover:bg-surface-container transition-colors cursor-pointer ${
                        currentRegion === r.name.split(" ")[0]
                          ? "bg-primary/10 font-bold text-primary"
                          : "text-on-surface"
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{r.name}</p>
                        <p className="text-[10px] text-tertiary">{r.desc}</p>
                      </div>
                      {currentRegion === r.name.split(" ")[0] && (
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Account Dropdown ("Engineering-Prod") */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsAccountOpen(!isAccountOpen);
                  setIsServicesOpen(false);
                  setIsSearchOpen(false);
                  setIsNotificationsOpen(false);
                  setIsRegionOpen(false);
                }}
                className="flex items-center gap-1 h-7 px-1.5 sm:px-2 text-white hover:text-primary-fixed text-label-sm font-label-sm transition-colors rounded hover:bg-white/10 cursor-pointer"
              >
                <span className="truncate max-w-[110px] hidden sm:inline">Engineering-Prod</span>
                <span className="material-symbols-outlined text-[14px]">
                  {isAccountOpen ? "expand_less" : "expand_more"}
                </span>
              </button>

              {/* Account Dropdown Menu */}
              {isAccountOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-72 bg-surface-container-lowest text-on-surface rounded-lg shadow-2xl border border-surface-container-high overflow-hidden z-50 py-2 animate-in fade-in slide-in-from-top-1 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-2 border-b border-surface-container-high bg-surface-container-low">
                    <p className="text-[11px] uppercase font-bold text-tertiary">Signed in as</p>
                    <p className="font-bold text-body-md text-on-surface truncate">Engineering-Prod</p>
                    <p className="text-[11px] font-code-sm text-tertiary mt-0.5">
                      Account ID: <strong className="text-on-surface">1234-5678-9012</strong>
                    </p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsAccountOpen(false)}
                      className="block px-4 py-2 text-body-sm text-on-surface hover:bg-surface-container transition-colors"
                    >
                      Account Settings
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsAccountOpen(false)}
                      className="block px-4 py-2 text-body-sm text-on-surface hover:bg-surface-container transition-colors"
                    >
                      Billing Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setIsAccountOpen(false);
                        setIsSettingsModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-body-sm text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      Preferences
                    </button>
                  </div>
                  <div className="border-t border-surface-container-high pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-body-sm text-error hover:bg-red-500/10 font-bold transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Preferences Settings Gear */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="h-7 px-1.5 sm:px-2 flex items-center justify-center text-white hover:text-primary-fixed transition-colors rounded hover:bg-white/10 cursor-pointer"
              title="Console Preferences"
              aria-label="Open Console Preferences"
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
            </button>

            {/* Profile Avatar & Quick Sign Out */}
            <div className="ml-1 pl-1 border-l border-tertiary flex items-center gap-1.5">
              <img
                alt="Profile"
                className="w-6 h-6 rounded-full object-cover shrink-0 border border-tertiary"
                src="https://lh3.googleusercontent.com/aida/AEtjO1X_EWa96jWAEQem-wkc928PX5IZ-sCmAGNmgQPcTgae4dRWCIzIds25b3pez3bnWg7Bx_7mmZVu3QENRttiYnbo4tktigMVyDGXKxvfgqcuN_zM4Zti2O9BA4PU2LidqUB6sqlh5vYnzDO-mKNLNxzXJgIBI_3E8MlTYbveh0FxN602HxVnB590luImZh5mGBGmSts-iURTUE_-zFywM4betKXkuln2Ta_6CRkcYcCvG-uVs8SAOEJnj4OY"
              />
              <button
                onClick={handleLogout}
                title="Sign out of AWS Console"
                aria-label="Sign out"
                className="text-white hover:text-[#ff9900] text-sm flex items-center p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Console Preferences Modal */}
      <ConsolePreferencesModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Install App Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstalled={() => setIsInstalled(true)}
      />
    </>
  );
}
