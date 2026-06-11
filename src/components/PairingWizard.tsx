import React, { useState } from "react";
import { 
  QrCode, 
  Hash, 
  Smartphone, 
  HelpCircle, 
  Sparkles, 
  Play, 
  RefreshCw, 
  Copy, 
  Check, 
  ShieldCheck, 
  ChevronRight,
  Info
} from "lucide-react";
import { ConnectionStatus, SessionMethod } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface PairingWizardProps {
  method: SessionMethod;
  setMethod: (method: SessionMethod) => void;
  phoneNumber: string;
  setPhoneNumber: (number: string) => void;
  isSimulated: boolean;
  setIsSimulated: (sim: boolean) => void;
  status: ConnectionStatus;
  pairingCode: string;
  qrCode: string;
  loading: boolean;
  onStartPairing: () => void;
  onResetPairing: () => void;
  sessionId: string;
}

export const PairingWizard: React.FC<PairingWizardProps> = ({
  method,
  setMethod,
  phoneNumber,
  setPhoneNumber,
  isSimulated,
  setIsSimulated,
  status,
  pairingCode,
  qrCode,
  loading,
  onStartPairing,
  onResetPairing,
  sessionId,
}) => {
  const [copiedSession, setCopiedSession] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Determine overall completion percentage based on current pairing statuses
  let progressPercent = 10;
  let progressColor = "bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400";
  let progressGlow = "shadow-[0_0_12px_rgba(16,185,129,0.4)]";

  if (status === "initializing") {
    progressPercent = 35;
  } else if (status === "connecting") {
    progressPercent = 60;
  } else if (status === "awaiting_verification") {
    progressPercent = 85;
  } else if (status === "success") {
    progressPercent = 100;
  } else if (status === "error") {
    progressPercent = 100;
    progressColor = "bg-gradient-to-r from-rose-500 to-red-500";
    progressGlow = "shadow-[0_0_12px_rgba(244,63,94,0.4)]";
  }

  // Countries config
  const sampleCountries = [
    { name: "Sri Lanka", code: "94" },
    { name: "India", code: "91" },
    { name: "United Kingdom", code: "44" },
    { name: "United States", code: "1" },
    { name: "Nigeria", code: "234" },
  ];

  const handleCopySession = () => {
    navigator.clipboard.writeText(sessionId);
    setCopiedSession(true);
    setTimeout(() => setCopiedSession(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pairingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isFormValid = method === "qr" || (method === "code" && phoneNumber.trim().length > 6);

  return (
    <div className="bg-zinc-900 border border-zinc-805/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative min-h-[480px] overflow-hidden pt-10 sm:pt-12">
      
      {/* Dynamic linear progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-950/80 overflow-hidden z-10">
        <motion.div 
          initial={{ width: "0%" }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className={`h-full ${progressColor} ${progressGlow} transition-colors duration-300`}
        />
      </div>

      {status !== "idle" && (
        <div className="absolute top-4 right-6 flex items-center space-x-1 font-mono text-[9px] uppercase tracking-wider text-zinc-500 z-10">
          <span>LINKAGE PROGRESS:</span>
          <span className={`font-bold ${status === "error" ? "text-rose-450" : "text-emerald-400"}`}>
            {progressPercent}%
          </span>
        </div>
      )}

      {/* Decorative light grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent pointer-events-none rounded-3xl" />

      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Header */}
            <div>
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1 bg-emerald-950/40 border border-emerald-800/20 px-2.5 py-1 rounded-full w-max">
                <Sparkles className="w-3.5 h-3.5" /> step 1 of 2
              </p>
              <h3 className="text-xl font-bold text-white tracking-tight">Configure Device Authorization</h3>
              <p className="text-zinc-400 text-sm mt-1">Select authorization pipeline, method, and phone parameters.</p>
            </div>

            {/* Mode selection (Live Connection vs Sandbox demo) */}
            <div className="space-y-2">
              <label className="text-zinc-300 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
                <span>Pipeline Environment</span>
                <span className="text-[10px] text-zinc-500 font-mono capitalize">Real servers vs simulator</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsSimulated(false)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    !isSimulated 
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-300 font-medium" 
                      : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-750 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span className="text-sm font-semibold flex items-center gap-1.5">
                    🌐 Live Port
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-1">Connect to WhatsApp server</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSimulated(true)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSimulated 
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-300 font-medium" 
                      : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-750 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span className="text-sm font-semibold flex items-center gap-1.5">
                    🧪 Sandbox Demo
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-1">Simulate with mock user</span>
                </button>
              </div>
            </div>

            {/* Method selection (Pairing Code vs QR) */}
            <div className="space-y-2">
              <label className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">Method Option</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod("code")}
                  className={`flex items-center space-x-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    method === "code" 
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-300 font-medium" 
                      : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-750 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className={`p-2 rounded-xl ${method === "code" ? "bg-emerald-950 text-emerald-400" : "bg-zinc-950 text-zinc-500"}`}>
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold">Pairing Code</div>
                    <div className="text-[10px] text-zinc-550">Pair via 8-digit text code</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("qr")}
                  className={`flex items-center space-x-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    method === "qr" 
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-300 font-medium" 
                      : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-750 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className={`p-2 rounded-xl ${method === "qr" ? "bg-emerald-950 text-emerald-400" : "bg-zinc-950 text-zinc-500"}`}>
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold">QR Code Scanner</div>
                    <div className="text-[10px] text-zinc-550">Scan via Whatsapp cameras</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Inputs conditioned on pairing type */}
            {method === "code" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <div className="flex justify-between items-center">
                  <label className="text-zinc-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Number
                  </label>
                  <span className="text-[10px] text-zinc-500 font-medium">Use country code first</span>
                </div>

                <div className="relative">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="94771234567"
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:border-emerald-500 focus:outline-none font-mono text-emerald-300 placeholder-zinc-800 font-semibold"
                  />
                </div>

                <div className="flex flex-wrap gap-1 text-[10px] text-zinc-550 items-center">
                  <Info className="w-3 h-3 text-zinc-500" />
                  <span>Sri Lanka: </span>
                  <button onClick={() => setPhoneNumber("947")} className="text-emerald-500 hover:underline">94xxxxxxx</button>
                  <span className="mx-0.5">•</span>
                  <span>India: </span>
                  <button onClick={() => setPhoneNumber("91")} className="text-emerald-500 hover:underline">91xxxxxxx</button> 
                  <span className="mx-0.5">•</span>
                  <span>Nigeria: </span>
                  <button onClick={() => setPhoneNumber("234")} className="text-emerald-500 hover:underline">234xxxxxxx</button>
                </div>
              </motion.div>
            )}

            {method === "qr" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3 bg-zinc-950/40 rounded-2xl border border-zinc-800/80 text-xs text-zinc-400 leading-relaxed flex gap-2"
              >
                <QrCode className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  No phone number required. The system will direct you to a scanner stage. Scan the generated QR Code with WhatsApp under <strong>Linked Devices</strong>.
                </p>
              </motion.div>
            )}

            {/* Launch trigger button */}
            <button
              onClick={onStartPairing}
              disabled={loading || !isFormValid}
              className={`w-full flex items-center justify-center space-x-2 py-4 rounded-xl text-sm font-semibold transition-all shadow-lg select-none cursor-pointer ${
                isFormValid && !loading
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                  : "bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
                  <span>Provisioning Socket...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white text-white" />
                  <span>Start Device Authorization</span>
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Loading and Auth stream */}
        {status !== "idle" && status !== "success" && status !== "error" && (
          <motion.div
            key="pairing-progress"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col items-center justify-center py-6 space-y-6 text-center"
          >
            {/* Upper text status */}
            <div className="space-y-1">
              <span className="px-3 py-1 bg-emerald-950 border border-emerald-500/20 rounded-full text-xs text-emerald-400 font-semibold animate-pulse uppercase tracking-wider">
                {status === "initializing" && "Spinning Container..."}
                {status === "connecting" && "Handshaking..."}
                {status === "awaiting_verification" && "Awaiting Link..."}
              </span>
              <div className="text-zinc-400 text-xs mt-3 flex items-center gap-1.5 justify-center">
                {isSimulated ? (
                  <span className="text-emerald-400 font-bold border border-emerald-500/20 px-2 py-0.5 rounded bg-emerald-950/20">🧪 Simulated Session</span>
                ) : (
                  <span className="text-emerald-400 font-bold border border-emerald-500/20 px-2 py-0.5 rounded bg-emerald-950/30">📡 Live Connection Active</span>
                )}
              </div>
            </div>

            {/* Display pairing code or QR Code */}
            <div className="relative p-6 bg-zinc-950 border border-zinc-800/80 rounded-3xl w-full max-w-[280px] aspect-square flex flex-col items-center justify-center">
              {status === "initializing" || (status === "connecting" && method === "qr" && !qrCode) ? (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
                  <p className="text-xs text-zinc-500 font-sans tracking-wide">Connecting Sockets...</p>
                </div>
              ) : method === "code" && pairingCode ? (
                <div className="text-center space-y-4">
                  <span className="text-[10px] text-zinc-550 font-bold tracking-wider uppercase block">Your Pairing Code</span>
                  
                  {/* Segmented Pairing Code Cards */}
                  {/* Flex wrapping container with adjacent copy icon */}
                  <div className="flex items-center justify-center gap-2 pb-1">
                    <div className="flex items-center justify-center space-x-1.5 animate-bounce">
                    {pairingCode.replace("-", "").split("").map((char, idx) => (
                      <React.Fragment key={idx}>
                        {idx === 4 && <span className="text-emerald-600 font-bold text-center px-0.5">-</span>}
                        <div className="w-6 py-2.5 sm:w-8 sm:py-3.5 bg-zinc-900 border border-zinc-800 rounded-lg text-lg sm:text-xl font-bold font-mono text-emerald-400 shadow-inner flex items-center justify-center">
                          {char}
                        </div>
                      </React.Fragment>
                    ))}
                    </div>

                    <button
                      onClick={handleCopyCode}
                      className="p-2 bg-gradient-to-tr from-zinc-900 to-zinc-950 hover:from-zinc-850 hover:to-zinc-900 text-zinc-400 hover:text-emerald-400 border border-zinc-800 hover:border-emerald-500/35 rounded-lg transition-all cursor-pointer shadow-md flex items-center justify-center shrink-0"
                      title="Copy pairing code to clipboard"
                    >
                      {copiedCode ? (
                        <Check className="w-4 h-4 text-emerald-400 animate-pulse" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <p className="text-[10px] text-zinc-550 font-sans">
                    Click the copy icon next to the digits to replicate credentials.
                  </p>
                </div>
              ) : method === "qr" && qrCode ? (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <img src={qrCode} alt="WhatsApp QR Code" className="w-[180px] h-[180px] rounded-lg border border-zinc-800" referrerPolicy="no-referrer" />
                  <span className="text-[10px] text-zinc-550 font-sans">Menu &gt; Linked Devices &gt; Link Device</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
                  <p className="text-xs text-zinc-500 font-sans">Awaiting configuration...</p>
                </div>
              )}
            </div>

            {/* Verification Instructions */}
            <div className="space-y-2 max-w-sm px-4">
              <h4 className="text-sm font-semibold text-zinc-200">How to Link with your device:</h4>
              <ol className="text-xs text-zinc-500 text-left list-decimal space-y-1 pl-4 leading-relaxed font-sans">
                {method === "code" ? (
                  <>
                    <li>Open WhatsApp on your phone.</li>
                    <li>Tap your Profile menu, open <strong>Linked Devices</strong>.</li>
                    <li>Click "Link a Device" and select <strong>"Link with phone number instead"</strong>.</li>
                    <li>Enter the 8-digit authorization code displayed above.</li>
                  </>
                ) : (
                  <>
                    <li>Open WhatsApp on your primary phone.</li>
                    <li>Click Menu / Settings, and select <strong>Linked Devices</strong>.</li>
                    <li>Tap <strong>Link a Device</strong>.</li>
                    <li>Aim phone camera directly to scan the visual QR code above.</li>
                  </>
                )}
              </ol>
            </div>

            <button
              onClick={onResetPairing}
              className="text-xs text-zinc-500 hover:text-zinc-300 font-sans flex items-center gap-1.5 transition-all underline cursor-pointer"
            >
              Cancel linkage & reset
            </button>
          </motion.div>
        )}

        {/* Successful Linkage Display */}
        {status === "success" && (
          <motion.div
            key="success-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center py-4 space-y-6"
          >
            {/* Visual lock confirmation indicator */}
            <div className="relative animate-pulse">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center relative">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white tracking-tight">VIBODA-CHAMIDU-MD Authorized!</h3>
              <p className="text-sm text-zinc-400 max-w-xs mx-auto">
                Your device has successfully established credentials with WhatsApp. 
              </p>
            </div>

            {/* Credentials session card */}
            <div className="w-full bg-zinc-950 border border-emerald-900/30 rounded-2xl p-4 space-y-2 relative shadow-inner">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-emerald-500 font-bold uppercase tracking-widest font-mono">AUTHORIZED SESSION ID</span>
                <span className="text-emerald-500 text-[9px] font-mono">100% Encrypted</span>
              </div>
              
              <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 rounded-xl p-2.5">
                <span className="font-mono text-emerald-300 text-xs truncate flex-1 text-left select-text">
                  {sessionId}
                </span>
                
                <button
                  type="button"
                  onClick={handleCopySession}
                  className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded transition-colors cursor-pointer"
                  title="Copy session"
                >
                  {copiedSession ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="text-[10px] text-zinc-550 text-left leading-relaxed mt-2 p-2.5 bg-zinc-900/40 rounded-lg border border-zinc-900">
                ⚠️ <strong>Do NOT share this session ID!</strong> Keep it confidential. Anyone with this string can read your target chat logs or mimic your profile actions.
              </div>
            </div>

            {/* Direct flow control button */}
            <div className="w-full space-y-3">
              <a
                href="#workspace-preview"
                className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <span>Deploy with customized files</span>
                <ChevronRight className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={onResetPairing}
                className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors underline cursor-pointer"
              >
                Pair another device or restart
              </button>
            </div>

          </motion.div>
        )}

        {/* Failed flow */}
        {status === "error" && (
          <motion.div
            key="error-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8 space-y-5 text-center"
          >
            <div className="w-14 h-14 bg-rose-950/30 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center">
              <HelpCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-zinc-200">Session Link Failed</h3>
              <p className="text-xs text-rose-400 max-w-xs mx-auto bg-rose-950/20 border border-rose-950 rounded-xl p-3 leading-relaxed">
                {pairingCode || "An error occurred starting the handshake connection interface to Meta. Host might be rate-limited."}
              </p>
            </div>

            <p className="text-xs text-zinc-500 max-w-sm leading-relaxed font-sans">
              Don't worry! This is normal for testing. You can easily switch to <strong>🧪 Sandbox Demo Mode</strong> to see the portal complete and customize your local bot configuration files!
            </p>

            <button
              onClick={onResetPairing}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-805 border border-zinc-800 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              Reset Connection & Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating toast notification for copy confirmation */}
      <AnimatePresence>
        {copiedCode && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-4 left-4 right-4 bg-zinc-950 border border-emerald-500/50 text-emerald-400 font-mono text-[10px] sm:text-xs font-semibold px-4 py-2.5 rounded-xl shadow-[0_4px_20px_rgba(0,240,255,0.15)] z-50 flex items-center justify-between pointer-events-none"
          >
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Pairing Code copied to Clipboard!</span>
            </div>
            <span className="text-[9px] text-[#00f0ff]/85 font-bold uppercase tracking-wider">SUCCESS</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
