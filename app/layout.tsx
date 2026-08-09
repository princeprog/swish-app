import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { NotificationRealtime } from "@/components/notifications/notification-realtime";

const fontSans = Inter({subsets:['latin'],variable:'--font-sans'});


export const metadata: Metadata = {
  title: "Swish League OS Docs",
  description: "Product planning and architecture docs for Basketball League OS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={fontSans.variable}>
      <body className="antialiased">
        <ThemeProvider>
          <QueryProvider>
            <AuthSessionProvider>
              <NotificationRealtime />
              {children}
              <Toaster />
            </AuthSessionProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
