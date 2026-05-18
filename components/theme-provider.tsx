"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme-constants";

export type ThemeName = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  resolvedTheme: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStoredTheme(
  storageKey: string,
  fallback: ThemeName,
): ThemeName {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(storageKey);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {}
  return fallback;
}

function resolve(theme: ThemeName): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyDom(
  effective: "light" | "dark",
  enableColorScheme: boolean,
): void {
  const root = document.documentElement;
  root.classList.toggle("dark", effective === "dark");
  if (enableColorScheme) {
    root.style.colorScheme = effective;
  }
}

function flashGuard(disableTransition: boolean): void {
  if (!disableTransition || typeof document === "undefined") return;
  const el = document.createElement("style");
  el.appendChild(
    document.createTextNode(
      "*,::before,::after{-webkit-transition:none!important;transition:none!important}",
    ),
  );
  document.head.appendChild(el);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.remove();
    });
  });
}

export type AppThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: ThemeName;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  enableColorScheme?: boolean;
  disableTransitionOnChange?: boolean;
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = THEME_STORAGE_KEY,
  enableSystem = true,
  enableColorScheme = true,
  disableTransitionOnChange = false,
}: AppThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeName>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    "light",
  );
  const hydrated = useRef(false);

  useLayoutEffect(() => {
    let active = theme;
    if (!hydrated.current) {
      hydrated.current = true;
      const stored = readStoredTheme(storageKey, defaultTheme);
      const t = !enableSystem && stored === "system" ? "light" : stored;
      active = t;
      if (t !== theme) {
        queueMicrotask(() => {
          setThemeState(t);
        });
      }
    }
    const effective = resolve(active);
    setResolvedTheme(effective);
    applyDom(effective, enableColorScheme);
  }, [
    theme,
    storageKey,
    defaultTheme,
    enableSystem,
    enableColorScheme,
  ]);

  useLayoutEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const effective = getSystemTheme();
      setResolvedTheme(effective);
      applyDom(effective, enableColorScheme);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, enableColorScheme]);

  const setTheme = useCallback(
    (next: ThemeName) => {
      if (!enableSystem && next === "system") return;
      flashGuard(disableTransitionOnChange);
      setThemeState(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {}
      const effective = resolve(next);
      setResolvedTheme(effective);
      applyDom(effective, enableColorScheme);
    },
    [disableTransitionOnChange, enableColorScheme, enableSystem, storageKey],
  );

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
