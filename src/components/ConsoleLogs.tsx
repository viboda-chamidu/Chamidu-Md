import React, { useEffect, useRef } from "react";
import { Terminal, Shield, Cpu } from "lucide-react";
import { LogEntry } from "../types";
import { motion } from "motion/react";

interface ConsoleLogsProps {
  logs: LogEntry[];
  status: string;
}

export const ConsoleLogs: React.FC<ConsoleLogsProps> = ({ logs, status }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "success": return "text-emerald-400 font-medium";
      case "error": return "text-red-400 font-semibold";
      case "warn": return "text-amber-400";
      case "system": return "text-teal-400 font-mono";
      default: return "text-zinc-300";
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/70 border border-zinc-800 rounded-3xl overflow-hidden font-mono shadow-xl bg-opacity-40">
      {/* Console Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-950/80 border-b border-zinc-850 text-xs text-opacity-100">
        <div className="flex items-center space-x-2 text-zinc-400">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>SESSION_MONITOR@VIBODA-CHAMIDU-MD</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-zinc-400 uppercase text-[10px]">
            Status: <span className="text-emerald-400">{status}</span>
          </span>
        </div>
      </div>

      {/* Logs Viewport */}
      <div 
        ref={scrollRef}
        className="flex-1 p-5 overflow-y-auto max-h-[300px] sm:max-h-[340px] text-xs space-y-2.5 select-text"
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-2 py-12 animate-fadeIn">
            <Cpu className="w-8 h-8 text-zinc-700 animate-pulse" />
            <p className="font-sans text-xs">Console online. Awaiting pairing input stream...</p>
          </div>
        ) : (
          logs.map((log, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 7 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="flex items-start space-x-2 hover:bg-zinc-800/40 p-0.5 rounded transition-colors"
            >
              <span className="text-zinc-650 shrink-0">[{log.timestamp}]</span>
              <span className={getLogColor(log.type)}>{log.message}</span>
            </motion.div>
          ))
        )}
      </div>

      {/* Terminal Footer Info */}
      <div className="flex items-center justify-between px-5 py-3 bg-zinc-950/90 text-[10px] text-zinc-500 border-t border-zinc-850">
        <span className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-emerald-500" /> End-to-end socket authorization.
        </span>
        <span>v4.0.0-PRO</span>
      </div>
    </div>
  );
};
