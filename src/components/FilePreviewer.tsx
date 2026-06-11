import React, { useState } from "react";
import { FileJson, FileCode, Check, Copy, Download, BookOpen, Layers, Terminal, Server } from "lucide-react";
import { BotFiles } from "../types";

interface FilePreviewerProps {
  files: BotFiles | null;
  sessionId: string;
  loading: boolean;
}

export const FilePreviewer: React.FC<FilePreviewerProps> = ({ files, sessionId, loading }) => {
  const [activeTab, setActiveTab] = useState<"app" | "package" | "config" | "guide">("app");
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  if (loading || !files) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center text-zinc-500 animate-pulse min-h-[300px] flex flex-col justify-center items-center">
        <FileCode className="w-12 h-12 text-zinc-700 mb-2" />
        <p className="font-sans text-xs">Loading bot workspace files...</p>
      </div>
    );
  }

  // Generate raw customized files
  const customizedAppJson = { ...files.appJson };
  const customSession = sessionId || "YOUR_GENERATED_SESSION_ID";

  if (customizedAppJson.env && customizedAppJson.env.SESSION_ID) {
    customizedAppJson.env.SESSION_ID.value = customSession;
  }

  const appJsonCode = JSON.stringify(customizedAppJson, null, 2);
  const packageJsonCode = JSON.stringify(files.packageJson, null, 2);

  // Replace default session in configJs
  const configJsCode = files.configJs.replace(
    /SESSION_ID:\s*process\.env\.SESSION_ID\s*===\s*undefined\s*\?\s*['"][^'"]*['"]\s*:\s*process\.env\.SESSION_ID/,
    `SESSION_ID: process.env.SESSION_ID === undefined ? '${customSession}' : process.env.SESSION_ID`
  );

  const getGuideContent = () => {
    return `===================================================================
   📚 HOW TO DEPLOY VIBODA-CHAMIDU-MD WITH YOUR NEW SESSION_ID
===================================================================

Congratulations! You have generated your active WhatsApp bot session ID:
🔑 SESSIONID: ${customSession}

Choose your deployment method below:

-------------------------------------------------------------------
🚀 OPTION 1: DEPLOY TO PARING/CLOUD PROVIDERS (KOYEB / RAILWAY)
-------------------------------------------------------------------
1. Download a copy of 'app.json', 'package.json', and 'config.js'
   using the file buttons on this page.
2. Create a new GitHub Repository (e.g. 'my-whatsapp-bot').
3. Upload these files to your new GitHub Repository.
4. Sign up on Koyeb (koyeb.com), Railway (railway.app) or Render (render.com).
5. Deploy a Web Service linked to your GitHub repository.
6. Configure the Environment Variables:
   • SESSION_ID  -> Put your Session ID
   • PREFIX      -> . (or your desired bot command prefix)
   • MODE        -> public (or 'private')
7. Deploy the service! Your bot will pair and turn online.

-------------------------------------------------------------------
🚀 OPTION 2: HEROKU ONE-CLICK DEPLOY (EASIEST)
-------------------------------------------------------------------
If deploying onto Heroku:
1. Make sure you have a Heroku account.
2. Set up the Heroku environment variables.
3. Under App Variables, paste:
   • SESSION_ID = ${customSession}
4. Click deploy. Your bot is active!

-------------------------------------------------------------------
💻 OPTION 3: RUN GLOBALLY / LOCAL MACHINE
-------------------------------------------------------------------
1. Keep the compiled folder intact. Install Node.js v18+.
2. Put 'app.json', 'package.json', and 'config.js' in your directory.
3. Install dependencies by running:
   npm install pm2 -g
   npm install
4. Create a file named 'config.env' and add:
   SESSION_ID="${customSession}"
   AUTO_READ_STATUS="true"
   MODE="public"
5. Launch the process command:
   npm start
6. Monitor using:
   npx pm2 logs`;
  };

  const currentCode = 
    activeTab === "app" ? appJsonCode :
    activeTab === "package" ? packageJsonCode :
    activeTab === "config" ? configJsCode : getGuideContent();

  const handleDownload = () => {
    const filename = 
      activeTab === "app" ? "app.json" :
      activeTab === "package" ? "package.json" :
      activeTab === "config" ? "config.js" : "deploy_guide.txt";

    const blob = new Blob([currentCode], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div id="workspace-preview" className="bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
      {/* File Explorer Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-6 py-4 bg-zinc-950/80 border-b border-zinc-850 gap-3">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-white text-sm">Bot Workspace Template Files</span>
          <span className="text-[10px] bg-emerald-950/40 text-emerald-450 px-2 py-0.5 rounded-full border border-emerald-500/20">Configured</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleCopy(activeTab, currentCode)}
            className="flex items-center justify-center space-x-1 px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-305 hover:text-white rounded-lg border border-zinc-700/80 transition-all cursor-pointer"
          >
            {copiedStates[activeTab] ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center justify-center space-x-1 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-md cursor-pointer font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download File</span>
          </button>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[400px]">
        {/* Sidebar Tabs */}
        <div className="bg-zinc-950/60 p-4 border-r border-zinc-850 lg:col-span-1 space-y-1">
          <p className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase px-2 pb-2">Templates</p>
          
          <button
            onClick={() => setActiveTab("app")}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all text-left cursor-pointer ${
              activeTab === "app" 
                ? "bg-emerald-500/10 text-emerald-450 border-l-2 border-emerald-500 font-medium" 
                : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
            }`}
          >
            <FileJson className="w-4 h-4 shrink-0" />
            <span className="truncate text-xs">app.json</span>
          </button>

          <button
            onClick={() => setActiveTab("package")}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all text-left cursor-pointer ${
              activeTab === "package" 
                ? "bg-emerald-500/10 text-emerald-450 border-l-2 border-emerald-500 font-medium" 
                : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
            }`}
          >
            <FileCode className="w-4 h-4 shrink-0" />
            <span className="truncate text-xs">package.json</span>
          </button>

          <button
            onClick={() => setActiveTab("config")}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all text-left cursor-pointer ${
              activeTab === "config" 
                ? "bg-emerald-500/10 text-emerald-450 border-l-2 border-emerald-500 font-medium" 
                : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
            }`}
          >
            <Terminal className="w-4 h-4 shrink-0" />
            <span className="truncate text-xs">config.js</span>
          </button>

          <div className="h-[1px] bg-zinc-900 my-4" />
          <p className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase px-2 pb-2">Deploy</p>

          <button
            onClick={() => setActiveTab("guide")}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all text-left cursor-pointer ${
              activeTab === "guide" 
                ? "bg-emerald-500/10 text-emerald-450 border-l-2 border-emerald-500 font-medium" 
                : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span className="truncate text-xs">Deploy Guide</span>
          </button>

          <div className="p-3 bg-zinc-905/40 rounded-xl mt-6 border border-zinc-800 text-[11px] text-zinc-400 space-y-2">
            <h4 className="font-semibold text-zinc-300 flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-emerald-400" /> Injection active
            </h4>
            <p className="leading-relaxed text-[10px] text-zinc-500 font-sans">
              When paired, your active <strong>SESSION_ID</strong> is automatically pre-filled directly into these source files ready to copy!
            </p>
          </div>
        </div>

        {/* Editor Pane */}
        <div className="lg:col-span-3 bg-zinc-950/40 relative overflow-hidden flex flex-col">
          {/* Editor Header Info */}
          <div className="px-6 py-2 bg-zinc-950/80 border-b border-zinc-850 flex justify-between items-center">
            <span className="text-[10px] text-zinc-550 uppercase tracking-widest font-mono">
              {activeTab === "app" ? "JSON CONFIG" : activeTab === "package" ? "PACKAGE MANIFEST" : activeTab === "config" ? "NODE MODULE" : "TXT GUIDE"}
            </span>
            <span className="text-[10px] text-zinc-600 font-mono">UTF-8 / LF</span>
          </div>

          {/* Active File Code Viewer */}
          <pre className="flex-1 p-6 overflow-auto text-xs font-mono text-zinc-300 max-h-[500px] leading-relaxed select-text">
            <code>
              {currentCode.split("\n").map((line, idx) => {
                const hasSessionHighlight = line.includes(customSession) || line.includes("SESSION_ID");
                
                return (
                  <div key={idx} className={`table-row ${hasSessionHighlight ? "bg-emerald-500/5 -mx-6 px-6" : ""}`}>
                    <span className="table-cell text-zinc-700 text-right pr-4 select-none w-8 border-r border-zinc-900 text-[10px]">{idx + 1}</span>
                    <span className={`table-cell pl-4 whitespace-pre ${hasSessionHighlight ? "text-emerald-400" : ""}`}>
                      {line}
                    </span>
                  </div>
                );
              })}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};
