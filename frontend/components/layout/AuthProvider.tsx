"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has auth token cookie
    const hasToken = document.cookie.includes("auth_token=");
    
    if (!hasToken && pathname !== "/login") {
      router.push("/login");
    } else if (hasToken && pathname === "/login") {
      router.push("/hosted-zones");
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  if (isAuthenticated === null) {
    return <div className="min-h-screen bg-[#f2f3f3]" />; // Loader background
  }

  return <>{children}</>;
}
