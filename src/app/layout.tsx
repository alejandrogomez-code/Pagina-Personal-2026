import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Centro Personal",
  description: "Tu centro de control personal",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Carga inicial de preferencias para evitar flash de tema.
  let initial = { accent: "steel", density: "normal", fontSize: "normal" } as const;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("user_preferences")
        .select("accent, density, font_size")
        .eq("user_id", user.id)
        .single();
      if (data) {
        initial = {
          accent: data.accent,
          density: data.density,
          fontSize: data.font_size,
        };
      }
    }
  } catch {
    // sin sesión o sin conexión: valores por defecto
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider initial={initial}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
