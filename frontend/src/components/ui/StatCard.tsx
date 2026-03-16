"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { value: number; label: string };
  delay?: number;
}

export function StatCard({
  label,
  value,
  prefix = "",
  suffix = "",
  icon: Icon,
  iconColor = "var(--primary-500)",
  trend,
  delay = 0,
}: StatCardProps) {
  const displayValue = useCountUp(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0, 0, 0.2, 1] }}
      className="glass rounded-2xl p-5"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
            {prefix}
            {displayValue.toLocaleString()}
            {suffix}
          </p>
          {trend && (
            <p
              className="mt-1 text-xs"
              style={{ color: trend.value >= 0 ? "var(--status-approved)" : "var(--status-rejected)" }}
            >
              {trend.value >= 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: `${iconColor}20` }}
        >
          <Icon size={18} style={{ color: iconColor }} />
        </div>
      </div>
    </motion.div>
  );
}
