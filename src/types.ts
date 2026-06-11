export interface BotFiles {
  appJson: any;
  packageJson: any;
  configJs: string;
}

export type ConnectionStatus = 
  | "idle" 
  | "initializing" 
  | "connecting" 
  | "awaiting_verification" 
  | "success" 
  | "error";

export type SessionMethod = "qr" | "code";

export interface LogEntry {
  timestamp: string;
  message: string;
  type: "info" | "success" | "warn" | "error" | "system";
}
