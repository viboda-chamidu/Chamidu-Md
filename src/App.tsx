import React, { useState, useEffect } from "react";
import { 
  Bot, 
  Cpu, 
  Settings, 
  BookOpen, 
  Activity, 
  ShieldCheck, 
  Compass, 
  ChevronDown, 
  Link2,
  Folder,
  Laptop,
  User,
  Shield,
  Briefcase,
  Sparkles,
  Send,
  Volume2,
  Globe,
  ExternalLink,
  MessageSquare,
  Flame,
  Check,
  Copy,
  Github,
  Terminal as TermIcon
} from "lucide-react";
import { ConnectionStatus, SessionMethod, LogEntry, BotFiles } from "./types";
import { PairingWizard } from "./components/PairingWizard";
import { ConsoleLogs } from "./components/ConsoleLogs";
import { CelebrationOverlay } from "./components/CelebrationOverlay";
import { LiveBotCountDashboard } from "./components/LiveBotCountDashboard";
import { AnimatePresence } from "motion/react";

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<"home" | "work" | "commands" | "contact" | "pair">("home");

  // Keyboard backlit color mode
  const [kbColor, setKbColor] = useState<"cyan" | "magenta" | "blue" | "rainbow">("rainbow");

  // Interaction click sound or feedback multiplier
  const [clicksCount, setClicksCount] = useState<number>(0);

  // Contact form submission simulator
  const [contactForm, setContactForm] = useState({ name: "", email: "", msg: "" });
  const [contactSuccess, setContactSuccess] = useState(false);

  // Pairing tool states
  const [method, setMethod] = useState<SessionMethod>("code");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isSimulated, setIsSimulated] = useState<boolean>(true);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [pairingCode, setPairingCode] = useState<string>("9477-ABCD");
  const [qrCode, setQrCode] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [activePairSessionId, setActivePairSessionId] = useState<string>("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [botFiles, setBotFiles] = useState<BotFiles | null>(null);
  const [filesLoading, setFilesLoading] = useState<boolean>(true);
  const [manualSessionId, setManualSessionId] = useState<string>("");
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  
  // Bot services command search states
  const [botCmdSearch, setBotCmdSearch] = useState<string>("");
  const [selectedBotCategory, setSelectedBotCategory] = useState<"all" | "system" | "downloader" | "group" | "automation">("all");

  useEffect(() => {
    // Load default bot configuration files from express backend
    fetch("/api/bot/files")
      .then((res) => res.json())
      .then((data) => {
        setBotFiles(data);
        setFilesLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch bot files:", err);
        setFilesLoading(false);
      });
  }, []);

  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    const now = new Date();
    const timestamp = now.toTimeString().split(" ")[0];
    setLogs((prev) => [...prev, { timestamp, message, type }]);
  };

  const handleResetPairing = () => {
    setStatus("idle");
    setPairingCode("");
    setQrCode("");
    setSessionId("");
    setActivePairSessionId("");
    setLogs([]);
    setLoading(false);
  };

  const handleStartPairing = async () => {
    setLoading(true);
    setLogs([]);
    
    addLog(`Initiating auth chain using ${method.toUpperCase()} authentication.`, "system");
    addLog(`Pipeline target: ${isSimulated ? "Sandbox Virtual Emulator" : "WhatsApp Official Gateway"}.`, "system");

    try {
      const response = await fetch("/api/pair/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          phoneNumber,
          simulate: isSimulated,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to initialize server connection.");
      }

      const { sessionId: sessionToken } = await response.json();
      setActivePairSessionId(sessionToken);
      setStatus("initializing");
      setLoading(false);

      const sseSource = new EventSource(`/api/pair/status?sessionId=${sessionToken}`);
      addLog("Authorization connection established. Listening for server-sent states.", "info");

      sseSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "initial") {
            addLog(`Handshaking completed with session authorization key ${sessionToken}.`, "success");
          } else if (data.type === "status") {
            setStatus(data.status);
            if (data.status === "connecting") {
              addLog("Establishing connection with Meta communication channels...", "info");
            }
          } else if (data.type === "code") {
            setStatus("awaiting_verification");
            setPairingCode(data.code);
            addLog(`Pairing code successfully requested! Code: ${data.code}`, "success");
            addLog("Awaiting WhatsApp input verification code.", "warn");
          } else if (data.type === "qr") {
            setStatus("connecting");
            setQrCode(data.qr);
            addLog("Visual connection code (QR) generated! Awaiting mobile device scan.", "success");
          } else if (data.type === "success") {
            setStatus("success");
            setSessionId(data.sessionId);
            setManualSessionId(data.sessionId);
            setShowCelebration(true);
            addLog("Session authorization successful! Devices linked.", "success");
            addLog(`Encrypted Session Key: ${data.sessionId.substring(0, 30)}...`, "system");
            addLog("Cleaning auth environment on the server for safety.", "info");
            sseSource.close();
          } else if (data.type === "error") {
            setStatus("error");
            setPairingCode(data.error);
            addLog(`System Error: ${data.error}`, "error");
            sseSource.close();
          }
        } catch (err: any) {
          console.error("SSE parsing error", err);
        }
      };

      sseSource.onerror = (err) => {
        console.error("SSE connection closed natively", err);
        addLog("Event packet stream disconnected.", "warn");
        sseSource.close();
      };

    } catch (err: any) {
      setLoading(false);
      setStatus("error");
      setPairingCode(err.message || "An unknown exception occurred during transport layer creation.");
      addLog(`Pairing trigger failed: ${err.message}`, "error");
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactForm.name && contactForm.email && contactForm.msg) {
      setContactSuccess(true);
      setTimeout(() => {
        setContactSuccess(false);
        setContactForm({ name: "", email: "", msg: "" });
      }, 4000);
    }
  };

  const handleKeyboardClick = () => {
    setClicksCount(prev => prev + 1);
    const colors: ("cyan" | "magenta" | "blue" | "rainbow")[] = ["cyan", "magenta", "blue", "rainbow"];
    const currentIndex = colors.indexOf(kbColor);
    const nextIndex = (currentIndex + 1) % colors.length;
    setKbColor(colors[nextIndex]);
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-slate-200 select-text relative overflow-x-hidden flex flex-col justify-between">
      
      {/* Immersive Studio Room Ambient Neon Lights */}
      <div className="absolute top-10 left-1/4 w-[45%] aspect-square bg-[#00f0ff]/10 rounded-full blur-[140px] pointer-events-none animate-pulse duration-[6000ms]" />
      <div className="absolute top-40 right-1/4 w-[40%] aspect-square bg-[#ff007f]/08 rounded-full blur-[160px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute top-[60%] left-1/3 w-[50%] aspect-square bg-[#3b82f6]/06 rounded-full blur-[180px] pointer-events-none animate-pulse duration-[7000ms]" />

      {/* Main Full-Screen Layout Wrapper */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 flex flex-col z-10">
        
        {/* Full-Screen Web Container with Rotating Hardware Glow Border */}
        <div className="glowing-hardware-wrapper flex-1 flex flex-col min-h-[600px] md:min-h-[720px] shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <div className="glowing-hardware-inner flex-1 bg-[#09090c]/90 p-5 sm:p-8 md:p-10 flex flex-col relative min-h-[600px] md:min-h-[720px] backdrop-blur-xl">
            
            {/* Header: CHAMIDU MD */}
            <header className="border-b border-zinc-800/80 pb-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 bg-gradient-to-tr from-[#00f0ff]/20 to-[#ff007f]/20 border border-[#00f0ff]/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                  <Flame className="w-5 h-5 text-[#00f0ff] animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold tracking-wider text-xl font-mono text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#00f0ff]">CHAMIDU MD</span>
                    <span className="text-[9px] uppercase font-mono font-bold bg-[#ff007f]/10 text-[#ff007f] border border-[#ff007f]/20 px-1.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(255,0,127,0.1)]">PRO</span>
                  </div>
                  <p className="text-[10px] text-zinc-550 font-medium tracking-wide uppercase">Interactive Engineering Portfolio</p>
                </div>
              </div>

              {/* Clean Navigation Menu inside monitor */}
              <nav className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 bg-zinc-950/60 p-1 rounded-xl border border-zinc-900/60">
                <button
                  onClick={() => setActiveTab("home")}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer font-medium ${
                    activeTab === "home"
                      ? "bg-gradient-to-r from-[#00f0ff]/15 to-[#3b82f6]/15 border-b border-[#00f0ff]/50 text-white shadow-[0_0_12px_rgba(0,240,255,0.05)]"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => setActiveTab("commands")}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer font-medium ${
                    activeTab === "commands"
                      ? "bg-gradient-to-r from-[#00f0ff]/15 to-[#3b82f6]/15 border-b border-[#00f0ff]/50 text-white shadow-[0_0_12px_rgba(0,240,255,0.05)]"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  Commands
                </button>
                <button
                  onClick={() => setActiveTab("contact")}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer font-medium ${
                    activeTab === "contact"
                      ? "bg-gradient-to-r from-[#00f0ff]/15 to-[#3b82f6]/15 border-b border-[#00f0ff]/50 text-white shadow-[0_0_12px_rgba(0,240,255,0.05)]"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  Contact
                </button>
                <div className="w-px h-4 bg-zinc-800 mx-1 hidden sm:block" />
                <a
                  href="https://github.com/viboda-chamidu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-medium text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  title="View GitHub Profile"
                >
                  <Github className="w-3.5 h-3.5 text-[#00f0ff]" />
                  <span>GitHub</span>
                </a>
                <button
                  onClick={() => setActiveTab("pair")}
                  className={`px-3.5 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer font-bold select-none border ${
                    activeTab === "pair"
                      ? "bg-gradient-to-r from-[#ff007f]/20 to-pink-500/20 border-[#ff007f]/50 text-pink-300 shadow-[0_0_15px_rgba(255,0,127,0.2)] animate-pulse"
                      : "bg-gradient-to-r from-[#00f0ff]/10 to-blue-500/10 hover:from-[#00f0ff]/20 hover:to-blue-500/20 text-[#00f0ff] border-[#00f0ff]/30 shadow-[0_0_10px_rgba(0,240,255,0.05)]"
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 animate-bounce" />
                  <span>Pair Site</span>
                </button>
              </nav>
            </header>

            {/* SCREEN VIEWPORT CONTENT AREA WITH FADE EFFECTS */}
            <div className="flex-1 flex flex-col justify-between">
              
              {/* TAB 1: HOME */}
              {activeTab === "home" && (
                <div className="space-y-8 animate-fadeIn duration-500 select-text">
                  
                  {/* Hero Block */}
                  <div className="p-8 sm:p-12 rounded-3xl bg-zinc-950/40 border border-zinc-800/80 relative overflow-hidden backdrop-blur-sm shadow-xl flex flex-col justify-between min-h-[280px]">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00f0ff]/60 to-transparent" />
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 text-[#00f0ff] font-mono text-[10px] uppercase tracking-widest font-bold">
                        <Activity className="w-3.5 h-3.5 animate-spin" />
                        <span>INTERACTIVE SHOWCASE DIRECTORY</span>
                      </div>
                      
                      <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-none glow-text">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-[#3b82f6] to-[#ff007f]">
                          AUTOMATION NEXT GEN OF CHAMIDU MD
                        </span>
                      </h1>
                      
                      <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl leading-relaxed font-sans">
                        Welcome to my professional creative workspace. Harnessing the raw velocity of Node, react-mesh, cloud servers, and full-stack API pipelines. Pair your site below or inspect any modular node.
                      </p>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-4 items-center">
                      <button
                        onClick={() => setActiveTab("pair")}
                        className="px-6 py-3 bg-gradient-to-r from-[#ff007f]/20 to-pink-500/20 border border-[#ff007f]/50 text-pink-300 font-bold text-xs uppercase tracking-wider rounded-xl hover:text-white hover:border-[#ff007f] transition-all cursor-pointer flex items-center gap-2 hover:shadow-[0_0_15px_rgba(255,0,127,0.15)] animate-pulse"
                      >
                        <Bot className="w-4 h-4 text-[#ff007f]" />
                        <span>Deploy / Link Partner WhatsApp bot</span>
                      </button>
                    </div>
                  </div>

                  {/* LIVE BOT COUNT DASHBOARD */}
                  <LiveBotCountDashboard 
                    pairedSessionId={sessionId || undefined}
                    pairedPhoneNumber={phoneNumber || undefined}
                    isSimulatedPipeline={isSimulated}
                  />

                  {/* Showcase Recent Projects Header */}
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 font-mono">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]"></span>
                      <span>RECENT PROJECTS DIRECTORY</span>
                    </h2>
                    <p className="text-xs text-zinc-500 font-sans mt-1">High fidelity integrations with glowing neon borders and verified components</p>
                  </div>

                  {/* Recents Projects Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* CARD 1: WHATSAPP BOT PORTAL (OUR REAL MODULE) */}
                    <div className="bg-[#0b0b0f] border border-zinc-800 rounded-2xl p-5 hover:translate-y-[-4px] transition-all duration-300 flex flex-col justify-between border-neon-cyan relative group">
                      <div className="absolute top-3 right-3">
                        <span className="text-[9px] font-mono bg-emerald-950/50 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full animate-pulse">ACTIVE PIPELINE</span>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00f0ff]/10 to-blue-500/10 border border-[#00f0ff]/20 flex items-center justify-center">
                          <Bot className="w-6 h-6 text-[#00f0ff]" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-sm tracking-tight text-white font-mono group-hover:text-[#00f0ff] transition-colors">VIBODA-CHAMIDU-MD SESSION GATE</h3>
                          <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                            Enterprise session sync gateway using WebSockets and multi-device auth sockets to build state files.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-zinc-900 flex justify-between items-center">
                        <span className="text-[10px] text-zinc-500 font-mono">React v18 + Baileys</span>
                        <button
                          onClick={() => setActiveTab("pair")}
                          className="text-xs text-[#00f0ff] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <span>Open Pair Portal</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* CARD 2: NEURAL INTEL CORE */}
                    <div className="bg-[#0b0b0f] border border-zinc-800 rounded-2xl p-5 hover:translate-y-[-4px] transition-all duration-300 flex flex-col justify-between border-neon-magenta relative group">
                      <div className="absolute top-3 right-3">
                        <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded-full">SIMULATED</span>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff007f]/10 to-pink-500/10 border border-[#ff007f]/30 flex items-center justify-center">
                          <Cpu className="w-6 h-6 text-[#ff007f]" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-sm tracking-tight text-white font-mono group-hover:text-[#ff007f] transition-colors">NEURAL CODE ANALYSIS PIPELINE</h3>
                          <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                            Subtle telemetry dashboard visualizer with custom AI analyzer nodes, compiling static typescript.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-zinc-900 flex justify-between items-center">
                        <span className="text-[10px] text-zinc-500 font-mono">D3 Charts + Node.js</span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans font-semibold">Protected</span>
                      </div>
                    </div>

                    {/* CARD 3: METEOR SECURE VPN */}
                    <div className="bg-[#0b0b0f] border border-zinc-800 rounded-2xl p-5 hover:translate-y-[-4px] transition-all duration-300 flex flex-col justify-between border-neon-blue relative group">
                      <div className="absolute top-3 right-3">
                        <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded-full">SANDBOXED</span>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 flex items-center justify-center">
                          <ShieldCheck className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-sm tracking-tight text-white font-mono group-hover:text-blue-400 transition-colors">SECURE CYBER MESH COMPASS</h3>
                          <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                            Isolated dynamic DNS tunnels providing raw routing protocols directly into secure workspace networks.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-zinc-900 flex justify-between items-center">
                        <span className="text-[10px] text-zinc-500 font-mono">Go + TLS Mesh</span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans font-semibold">Active</span>
                      </div>
                    </div>

                  </div>
                </div>
              )}



              {/* TAB 3: COMMANDS */}
              {activeTab === "commands" && (
                <div className="space-y-8 animate-fadeIn duration-500 select-text">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-[#ff007f] font-mono flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff007f] shadow-[0_0_8px_#ff007f]"></span>
                      CHAMIDU MD BOT COMMANDS
                    </h2>
                    <p className="text-xs text-zinc-400 font-sans mt-1">Explore and search the complete list of WhatsApp bot client commands and automated service pipelines.</p>
                  </div>

                  {/* NEON BOT SERVICES COMMANDS REGISTRY */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950/40 border border-zinc-850/80 relative overflow-hidden space-y-6">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-[#ff007f]/05 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#00f0ff]/05 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ff007f]/20 pb-4">
                      <div>
                        <span className="text-[10px] text-[#00f0ff] uppercase tracking-widest font-bold block font-mono">Chamidu MD Automation</span>
                        <h3 className="text-xl font-extrabold tracking-tight text-white font-mono flex items-center gap-2">
                          <Bot className="w-5 h-5 text-[#ff007f]" />
                          <span>BOT SERVICES COMMAND REGISTRY</span>
                        </h3>
                        <p className="text-[11px] text-zinc-500 font-sans mt-0.5">Explore standard and interactive WhatsApp bot client procedures.</p>
                      </div>

                      {/* Interactive Live Search Box with glowing borders */}
                      <div className="relative max-w-xs w-full">
                        <input
                          type="text"
                          value={botCmdSearch}
                          onChange={(e) => setBotCmdSearch(e.target.value)}
                          placeholder="Search e.g. .play..."
                          className="w-full px-3.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-[#00f0ff] placeholder-zinc-700 focus:border-[#ff007f] focus:outline-none transition-all focus:shadow-[0_0_12px_rgba(255,0,127,0.15)]"
                        />
                      </div>
                    </div>

                    {/* Active Service Status Pipeline Top Display */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-zinc-950/85 border border-[#00f0ff]/20 hover:border-[#ff007f]/30 transition-colors relative overflow-hidden shadow-[0_0_15px_rgba(0,240,255,0.05)]">
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent" />
                      
                      <div className="space-y-1">
                        <span className="text-[8px] text-zinc-550 font-mono font-bold uppercase tracking-widest block">Main Controller</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          <span className="text-xs font-mono font-bold text-white uppercase tracking-tight">ACTIVE // LIVE</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] text-zinc-550 font-mono font-bold uppercase tracking-widest block">Socket Gateway</span>
                        <span className="text-xs font-mono font-bold text-[#00f0ff] uppercase tracking-wide block">
                          STABLE CONNECT
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] text-zinc-550 font-mono font-bold uppercase tracking-widest block">Response Latency</span>
                        <span className="text-xs font-mono font-bold text-emerald-400 block">
                          ~34ms LATENCY
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] text-zinc-550 font-mono font-bold uppercase tracking-widest block">Credentials Hub</span>
                        <span className="text-xs font-mono font-bold text-[#ff007f] uppercase tracking-wider block">
                          HANDSHAKE OK
                        </span>
                      </div>
                    </div>

                    {/* Neon Category Buttons */}
                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                      {[
                        { id: "all", label: "ALL COMMANDS", color: "hover:border-[#00f0ff]/50 active:text-[#00f0ff]" },
                        { id: "system", label: "SYSTEM COMMANDS", color: "hover:border-[#00f0ff]/50 active:text-[#00f0ff]" },
                        { id: "downloader", label: "DOWNLOADERS", color: "hover:border-[#ff007f]/50 active:text-[#ff007f]" },
                        { id: "group", label: "GROUP CONTROLS", color: "hover:border-purple-500/50 active:text-purple-400" },
                        { id: "automation", label: "AUTOMATION", color: "hover:border-emerald-500/50 active:text-emerald-400" },
                      ].map((cat) => {
                        const isActive = selectedBotCategory === cat.id;
                        let activeStyle = "";
                        if (isActive) {
                          if (cat.id === "all") activeStyle = "bg-zinc-900 border-[#00f0ff] text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.15)]";
                          else if (cat.id === "system") activeStyle = "bg-zinc-900 border-[#00f0ff] text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.15)]";
                          else if (cat.id === "downloader") activeStyle = "bg-zinc-900 border-[#ff007f] text-[#ff007f] shadow-[0_0_10px_rgba(255,0,127,0.15)]";
                          else if (cat.id === "group") activeStyle = "bg-zinc-900 border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.15)]";
                          else if (cat.id === "automation") activeStyle = "bg-zinc-900 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
                        } else {
                          activeStyle = "bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-white";
                        }

                        return (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedBotCategory(cat.id as any)}
                            className={`px-3 py-1.5 rounded-lg border text-[10px] sm:text-xs font-bold transition-all duration-300 cursor-pointer ${activeStyle}`}
                          >
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Live commands renderer */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {[
                        { group: "system", name: ".menu", desc: "Retrieve interactive catalogue of available modules.", status: "Online" },
                        { group: "system", name: ".ping", desc: "Test real-time socket handshaking latency.", status: "Online" },
                        { group: "system", name: ".alive", desc: "Fetch active connection statuses and memory logs.", status: "Online" },
                        { group: "system", name: ".uptime", desc: "Output container runtime duration of Chamidu MD.", status: "Online" },
                        { group: "system", name: ".owner", desc: "Present credential cards of Viboda Chamidu.", status: "Online" },
                        { group: "downloader", name: ".play", desc: "Search and pull sound streams from database hubs.", status: "Online" },
                        { group: "downloader", name: ".video", desc: "Locate and fetch optimized visual MP4 clusters.", status: "Online" },
                        { group: "downloader", name: ".tiktok", desc: "Fetch untagged video packages from TikTok links.", status: "Online" },
                        { group: "downloader", name: ".fb", desc: "Translate and fetch HD Facebook video links.", status: "Online" },
                        { group: "downloader", name: ".apk", desc: "Extract safe binary mobile packages natively.", status: "Online" },
                        { group: "group", name: ".promote", desc: "Grant administrator locks to numeric targets.", status: "Online" },
                        { group: "group", name: ".demote", desc: "Revoke privileges of specified participant lines.", status: "Online" },
                        { group: "group", name: ".kick", desc: "Purge specified targets from connection pools.", status: "Online" },
                        { group: "group", name: ".tagall", desc: "Alert all listed thread nodes at once.", status: "Online" },
                        { group: "group", name: ".hidetag", desc: "Expose packet headers quietly to thread participants.", status: "Online" },
                        { group: "automation", name: ".autoreply", desc: "Assign custom replies to scheduled chat flows.", status: "Online" },
                        { group: "automation", name: ".welcome", desc: "Automate neon greetings for joining thread members.", status: "Online" },
                        { group: "automation", name: ".chatbot", desc: "Spawn isolated server-side Gemini bot instances.", status: "Online" },
                        { group: "automation", name: ".antilink", desc: "Sanitize chats and eject unauthorized redirect links.", status: "Online" },
                      ]
                        .filter((cmd) => {
                          const matchesCat = selectedBotCategory === "all" || cmd.group === selectedBotCategory;
                          const matchesSearch = cmd.name.toLowerCase().includes(botCmdSearch.toLowerCase()) || 
                                                cmd.desc.toLowerCase().includes(botCmdSearch.toLowerCase());
                          return matchesCat && matchesSearch;
                        })
                        .map((cmd) => {
                          let neonBadgeColor = "text-[#00f0ff] bg-[#00f0ff]/10 border-[#00f0ff]/20 shadow-[0_0_8px_rgba(0,240,255,0.05)]";
                          if (cmd.group === "downloader") neonBadgeColor = "text-[#ff007f] bg-[#ff007f]/10 border-[#ff007f]/20 shadow-[0_0_8px_rgba(255,0,127,0.05)]";
                          else if (cmd.group === "group") neonBadgeColor = "text-purple-400 bg-purple-950/30 border-purple-900/40 shadow-[0_0_8px_rgba(168,85,247,0.05)]";
                          else if (cmd.group === "automation") neonBadgeColor = "text-emerald-400 bg-emerald-950/30 border-emerald-900/40 shadow-[0_0_8px_rgba(16,185,129,0.05)]";

                          return (
                            <div 
                              key={cmd.name}
                              className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-900 hover:border-zinc-800 transition-all flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md hover:-translate-y-[1px] duration-300"
                            >
                              <div className="flex items-center justify-between">
                                <span className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border ${neonBadgeColor}`}>
                                  {cmd.name}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse block"></span>
                                  <span className="text-[9px] font-mono font-semibold text-zinc-550 uppercase tracking-widest">
                                    {cmd.status}
                                  </span>
                                </div>
                              </div>

                              <p className="text-[11px] text-zinc-400 leading-normal font-sans">
                                {cmd.desc}
                              </p>

                              <div className="flex items-center justify-between pt-1 border-t border-zinc-900/60 text-[9px] font-mono text-zinc-600">
                                <span>TYPE: {cmd.group.toUpperCase()}</span>
                                <span>VERIFIED OK</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: CONTACT */}
              {activeTab === "contact" && (
                <div className="space-y-6 animate-fadeIn duration-500 select-text">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
                      <MessageSquare className="w-6 h-6 text-[#00f0ff]" />
                      <span>ESTABLISH SECURE LINK</span>
                    </h2>
                    <p className="text-xs text-zinc-400 font-sans mt-1">Submit your message telemetry. Our nodes will process immediately.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Owner Credentials Card */}
                    <div className="bg-zinc-950/80 border border-zinc-800 p-6 rounded-2xl relative shadow-2xl flex flex-col justify-between overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00f0ff]/50 to-transparent" />
                      
                      <div className="space-y-6">
                        <div>
                          <span className="text-[10px] text-[#00f0ff] font-mono uppercase font-bold tracking-widest block mb-1">STATION ADMINISTRATOR</span>
                          <h3 className="text-xl font-bold tracking-tight text-white font-mono uppercase">Viboda Chamidu</h3>
                          <p className="text-xs text-zinc-500 font-sans mt-1">Primary owner and systems builder at CHAMIDU MD Labs.</p>
                        </div>

                        <div className="space-y-4 font-mono text-xs">
                          <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-850 flex items-center justify-between group hover:border-[#00f0ff]/30 transition-all">
                            <div className="space-y-0.5">
                              <span className="text-[9px] text-zinc-500 block uppercase font-bold">SYSTEM OWNER</span>
                              <span className="text-zinc-300 font-semibold text-xs text-white">Viboda Chamidu</span>
                            </div>
                            <User className="w-4.5 h-4.5 text-zinc-600 group-hover:text-[#00f0ff] transition-colors" />
                          </div>

                          <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-850 flex items-center justify-between group hover:border-[#00f0ff]/30 transition-all">
                            <div className="space-y-0.5">
                              <span className="text-[9px] text-zinc-500 block uppercase font-bold">Secure Email Gateway</span>
                              <a href="mailto:vibdachamiduyt@gmail.com" className="text-[#00f0ff] hover:underline font-semibold text-xs block">
                                vibdachamiduyt@gmail.com
                              </a>
                            </div>
                            <Send className="w-4.5 h-4.5 text-zinc-600 group-hover:text-[#00f0ff] transition-colors" />
                          </div>

                          <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-850 flex items-center justify-between group hover:border-[#ff007f]/30 transition-all">
                            <div className="space-y-0.5">
                              <span className="text-[9px] text-zinc-500 block uppercase font-bold">WHATSAPP DIRECT CHANNEL</span>
                              <a href="https://wa.me/94723105073" target="_blank" rel="noopener noreferrer" className="text-[#ff007f] hover:underline font-semibold text-xs flex items-center gap-1.5">
                                +94723105073
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <MessageSquare className="w-4.5 h-4.5 text-zinc-600 group-hover:text-[#ff007f] transition-colors" />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-6 border-t border-zinc-900 text-[10px] text-zinc-600">
                        <span>ESTABLISHED PIPELINE SYNC // SECURE RSA SHIELD</span>
                      </div>
                    </div>

                    {/* Messages Telemetry Form */}
                    <div className="bg-zinc-950/80 border border-zinc-800 p-6 rounded-2xl relative shadow-2xl">
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#ff007f]/50 to-transparent" />
                      
                      {contactSuccess ? (
                        <div className="py-12 text-center space-y-3 animate-fadeIn">
                          <div className="w-12 h-12 rounded-full bg-emerald-950/50 border border-emerald-500 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                            <Check className="w-6 h-6 text-emerald-400" />
                          </div>
                          <h4 className="text-white font-mono font-bold">TELEMETRY TRANSMITTED!</h4>
                          <p className="text-xs text-zinc-550 max-w-xs mx-auto">Your system link requests are queued. Real-time feedback dispatched to developer console.</p>
                        </div>
                      ) : (
                        <form onSubmit={handleContactSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-wider block">Sender Name</label>
                              <input
                                type="text"
                                required
                                placeholder="Operator Name"
                                value={contactForm.name}
                                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs hover:border-zinc-700 focus:border-[#00f0ff] focus:outline-none font-mono text-[#00f0ff] transition-all"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-wider block">Transmission Node (Email)</label>
                              <input
                                type="email"
                                required
                                placeholder="operator@system.mesh"
                                value={contactForm.email}
                                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs hover:border-zinc-700 focus:border-[#00f0ff] focus:outline-none font-mono text-[#00f0ff] transition-all"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-wider block">Message Payload</label>
                            <textarea
                              required
                              rows={3}
                              placeholder="Type your transmission message here..."
                              value={contactForm.msg}
                              onChange={(e) => setContactForm({ ...contactForm, msg: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs hover:border-zinc-700 focus:border-[#ff007f] focus:outline-none font-mono text-[#ff007f] transition-all resize-none"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-[#00f0ff] via-blue-600 to-[#ff007f] text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-[0_0_15px_rgba(255,0,127,0.15)]"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Transmit Secure Cargo</span>
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: REAL PAIR BOT FUNCTIONALITY (INTEGRATED FULLY) */}
              {activeTab === "pair" && (
                <div className="space-y-6 animate-fadeIn duration-500 select-text">
                  
                  {/* Alert panel and return instructions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 bg-zinc-950 border border-zinc-850 rounded-2xl gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <div>
                        <span className="text-xs font-bold text-white block">WhatsApp Bot Session Synchronization Mesh</span>
                        <span className="text-[10px] text-zinc-550 block">Direct Baileys Node Socket initialized and stable.</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("home")}
                      className="px-3.5 py-1.5 text-[10px] uppercase font-mono font-bold bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 rounded-lg hover:bg-[#00f0ff]/20 transition-all cursor-pointer text-center"
                    >
                      ← Back to Portfolio
                    </button>
                  </div>

                  {/* Manual session sync block */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Settings className="w-4 h-4 text-[#ff007f]" />
                          <span>Inject credentials manually</span>
                        </h4>
                        <p className="text-[10px] text-zinc-500">Already obtained a valid token stream? Inject it to instantly configure templates.</p>
                      </div>
                      
                      <div className="flex-1 max-w-sm flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Paste key e.g. VIBODA-CHAMIDU-MD;;;..."
                          value={manualSessionId}
                          onChange={(e) => {
                            setManualSessionId(e.target.value);
                          }}
                          className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 focus:border-[#00f0ff] focus:outline-none rounded-xl text-xs font-mono text-[#00f0ff] placeholder-zinc-800 font-semibold transition-all shadow-inner"
                        />
                        <button
                          onClick={() => {
                            if (manualSessionId.trim()) {
                              setSessionId(manualSessionId.trim());
                              setStatus("success");
                              setShowCelebration(true);
                              addLog(`Manual Credentials Injected successfully. Key length: ${manualSessionId.trim().length} characters.`, "success");
                            }
                          }}
                          className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-[10px] rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-md"
                        >
                          Inject
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Main Pairing Platform: Wizard & Logs side by side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <PairingWizard
                      method={method}
                      setMethod={setMethod}
                      phoneNumber={phoneNumber}
                      setPhoneNumber={setPhoneNumber}
                      isSimulated={isSimulated}
                      setIsSimulated={setIsSimulated}
                      status={status}
                      pairingCode={pairingCode}
                      qrCode={qrCode}
                      loading={loading}
                      onStartPairing={handleStartPairing}
                      onResetPairing={handleResetPairing}
                      sessionId={sessionId}
                    />

                    <ConsoleLogs 
                      logs={logs} 
                      status={status} 
                    />
                  </div>

                </div>
              )}

            </div>

            {/* Bottom mini status bar inside monitor */}
            <div className="border-t border-zinc-900 pt-3 mt-6 flex justify-between items-center text-[10px] text-zinc-650 font-mono">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00f0ff]" /> End-to-end sandbox execution active.
              </span>
              <span className="hidden sm:inline">SYSTEM STATE: ONLINE</span>
            </div>

          </div>
        </div>

      </div>

      {/* Modern Cyber Footer */}
      <footer className="text-[#c1c3cc]/60 text-center text-[10px] text-zinc-650 py-6 space-y-2 select-text z-10 border-t border-[#12121a] bg-zinc-950/25 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-zinc-550 leading-relaxed max-w-md text-left">
            Interactive control suite for secure automated linkages of WhatsApp bots and digital configurations. Responsive, high-fidelity operations center.
          </p>
          <div className="text-zinc-500 font-mono font-semibold uppercase tracking-widest text-[9px] text-right">
            CHAMIDU MD Lab Operations • 2026 Stable Pipeline Outlines
          </div>
        </div>
      </footer>

      {/* Celebratory particles effect overlay */}
      <AnimatePresence>
        {status === "success" && showCelebration && (
          <CelebrationOverlay 
            sessionId={sessionId} 
            onComplete={() => setShowCelebration(false)} 
          />
        )}
      </AnimatePresence>

    </div>
  );
}
