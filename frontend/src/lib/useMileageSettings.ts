"use client";

import { useEffect, useState } from "react";
import { getMileageSettings } from "./api";
import type { MileageSettings } from "./types";

const DEFAULT: MileageSettings = { rate: 0.35, currency: "EUR", unit: "km" };

let cached: MileageSettings | null = null;
const listeners: Array<(s: MileageSettings) => void> = [];

function notify(s: MileageSettings) {
  cached = s;
  listeners.forEach((fn) => fn(s));
}

export function invalidateMileageSettings(updated: MileageSettings) {
  notify(updated);
}

export function useMileageSettings(): MileageSettings {
  const [settings, setSettings] = useState<MileageSettings>(cached ?? DEFAULT);

  useEffect(() => {
    listeners.push(setSettings);

    if (!cached) {
      getMileageSettings()
        .then(notify)
        .catch(() => {});
    } else {
      setSettings(cached);
    }

    return () => {
      const idx = listeners.indexOf(setSettings);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  return settings;
}
