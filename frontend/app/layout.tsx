import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#232f3e",
};

export const metadata: Metadata = {
  title: "AWS Route 53 Management Console",
  description: "Enterprise Cloud DNS and Domain Management Web Application",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Route 53",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="application-name" content="AWS Route 53" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Route 53" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#232f3e" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('route53_theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function(err) {
                      console.log('SW registration note:', err);
                    });
                  });
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-background font-body-md text-on-surface antialiased min-h-screen flex flex-col transition-colors duration-150">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
