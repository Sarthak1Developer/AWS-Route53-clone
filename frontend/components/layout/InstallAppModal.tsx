"use client";

import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstalled: () => void;
}

export default function InstallAppModal({ isOpen, onClose, deferredPrompt, onInstalled }: Props) {
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setInstalling(false);
      if (outcome === "accepted") {
        onInstalled();
        onClose();
      }
    } else {
      // Create and trigger PWA Desktop Web App Launcher download
      downloadAppLauncher();
    }
  };

  const downloadAppLauncher = () => {
    const launcherHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AWS Route 53 Management Console</title>
  <meta http-equiv="refresh" content="0; url=${window.location.origin}/hosted-zones">
  <script>window.location.href = "${window.location.origin}/hosted-zones";</script>
</head>
<body style="font-family: sans-serif; text-align: center; padding: 40px; background: #232f3e; color: white;">
  <h2>Opening AWS Route 53 Console...</h2>
  <p>If you are not redirected automatically, <a style="color: #ff9900;" href="${window.location.origin}/hosted-zones">click here</a>.</p>
</body>
</html>`;
    const blob = new Blob([launcherHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "AWS-Route53-Console.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-surface-container-lowest border border-surface-container-high rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container-high bg-surface-container-low/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary-container">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4M12 7v6m-3-3l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Install AWS Route 53 App</h2>
          </div>
          <button
            onClick={onClose}
            className="text-tertiary hover:text-on-surface p-1 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4 text-body-sm">
          <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border border-surface-container-high">
            <img
              src="/icon-192.png"
              alt="Route 53"
              className="w-12 h-12 rounded-lg object-cover shadow-xs shrink-0"
            />
            <div>
              <p className="font-bold text-on-surface text-base">AWS Route 53 Console</p>
              <p className="text-xs text-tertiary">Progressive Web Application (Standalone)</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                ✓ Offline Shell • Fast DNS Management
              </p>
            </div>
          </div>

          <p className="text-tertiary">
            Install this web application on your device to launch it in a standalone window directly from your desktop or home screen without browser tabs.
          </p>

          <div className="space-y-2 text-xs text-tertiary bg-surface-container-low/60 p-3 rounded-lg border border-surface-container-high/60">
            <p className="font-bold text-on-surface">How to install in your browser:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Chrome / Edge:</strong> Click the <strong>Install</strong> button below, or click the install icon in the URL address bar.
              </li>
              <li>
                <strong>Safari (iOS / macOS):</strong> Tap Share <span className="font-bold">⎋</span> and select <strong>&quot;Add to Home Screen&quot;</strong> or <strong>&quot;Add to Dock&quot;</strong>.
              </li>
              <li>
                <strong>Other Browsers:</strong> Click below to download the direct standalone desktop launcher.
              </li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-surface-container-high bg-surface-container-low flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-label-md font-bold rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleNativeInstall}
            disabled={installing}
            type="button"
            className="px-5 py-2 bg-primary-container hover:bg-surface-tint text-white text-label-md font-bold rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4M12 7v6m-3-3l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{deferredPrompt ? (installing ? "Installing..." : "Install App") : "Download Launcher"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
