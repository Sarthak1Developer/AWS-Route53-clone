export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col w-full">
      <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-body-sm font-body-sm text-tertiary mb-space-sm">
        <a className="text-secondary hover:underline transition-all" href="#">Amazon Route 53</a>
        <span className="text-tertiary-container text-[12px]">/</span>
        <span className="text-on-surface font-title-md font-bold">{title}</span>
      </nav>

      <div className="flex flex-col items-center justify-center p-12 bg-surface-container-lowest shadow-sm rounded-xl border border-surface-container mt-4 min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-[32px] text-tertiary">construction</span>
        </div>
        <h2 className="text-display-sm font-display-sm text-on-surface mb-2">{title}</h2>
        <p className="text-body-md font-body-md text-tertiary text-center max-w-md mb-6">
          This section is coming soon. The AWS Route 53 Clone is currently focused on Hosted Zones and DNS Records management.
        </p>
        <a href="/hosted-zones" className="h-8 px-space-md bg-primary-container text-on-primary font-title-md text-title-md rounded-lg hover:bg-[#eb5f07] active:bg-[#dd5002] transition-colors shadow-sm flex items-center gap-space-xs">
          Go to Hosted Zones
        </a>
      </div>
    </div>
  );
}
