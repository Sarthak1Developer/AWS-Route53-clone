"use client";

export default function Header() {
  const handleLogout = () => {
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/login";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-nav-height bg-on-tertiary-container border-b border-tertiary text-on-tertiary flex items-center justify-between px-space-md select-none">
      <div className="flex items-center gap-space-md">
        <div className="flex items-center gap-space-sm">
          <img alt="AWS Route 53 Service Icon" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1Wltdknruls2mSQuZWubw4cvL8g9GCz1ZmhQQtnXUQTApRngvBnixCie1IL_WjjqxL73fdD_UR-pXkR5CxlMDJBV7uMx5WjcYKe3-TLEsopFGIX6cG2jEz7PYxbHcQSpQDKPl9No31uFXSwLjwK8xuUxDkFmv8AhaPT40jokc8gIlyHuacmJRBggIgS-WvxSVISuaMkDCzYhonKAPK-7B3IVPXpdICDowvLpUZIT-aFVbsRuXEW36_5HnDE" />
          <span className="font-title-md text-title-md font-bold tracking-tight text-white">AWS</span>
        </div>
        <button className="flex items-center gap-space-xs text-white hover:text-primary-fixed text-label-sm font-label-sm px-space-xs py-space-xxs rounded transition-colors">
          <span className="material-symbols-outlined text-[16px]">grid_view</span>
          <span className="font-label-sm">Services</span>
          <span className="material-symbols-outlined text-[14px]">expand_more</span>
        </button>
      </div>
      <div className="flex-1 max-w-2xl mx-space-lg">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-space-sm text-tertiary-fixed-dim text-[16px]">search</span>
          <input className="w-full h-7 pl-8 pr-16 bg-on-tertiary-fixed text-white placeholder:text-tertiary text-body-sm font-body-sm rounded border border-tertiary focus:outline-none focus:border-secondary-container" placeholder="Search for services, features, blogs, docs, and more" type="text" />
          <span className="absolute right-space-sm flex items-center gap-space-xxs bg-on-tertiary-container px-space-xs py-0.5 rounded text-[10px] font-code-sm text-tertiary-fixed-dim border border-tertiary">Alt+S</span>
        </div>
      </div>
      <div className="flex items-center gap-space-xs">
        <button className="h-7 px-space-sm flex items-center justify-center text-white hover:text-primary-fixed transition-colors">
          <span className="material-symbols-outlined text-[18px]">terminal</span>
        </button>
        <button className="relative h-7 px-space-sm flex items-center justify-center text-white hover:text-primary-fixed transition-colors">
          <span className="material-symbols-outlined text-[18px]">notifications</span>
          <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-primary-container text-white text-[9px] font-bold rounded-full flex items-center justify-center">1</span>
        </button>
        <button className="flex items-center gap-space-xs h-7 px-space-sm text-white hover:text-primary-fixed text-label-sm font-label-sm transition-colors">
          <span className="material-symbols-outlined text-[16px]">public</span>
          <span>Global</span>
          <span className="material-symbols-outlined text-[14px]">expand_more</span>
        </button>
        <button className="flex items-center gap-space-xs h-7 px-space-sm text-white hover:text-primary-fixed text-label-sm font-label-sm transition-colors">
          <span className="truncate max-w-[140px]">Engineering-Prod</span>
          <span className="material-symbols-outlined text-[14px]">expand_more</span>
        </button>
        <button className="h-7 px-space-sm flex items-center justify-center text-white hover:text-primary-fixed transition-colors">
          <span className="material-symbols-outlined text-[18px]">settings</span>
        </button>
        <div className="ml-space-xs pl-space-xs border-l border-tertiary flex items-center gap-2">
          <img alt="Profile" className="w-6 h-6 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida/AEtjO1X_EWa96jWAEQem-wkc928PX5IZ-sCmAGNmgQPcTgae4dRWCIzIds25b3pez3bnWg7Bx_7mmZVu3QENRttiYnbo4tktigMVyDGXKxvfgqcuN_zM4Zti2O9BA4PU2LidqUB6sqlh5vYnzDO-mKNLNxzXJgIBI_3E8MlTYbveh0FxN602HxVnB590luImZh5mGBGmSts-iURTUE_-zFywM4betKXkuln2Ta_6CRkcYcCvG-uVs8SAOEJnj4OY" />
          <button onClick={handleLogout} className="text-white hover:text-[#ff9900] text-sm flex items-center">
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
