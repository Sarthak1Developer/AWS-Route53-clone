"use client";

import { useState, useRef, useEffect } from "react";
import { getHostedZones, getDNSRecords, createHostedZone } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface OutputLine {
  id: string;
  type: "input" | "output" | "error" | "info";
  text: string;
}

export default function CloudShell({ isOpen, onClose }: Props) {
  const [lines, setLines] = useState<OutputLine[]>([
    {
      id: "init-1",
      type: "info",
      text: "Amazon Linux 2023 (Kernel 6.1.0-aws)\nAWS CloudShell v2.4.0 — Connected to us-east-1 (Session: active)\nType 'help' to view available AWS Route 53 CLI commands.",
    },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMaximized, setIsMaximized] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, lines]);

  if (!isOpen) return null;

  const handleCommand = async (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    setHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    const newLines: OutputLine[] = [
      ...lines,
      { id: String(Date.now()), type: "input", text: trimmed },
    ];

    const tokens = trimmed.split(/\s+/);
    const cmd = tokens[0].toLowerCase();

    if (cmd === "clear" || cmd === "cls") {
      setLines([]);
      setInput("");
      return;
    }

    if (cmd === "help") {
      newLines.push({
        id: String(Date.now() + 1),
        type: "output",
        text: `Available commands:
  aws route53 list-hosted-zones
  aws route53 list-resource-record-sets --hosted-zone-id <id>
  aws route53 create-hosted-zone --name <domain.com>
  dig <domain.com> [A|AAAA|MX|TXT|NS|SOA]
  whoami
  date
  clear
  exit`,
      });
    } else if (trimmed.startsWith("aws route53 list-hosted-zones")) {
      try {
        const zones = await getHostedZones();
        newLines.push({
          id: String(Date.now() + 1),
          type: "output",
          text: JSON.stringify(
            {
              HostedZones: zones.map((z) => ({
                Id: `/hostedzone/${z.id}`,
                Name: `${z.domain_name}.`,
                CallerReference: z.id,
                Config: { Comment: z.comment || "", PrivateZone: z.type === "Private" },
                ResourceRecordSetCount: 4,
              })),
            },
            null,
            2
          ),
        });
      } catch (err: any) {
        newLines.push({ id: String(Date.now() + 1), type: "error", text: `Error: ${err.message}` });
      }
    } else if (trimmed.startsWith("aws route53 list-resource-record-sets")) {
      const zoneIdIdx = tokens.indexOf("--hosted-zone-id");
      const zoneId = zoneIdIdx !== -1 ? tokens[zoneIdIdx + 1] : null;
      if (!zoneId) {
        newLines.push({
          id: String(Date.now() + 1),
          type: "error",
          text: "usage: aws route53 list-resource-record-sets --hosted-zone-id <zone-id>",
        });
      } else {
        try {
          const recs = await getDNSRecords(zoneId);
          newLines.push({
            id: String(Date.now() + 1),
            type: "output",
            text: JSON.stringify(
              {
                ResourceRecordSets: recs.map((r) => ({
                  Name: r.record_name,
                  Type: r.record_type,
                  TTL: r.ttl,
                  ResourceRecords: [{ Value: r.value }],
                })),
              },
              null,
              2
            ),
          });
        } catch (err: any) {
          newLines.push({ id: String(Date.now() + 1), type: "error", text: `Error: ${err.message}` });
        }
      }
    } else if (trimmed.startsWith("aws route53 create-hosted-zone")) {
      const nameIdx = tokens.indexOf("--name");
      const domain = nameIdx !== -1 ? tokens[nameIdx + 1] : null;
      if (!domain) {
        newLines.push({
          id: String(Date.now() + 1),
          type: "error",
          text: "usage: aws route53 create-hosted-zone --name <domain.com>",
        });
      } else {
        try {
          const created = await createHostedZone({
            domain_name: domain,
            type: "Public",
            comment: "Created via AWS CloudShell",
          });
          newLines.push({
            id: String(Date.now() + 1),
            type: "output",
            text: JSON.stringify(
              {
                HostedZone: {
                  Id: `/hostedzone/${created.id}`,
                  Name: `${created.domain_name}.`,
                  CallerReference: created.id,
                },
                ChangeInfo: { Status: "PENDING", SubmittedAt: new Date().toISOString() },
              },
              null,
              2
            ),
          });
        } catch (err: any) {
          newLines.push({ id: String(Date.now() + 1), type: "error", text: `Error: ${err.message}` });
        }
      }
    } else if (cmd === "dig") {
      const targetDomain = tokens[1] || "example.com";
      const qtype = (tokens[2] || "A").toUpperCase();
      const ip4 = "192.0.2." + Math.floor(Math.random() * 254 + 1);
      newLines.push({
        id: String(Date.now() + 1),
        type: "output",
        text: `; <<>> DiG 9.18.18-Route53 <<>> ${targetDomain} ${qtype}
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 48123
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 4, ADDITIONAL: 1

;; QUESTION SECTION:
;${targetDomain}.\t\tIN\t${qtype}

;; ANSWER SECTION:
${targetDomain}.\t300\tIN\t${qtype}\t${qtype === "A" ? ip4 : "ns-1.awsdns.org."}

;; Query time: 14 msec
;; SERVER: 169.254.169.253#53(169.254.169.253)
;; WHEN: ${new Date().toUTCString()}
;; MSG SIZE  rcvd: 128`,
      });
    } else if (cmd === "whoami") {
      newLines.push({ id: String(Date.now() + 1), type: "output", text: "arn:aws:iam::123456789012:user/Engineering-Prod" });
    } else if (cmd === "date") {
      newLines.push({ id: String(Date.now() + 1), type: "output", text: new Date().toString() });
    } else if (cmd === "exit") {
      onClose();
      return;
    } else {
      newLines.push({
        id: String(Date.now() + 1),
        type: "error",
        text: `zsh: command not found: ${trimmed}. Type 'help' for valid Route 53 CLI commands.`,
      });
    }

    setLines(newLines);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCommand(input);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIdx);
        setInput(history[nextIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const nextIdx = historyIndex + 1;
        if (nextIdx < history.length) {
          setHistoryIndex(nextIdx);
          setInput(history[nextIdx]);
        } else {
          setHistoryIndex(-1);
          setInput("");
        }
      }
    }
  };

  return (
    <div
      className={`fixed left-0 right-0 bottom-0 z-50 bg-[#12161f] text-[#d1d5db] border-t-2 border-[#ff9900] shadow-2xl flex flex-col font-code-sm transition-all duration-200 ${
        isMaximized ? "top-nav-height h-[calc(100vh-var(--spacing-nav-height))]" : "h-72"
      }`}
    >
      {/* Terminal Titlebar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a2233] border-b border-[#2d3a4f] select-none">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#ff9900] text-[16px]">terminal</span>
          <span className="font-bold text-white text-xs tracking-wide">AWS CloudShell</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] border border-emerald-800">
            Connected (Global)
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 hover:bg-[#2d3a4f] rounded text-[#9ca3af] hover:text-white transition-colors"
            title={isMaximized ? "Restore size" : "Maximize"}
          >
            <span className="material-symbols-outlined text-[15px]">
              {isMaximized ? "close_fullscreen" : "open_in_full"}
            </span>
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-900/60 rounded text-[#9ca3af] hover:text-red-300 transition-colors"
            title="Close CloudShell"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-2 select-text"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line) => (
          <div key={line.id} className="leading-relaxed">
            {line.type === "input" ? (
              <div className="flex items-center gap-2 text-white">
                <span className="text-[#ff9900] font-bold">[cloudshell-user@aws ~]$</span>
                <span>{line.text}</span>
              </div>
            ) : line.type === "error" ? (
              <pre className="text-red-400 whitespace-pre-wrap">{line.text}</pre>
            ) : line.type === "info" ? (
              <pre className="text-[#a5b4fc] whitespace-pre-wrap">{line.text}</pre>
            ) : (
              <pre className="text-emerald-300 whitespace-pre-wrap">{line.text}</pre>
            )}
          </div>
        ))}

        {/* Command Input Prompt */}
        <div className="flex items-center gap-2 text-white pt-1">
          <span className="text-[#ff9900] font-bold shrink-0">[cloudshell-user@aws ~]$</span>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-white font-code-sm focus:ring-0 p-0"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
          />
        </div>
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
