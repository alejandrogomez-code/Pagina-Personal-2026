"use client";

import { ThemeProvider as NextThemes } from "next-themes";
import { createContext, useContext, useEffect, useState } from "react";

type Accent = "steel" | "violet" | "teal" | "amber" | "coral";
type Density = "compact" | "normal" | "comfortable";
type FontSize = "small" | "normal" | "large";

interface Appearance {
  accent: Accent;
  density: Density;
  fontSize: FontSize;
  setAccent: (a: Accent) => void;
  setDensity: (d: Density) => void;
  setFontSize: (f: FontSize) => void;
}

const AppearanceCtx = createContext<Appearance | null>(null);

export function useAppearance() {
  const ctx = useContext(AppearanceCtx);
  if (!ctx) throw new Error("useAppearance debe usarse dentro de ThemeProvider");
  return ctx;
}

export function ThemeProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial?: { accent?: Accent; density?: Density; fontSize?: FontSize };
}) {
  const [accent, setAccent] = useState<Accent>(initial?.accent ?? "steel");
  const [density, setDensity] = useState<Density>(initial?.density ?? "normal");
  const [fontSize, setFontSize] = useState<FontSize>(initial?.fontSize ?? "normal");

  // Aplica atributos al <html> (steel = default, sin atributo)
  useEffect(() => {
    const el = document.documentElement;
    if (accent === "steel") el.removeAttribute("data-accent");
    else el.setAttribute("data-accent", accent);
    el.setAttribute("data-density", density);
    el.setAttribute("data-font", fontSize);
  }, [accent, density, fontSize]);

  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem>
      <AppearanceCtx.Provider
        value={{ accent, density, fontSize, setAccent, setDensity, setFontSize }}
      >
        {children}
      </AppearanceCtx.Provider>
    </NextThemes>
  );
}
