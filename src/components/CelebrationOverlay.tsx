import React, { useEffect, useRef } from "react";
import { Sparkles, Check, Flame } from "lucide-react";
import { motion } from "motion/react";

interface CelebrationOverlayProps {
  onComplete?: () => void;
  sessionId?: string;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({ onComplete, sessionId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
    };

    window.addEventListener("resize", handleResize);

    // Particle definition
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
      decay: number;
      gravity: number;
      spin: number;
      spinSpeed: number;
      type: "circle" | "rect" | "sparkle";
    }

    const particles: Particle[] = [];
    const colors = [
      "#00f0ff", // cyber cyan
      "#ff007f", // hot pink/magenta
      "#10b981", // emerald
      "#3b82f6", // neon blue
      "#f59e0b", // amber/gold
    ];

    // Create burst of high fidelity particles
    const createBurst = (cx: number, cy: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 3;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const types: ("circle" | "rect" | "sparkle")[] = ["circle", "rect", "sparkle"];
        const type = types[Math.floor(Math.random() * types.length)];

        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Math.random() * 2,
          radius: Math.random() * 3 + 2,
          color,
          alpha: 1,
          decay: Math.random() * 0.012 + 0.006,
          gravity: 0.12,
          spin: Math.random() * Math.PI * 2,
          spinSpeed: (Math.random() - 0.5) * 0.15,
          type,
        });
      }
    };

    // Spawn 5 sequential bursts across the screen for ultimate celebratory feel
    createBurst(width / 2, height / 2 - 50, 100);
    
    const t1 = setTimeout(() => createBurst(width * 0.25, height / 3, 50), 300);
    const t2 = setTimeout(() => createBurst(width * 0.75, height / 3, 50), 600);
    const t3 = setTimeout(() => createBurst(width * 0.4, height * 0.6, 60), 900);
    const t4 = setTimeout(() => createBurst(width * 0.6, height * 0.6, 60), 1200);

    // Render physics loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Particle dynamics
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.985; // drag
        p.alpha -= p.decay;
        p.spin += p.spinSpeed;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;

        if (p.type === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === "rect") {
          ctx.fillRect(-p.radius, -p.radius / 1.5, p.radius * 2, p.radius);
        } else if (p.type === "sparkle") {
          ctx.beginPath();
          for (let j = 0; j < 4; j++) {
            ctx.rotate(Math.PI / 2);
            ctx.lineTo(0, p.radius * 2);
            ctx.lineTo(p.radius * 0.25, 0);
          }
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        if (onComplete) onComplete();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener("resize", handleResize);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-50 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      
      {/* Floating congratulatory graphic overlay */}
      <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.6, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          className="bg-zinc-950/95 border border-emerald-500/40 p-6 sm:p-8 rounded-3xl shadow-[0_25px_60px_-15px_rgba(16,185,129,0.3)] flex flex-col items-center space-y-3.5 max-w-sm text-center backdrop-blur-2xl relative"
        >
          {/* Animated decorative glow rings */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#00f0ff]/10 via-[#10b981]/15 to-[#ff007f]/10 blur-xl opacity-80 animate-pulse" />
          
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.25)] relative">
            <Flame className="w-7 h-7 text-emerald-400 animate-bounce" />
          </div>
          
          <div className="space-y-1 relative">
            <h3 className="text-white font-mono font-black text-xl uppercase tracking-tight">
              CONNECT SUCCESS!
            </h3>
            <p className="text-[#00f0ff] uppercase font-mono text-[9px] font-bold tracking-widest">
              VIBODA-CHAMIDU-MD Authorized
            </p>
          </div>

          <p className="text-zinc-400 text-xs font-sans leading-relaxed relative">
            Your WhatsApp device has finished handshaking and is online. Credentials injected cleanly.
          </p>
          
          {sessionId && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 w-full font-mono text-[10px] text-emerald-400 text-center truncate relative">
              ID: {sessionId.substring(0, 24)}...
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onComplete}
            className="px-5 py-1.5 bg-emerald-500 hover:bg-emerald-400 font-mono text-[10px] font-bold text-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg"
          >
            Acknowledge Cargo
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};
