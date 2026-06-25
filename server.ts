import express, { Response, Request } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import * as BaileysModule from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";

// Safely resolve makeWASocket and named exports for robust ESM/CJS compatibility
const makeWASocket = (
  (BaileysModule.default && (BaileysModule.default as any).default) ||
  BaileysModule.default ||
  (BaileysModule as any).makeWASocket ||
  BaileysModule
) as any;

const useMultiFileAuthState = BaileysModule.useMultiFileAuthState || (BaileysModule.default as any)?.useMultiFileAuthState;
const fetchLatestBaileysVersion = BaileysModule.fetchLatestBaileysVersion || (BaileysModule.default as any)?.fetchLatestBaileysVersion;
const DisconnectReason = BaileysModule.DisconnectReason || (BaileysModule.default as any)?.DisconnectReason;

interface PairSession {
  id: string;
  method: "qr" | "code";
  phoneNumber?: string;
  status: "idle" | "initializing" | "connecting" | "awaiting_verification" | "success" | "error";
  code?: string;
  qr?: string;
  sessionId?: string;
  error?: string;
  isSimulated?: boolean;
  clients: Response[];
  sock?: any;
}

const sessions = new Map<string, PairSession>();

// Predefined mock session IDs for sandbox mode
const generateMockSessionId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "VIBODA-CHAMIDU-MD;;;";
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

function broadcastToSession(session: PairSession, payload: any) {
  session.clients.forEach((client) => {
    client.write(`data: ${JSON.stringify(payload)}\n\n`);
  });
}

async function startBaileysSession(session: PairSession) {
  const authDir = path.join(process.cwd(), "temp_auth", session.id);
  
  // Ensure directory is clean
  try {
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }
  } catch (err) {}
  
  try {
    fs.mkdirSync(authDir, { recursive: true });
  } catch (err) {}

  try {
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [0, 5, 0] as [number, number, number] }));

    const sock = makeWASocket({
      version,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }) as any,
      auth: state,
      browser: ["VIBODA-CHAMIDU-MD", "Chrome", "1.0.0"]
    });

    session.sock = sock;

    sock.ev.on("creds.update", async () => {
      await saveCreds();
    });

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        if (session.method === "qr") {
          try {
            const qrCodeDataUrl = await QRCode.toDataURL(qr);
            session.qr = qrCodeDataUrl;
            session.status = "connecting";
            broadcastToSession(session, { type: "qr", qr: qrCodeDataUrl });
          } catch (err: any) {
            console.error("QR generation error", err);
          }
        }
      }

      if (connection === "connecting") {
        session.status = "connecting";
        broadcastToSession(session, { type: "status", status: "connecting" });
      }

      if (connection === "open") {
        session.status = "success";
        try {
          const credsFile = path.join(authDir, "creds.json");
          let base64Session = "";
          if (fs.existsSync(credsFile)) {
            const credsData = fs.readFileSync(credsFile, "utf8");
            base64Session = Buffer.from(credsData).toString("base64");
          } else {
            base64Session = Buffer.from(JSON.stringify(state.creds)).toString("base64");
          }
          session.sessionId = `VIBODA-CHAMIDU-MD;;;${base64Session}`;
          broadcastToSession(session, { type: "success", sessionId: session.sessionId });
        } catch (e: any) {
          session.status = "error";
          session.error = "Failed to compile session credentials: " + e.message;
          broadcastToSession(session, { type: "error", error: session.error });
        }

        // Clean up socket
        try {
          sock.end(undefined);
          fs.rmSync(authDir, { recursive: true, force: true });
        } catch (err) {}
      }

      if (connection === "close") {
        const errorReason = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = errorReason !== DisconnectReason.loggedOut;

        if (!shouldReconnect && session.status !== "success") {
          session.status = "error";
          session.error = `WhatsApp session logged out. Error code: ${errorReason}`;
          broadcastToSession(session, { type: "error", error: session.error });
          try {
            fs.rmSync(authDir, { recursive: true, force: true });
          } catch (e) {}
        }
      }
    });

    if (session.method === "code" && session.phoneNumber) {
      // Small buffer delay for socket stability
      await new Promise((r) => setTimeout(r, 3000));
      if (!sock.authState.creds.registered) {
        const cleanNumber = session.phoneNumber.replace(/[^0-9]/g, "");
        const code = await sock.requestPairingCode(cleanNumber);
        session.code = code;
        session.status = "awaiting_verification";
        broadcastToSession(session, { type: "code", code, status: "awaiting_verification" });
      }
    }
  } catch (err: any) {
    console.error("Baileys session crashed", err);
    session.status = "error";
    session.error = err.message || "An error occurred starting the Baileys session.";
    broadcastToSession(session, { type: "error", error: session.error });
  }
}

