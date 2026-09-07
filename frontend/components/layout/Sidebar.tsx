"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const getLinkClasses = (path: string) => {
    const isActive = pathname.startsWith(path);
    if (isActive) {
      return "flex items-center pl-space-lg pr-space-md py-space-xs transition-colors bg-surface-container-low text-primary border-l-[3px] border-primary font-bold";
    }
    return "flex items-center pl-space-lg pr-space-md py-space-xs text-body-sm font-body-sm text-on-surface hover:bg-surface-container transition-colors border-l-[3px] border-transparent";
  };

  return (
    <aside className="fixed left-0 top-nav-height bottom-0 w-sidebar-width bg-surface-container-lowest border-r border-surface-container-high z-40 overflow-y-auto">
      <div className="p-space-md border-b border-surface-container-high flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-primary text-[20px]">dns</span>
          <span className="font-headline-sm text-headline-sm text-on-surface">Route 53</span>
        </div>
        <button className="text-tertiary hover:text-on-surface p-space-xxs rounded transition-colors">
          <span className="material-symbols-outlined text-[18px]">menu_open</span>
        </button>
      </div>
      <div className="py-space-sm">
        <div className="px-space-md py-space-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary">DNS management</span>
        </div>
        <nav className="flex flex-col mb-space-sm">
          <Link className={getLinkClasses("/hosted-zones")} href="/hosted-zones">Hosted zones</Link>
          <Link className={getLinkClasses("/traffic-policies")} href="#">Traffic policies</Link>
          <Link className={getLinkClasses("/traffic-policy-records")} href="#">Traffic policy records</Link>
        </nav>
        <div className="px-space-md py-space-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary">Domains</span>
        </div>
        <nav className="flex flex-col mb-space-sm">
          <Link className={getLinkClasses("/registered-domains")} href="#">Registered domains</Link>
          <Link className={getLinkClasses("/transfer-domain")} href="#">Transfer domain</Link>
        </nav>
        <div className="px-space-md py-space-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary">Availability monitoring</span>
        </div>
        <nav className="flex flex-col mb-space-sm">
          <Link className={getLinkClasses("/health-checks")} href="#">Health checks</Link>
        </nav>
        <div className="px-space-md py-space-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary">Resolver</span>
        </div>
        <nav className="flex flex-col mb-space-sm">
          <Link className={getLinkClasses("/vpcs")} href="#">VPCs</Link>
          <Link className={getLinkClasses("/inbound-endpoints")} href="#">Inbound endpoints</Link>
          <Link className={getLinkClasses("/outbound-endpoints")} href="#">Outbound endpoints</Link>
          <Link className={getLinkClasses("/rules")} href="#">Rules</Link>
        </nav>
        <div className="px-space-md py-space-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary">Configuration</span>
        </div>
        <nav className="flex flex-col mb-space-sm">
          <Link className={getLinkClasses("/route-53-profiles")} href="#">Route 53 Profiles</Link>
        </nav>
      </div>
    </aside>
  );
}
