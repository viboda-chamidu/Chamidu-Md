import React, { useState, useEffect } from "react";
import { 
  Bot, 
  Cpu, 
  Network, 
  Zap, 
  Plus, 
  ShieldAlert, 
  Activity, 
  RefreshCw,
  Clock,
  Radio,
  Server
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ConnectedBot {
  id: string;
  name: string;
  phone: string;
  status: "online" | "offline" | "connecting";
  uptime: string;
  processed: number;
  country: string;
  platform: "Live Port" | "Sandbox Demo";
}

interface LiveBotCountDashboardProps {
  pairedSessionId?: string;
  pairedPhoneNumber?: string;
  isSimulatedPipeline?: boolean;
}

export const LiveBotCountDashboard: React.FC<LiveBotCountDashboardProps> = ({
  pairedSessionId,
  pairedPhoneNumber,
  isSimulatedPipeline
}) => {
  // Store default bots
  const [bots, setBots] = useState<ConnectedBot[]>([
    {
      id: "bot-1",
      name: "CHAMIDU-CORE-MD",
      phone: "+94 723 105 073",
      status: "online",
      uptime: "34d 08h 12m",
      processed: 14892,
      country: "Sri Lanka",
      platform: "Live Port",
    },
    {
      id: "bot-2",
      name: "HELPER-NODE-01",
      phone: "+91 901 234 5678",
      status: "online",
      uptime: "12d 15h 41m",
      processed: 8942,
      country: "India",
      platform: "Live Port",
    },
    {
      id: "bot-3",
      name: "GROUP-RESPONDER-X",
      phone: "+1 415 555 2671",
      status: "online",
      uptime: "02d 04h 15m",
      processed: 1205,
      country: "United States",
      platform: "Sandbox Demo",
    },
  ]);

  const [simulatedEvents, setSimulatedEvents] = useState<string[]>([
    "CHAMIDU-CORE-MD synchronized group meta catalogs.",
    "HELPER-NODE-01 processed request callback for target +91xxxxx.",
    "Awaiting device connection linkage in Pair Site tab."
  ]);

  // Keep track of spawned bots counter
  const [spawnCounter, setSpawnCounter] = useState(1);

  // Auto-inject the paired session bot if it exists
  useEffect(() => {
    if (pairedSessionId) {
      // Check if already contains this session ID
      const hasBot = bots.some(b => b.id === pairedSessionId);
      if (!hasBot) {
        const newBot: ConnectedBot = {
          id: pairedSessionId,
          name: `NEW-LINKED-BOT-${pairedSessionId.substring(0, 4).toUpperCase()}`,
          phone: pairedPhoneNumber ? `+${pairedPhoneNumber}` : "+94 712 345 678",
          status: "online",
          uptime: "00h 01m",
          processed: 1,
          country: "Sri Lanka",
          platform: isSimulatedPipeline ? "Sandbox Demo" : "Live Port"
        };
        setBots(prev => [newBot, ...prev]);
        setSimulatedEvents(prev => [
          `SUCCESS: New device linked and instantiated as authorization ${newBot.name}!`,
          ...prev.slice(0, 4)
        ]);
      }
    }
  }, [pairedSessionId, pairedPhoneNumber, isSimulatedPipeline]);

  // Handle addition of a new user-spawned bot
  const handleSpawnBot = () => {
    const randomCountries = ["Sri Lanka", "India", "Nigeria", "United Kingdom", "United States", "Brazil"];
    const country = randomCountries[Math.floor(Math.random() * randomCountries.length)];
    const countryCodes: Record<string, string> = {
      "Sri Lanka": "+94 777",
      "India": "+91 987",
      "Nigeria": "+234 813",
      "United Kingdom": "+44 7911",
      "United States": "+1 202",
      "Brazil": "+55 11"
    };
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const code = countryCodes[country] || "+94";
    
    const newBot: ConnectedBot = {
      id: `spawned-${spawnCounter}-${Date.now()}`,
      name: `SPAWNER-NODE-0${spawnCounter}`,
      phone: `${code} ${randomSuffix}`,
      status: "online",
      uptime: "00h 00m 01s",
      processed: 0,
      country,
      platform: Math.random() > 0.5 ? "Live Port" : "Sandbox Demo"
    };

    setBots(prev => [...prev, newBot]);
    setSpawnCounter(prev => prev + 1);
    setSimulatedEvents(prev => [
      `INSTANTIATION: Sprouted server node ${newBot.name} under ${newBot.country} pipeline!`,
      ...prev.slice(0, 4)
    ]);
  };

  // Simulate traffic events periodically
  useEffect(() => {
    const trafficInterval = setInterval(() => {
      if (bots.length === 0) return;
      
      const randomBot = bots[Math.floor(Math.random() * bots.length)];
      
      // Select a random event type
      const logsMap = [
        `delivered dynamic media message bundle to sandbox client.`,
        `synchronized user state map database.`,
        `responded to dynamic command triggers in 42ms.`,
        `cleared session transport queue buffer successfully.`,
        `verified and authorized incoming Meta token certificate.`
      ];
      
      const logsSuffix = logsMap[Math.floor(Math.random() * logsMap.length)];
      const text = `${randomBot.name} ${logsSuffix}`;

      // Increment actual processed count of that bot
      setBots(prev => prev.map(b => {
        if (b.id === randomBot.id) {
          return { ...b, processed: b.processed + 1 };
        }
        return b;
      }));

      setSimulatedEvents(prev => [
        `[${new Date().toLocaleTimeString()}] ${text}`,
        ...prev.slice(0, 4)
      ]);
    }, 4500);

    return () => clearInterval(trafficInterval);
  }, [bots]);

  // Statistics calculation
  const totalBotsCount = bots.length;
  const onlineCount = bots.filter(b => b.status === "online").length;
  const totalProcessed = bots.reduce((sum, b) => sum + b.processed, 0);

  const maskPhoneNumber = (phone: string) => {
    if (!phone) return "";
    const parts = phone.trim().split(" ");
    if (parts.length >= 2) {
      const countryCode = parts[0];
      const rest = parts.slice(1).join(" ");
      return `${countryCode} ${rest.replace(/\d/g, "•")}`;
    }
    return phone.replace(/\d/g, "•");
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 relative overflow-hidden shadow-md flex items-center justify-between">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00f0ff]" />
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold block">Live Bot Nodes</span>
            <span className="text-2xl font-bold text-white font-mono flex items-baseline gap-1.5">
              {totalBotsCount}
              <span className="text-xs text-zinc-500 font-normal">Active</span>
            </span>
          </div>
          <div className="w-10 h-10 bg-[#00f0ff]/5 border border-[#00f0ff]/15 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-[#00f0ff]" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 relative overflow-hidden shadow-md flex items-center justify-between">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold block">Online Statuses</span>
            <span className="text-2xl font-bold text-emerald-400 font-mono flex items-baseline gap-1.5">
              {onlineCount}
              <span className="text-xs text-zinc-500 font-normal">Stable</span>
            </span>
          </div>
          <div className="w-10 h-10 bg-emerald-500/5 border border-emerald-500/15 rounded-xl flex items-center justify-center">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 relative overflow-hidden shadow-md flex items-center justify-between">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ff007f]" />
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold block">Transmissions Out</span>
            <span className="text-2xl font-bold text-white font-mono">
              {totalProcessed.toLocaleString()}
            </span>
          </div>
          <div className="w-10 h-10 bg-[#ff007f]/5 border border-[#ff007f]/15 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#ff007f]" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 relative overflow-hidden shadow-md flex items-center justify-between">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold block">Uptime Standard</span>
            <span className="text-2xl font-bold text-white font-mono">
              99.98%
            </span>
          </div>
          <div className="w-10 h-10 bg-blue-500/5 border border-blue-500/15 rounded-xl flex items-center justify-center">
            <Server className="w-5 h-5 text-blue-400" />
          </div>
        </div>

      </div>

      {/* Main Bot Grid and Activity Logs area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Managed Nodes list */}
        <div className="lg:col-span-2 bg-[#0b0b0f] border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Network className="w-4 h-4 text-[#00f0ff]" />
                <span>Managed WhatsApp Client Nodes</span>
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans mt-0.5">Configured auth tokens connected and operating inside isolation nodes.</p>
            </div>

            {/* Quick Spawn button */}
            <button
              onClick={handleSpawnBot}
              className="px-3.5 py-1.5 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 hover:border-[#00f0ff] text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
              title="Spawn dynamic simulated bot node inside dashboard"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Spawn Bot Node</span>
            </button>
          </div>

          {/* List layout */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {bots.map((b) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="p-3 bg-zinc-950/60 border border-zinc-90 w-full rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-zinc-800 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center relative">
                      <Bot className="w-4.5 h-4.5 text-zinc-400 group-hover:text-[#00f0ff] transition-colors" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold font-mono text-zinc-100">{b.name}</span>
                        <span className="text-[8px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full uppercase font-mono font-bold">
                          {b.platform}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-550 font-mono tracking-wide">{maskPhoneNumber(b.phone)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 font-mono text-[9px]">
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-zinc-500 block uppercase font-bold">NODE LOCATION</span>
                      <span className="text-zinc-300 font-semibold">{b.country}</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[8px] text-zinc-500 block uppercase font-bold">UPTIME STREAK</span>
                      <span className="text-zinc-300 font-semibold flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-zinc-500" />
                        {b.uptime}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[8px] text-zinc-500 block uppercase font-bold text-right sm:text-left">DYNAMICS RUN</span>
                      <span className="text-[#00f0ff] font-bold block text-right sm:text-left">
                        {b.processed.toLocaleString()} pkts
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right 1 Column: Live Telemetry Feeds */}
        <div className="bg-[#0b0b0f] border border-zinc-800 rounded-3xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-[#ff007f] font-mono uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-4 h-4 animate-spin text-[#ff007f]" />
              <span>Telemetry Node Auditing</span>
            </h3>
            <p className="text-[10px] text-zinc-500 font-sans">Active message transmission feedback streams.</p>
          </div>

          <div className="flex-1 bg-zinc-950 p-3 rounded-2xl border border-zinc-900 space-y-2.5 min-h-[220px] max-h-[260px] overflow-y-auto">
            {simulatedEvents.map((evt, idx) => (
              <div 
                key={idx} 
                className="text-[9.5px] font-mono text-zinc-400 border-l-2 border-[#ff007f]/55 pl-2 py-0.5"
              >
                {evt}
              </div>
            ))}
          </div>

          <div className="p-3 bg-[#ff007f]/5 border border-[#ff007f]/10 rounded-xl flex items-start gap-2 text-[10px] text-[#ff007f]/85">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-sans leading-relaxed">
              All active sessions write persistent key configurations on connection successful logs. Maintain credentials closely.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