// Simulated Pairing Handler
async function runSimulatedSession(session: PairSession) {
  const steps = [
    { status: "initializing", delay: 1000 },
    { status: "connecting", delay: 1500 }
  ];

  for (const step of steps) {
    await new Promise((resolve) => setTimeout(resolve, step.delay));
    session.status = step.status as any;
    broadcastToSession(session, { type: "status", status: step.status });
  }

  if (session.method === "code") {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // Generate simulated pairing code: XXXX-XXXX
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let codePart1 = "";
    let codePart2 = "";
    for (let i = 0; i < 4; i++) {
      codePart1 += chars.charAt(Math.floor(Math.random() * chars.length));
      codePart2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    session.code = `${codePart1}-${codePart2}`;
    session.status = "awaiting_verification";
    broadcastToSession(session, { type: "code", code: session.code, status: "awaiting_verification" });

    // Wait for simulated user confirmation (around 12 seconds)
    await new Promise((resolve) => setTimeout(resolve, 12000));
  } else {
    // Generate simulated QR Code URL
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // Simple text QR
    const qrDataUrl = await QRCode.toDataURL("https://github.com/viboda-chamidu");
    session.qr = qrDataUrl;
    broadcastToSession(session, { type: "qr", qr: qrDataUrl });

    // Wait for simulated user scan (around 10 seconds)
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }

  // Set successfully paired session ID
  session.status = "success";
  session.sessionId = generateMockSessionId();
  broadcastToSession(session, { type: "success", sessionId: session.sessionId });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Static files for metadata and assets
  app.use("/assets", express.static(path.join(process.cwd(), "assets")));

  // API 1: Initialize Pairing Session
  app.post("/api/pair/init", async (req, res) => {
    const { method, phoneNumber, simulate } = req.body;
    
    if (method !== "qr" && method !== "code") {
      res.status(400).json({ error: "Invalid pairing method. Use 'qr' or 'code'." });
      return;
    }

    if (method === "code" && !phoneNumber) {
      res.status(400).json({ error: "Phone number is required for pairing code method." });
      return;
    }

    const sessionId = `pair_${Math.random().toString(36).substring(2, 10)}`;
    const session: PairSession = {
      id: sessionId,
      method,
      phoneNumber,
      status: "initializing",
      clients: [],
      isSimulated: !!simulate
    };

    sessions.set(sessionId, session);

    // Run connection asynchronously
    if (session.isSimulated) {
      runSimulatedSession(session);
    } else {
      startBaileysSession(session);
    }

    res.json({ sessionId, isSimulated: session.isSimulated });
  });

  // API 2: Event Stream for Session Status (SSE)
  app.get("/api/pair/status", (req, res) => {
    const sessionId = req.query.sessionId as string;
    const session = sessions.get(sessionId);

    if (!session) {
      res.status(404).send("Session not found");
      return;
    }

    // Standard SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Add current client to listeners
    session.clients.push(res);

    // Stream the current immediate state
    res.write(`data: ${JSON.stringify({ type: "initial", status: session.status, code: session.code, qr: session.qr, sessionId: session.sessionId })}\n\n`);

    req.on("close", () => {
      // Remove client
      session.clients = session.clients.filter((c) => c !== res);
      // If no clients left and session was completed or errored, clean up
      if (session.clients.length === 0 && (session.status === "success" || session.status === "error")) {
        sessions.delete(sessionId);
      }
    });
  });

  // API 3: Get Template Bot Files
  app.get("/api/bot/files", (req, res) => {
    try {
      const appJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "bot", "app.json"), "utf8"));
      const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "bot", "package.json"), "utf8"));
      const configJs = fs.readFileSync(path.join(process.cwd(), "bot", "config.js"), "utf8");

      res.json({
        appJson,
        packageJson,
        configJs
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to read bot files: " + err.message });
    }
  });

  // API 4: Download Individual Files with Customized Session ID
  app.get("/api/bot/download/:filename", (req, res) => {
    const filename = req.params.filename;
    const customSessionId = (req.query.sessionId as string) || "YOUR_SESSION_ID";

    try {
      if (filename === "app.json") {
        const fileContent = JSON.parse(fs.readFileSync(path.join(process.cwd(), "bot", "app.json"), "utf8"));
        // Pre-fill environment variable
        if (fileContent.env && fileContent.env.SESSION_ID) {
          fileContent.env.SESSION_ID.value = customSessionId;
        }
        res.setHeader("Content-Disposition", 'attachment; filename="app.json"');
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(fileContent, null, 2));
        return;
      }

      if (filename === "package.json") {
        const fileContent = fs.readFileSync(path.join(process.cwd(), "bot", "package.json"), "utf8");
        res.setHeader("Content-Disposition", 'attachment; filename="package.json"');
        res.setHeader("Content-Type", "application/json");
        res.send(fileContent);
        return;
      }

      if (filename === "config.js") {
        let fileContent = fs.readFileSync(path.join(process.cwd(), "bot", "config.js"), "utf8");
        // Substitute session id logic
        const targetRegex = /SESSION_ID:\s*process\.env\.SESSION_ID\s*===\s*undefined\s*\?\s*['"][^'"]*['"]\s*:\s*process\.env\.SESSION_ID/;
        const customReplacement = `SESSION_ID: process.env.SESSION_ID === undefined ? '${customSessionId}' : process.env.SESSION_ID`;
        fileContent = fileContent.replace(targetRegex, customReplacement);

        res.setHeader("Content-Disposition", 'attachment; filename="config.js"');
        res.setHeader("Content-Type", "application/javascript");
        res.send(fileContent);
        return;
      }

      res.status(404).send("File not found");
    } catch (err: any) {
      res.status(500).send("Error generating file: " + err.message);
    }
  });

  // Vite Integration in Express
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pairing Server running on http://localhost:${PORT}`);
  });
}

startServer();
