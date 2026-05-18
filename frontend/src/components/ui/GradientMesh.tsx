"use client";

import { motion } from "framer-motion";

interface GradientMeshProps {
  variant?: "color" | "zinc";
}

export function GradientMesh({ variant = "color" }: GradientMeshProps) {
  const isZinc = variant === "zinc";

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: isZinc
            ? "radial-gradient(ellipse 80% 80% at 50% -20%, rgba(161,161,170,0.12) 0%, transparent 60%)"
            : "radial-gradient(ellipse 80% 80% at 50% -20%, rgba(99,102,241,0.25) 0%, transparent 60%), var(--bg-base)",
        }}
      />
      <motion.div
        className="absolute"
        style={{
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: isZinc
            ? "radial-gradient(circle, rgba(113,113,122,0.08) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          top: "-10%",
          left: "-10%",
          filter: "blur(40px)",
        }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute"
        style={{
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: isZinc
            ? "radial-gradient(circle, rgba(161,161,170,0.06) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          bottom: "-5%",
          right: "-5%",
          filter: "blur(40px)",
        }}
        animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      <motion.div
        className="absolute"
        style={{
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: isZinc
            ? "radial-gradient(circle, rgba(82,82,91,0.05) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
          top: "40%",
          right: "20%",
          filter: "blur(40px)",
        }}
        animate={{ x: [0, 20, 0], y: [0, 40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 6 }}
      />
    </div>
  );
}
