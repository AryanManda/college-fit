import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/Providers";
import { AppShell } from "../components/AppShell";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
});

export const metadata: Metadata = {
  title: "Aether — College Fit & Applications",
  description:
    "Build your path: discover careers that fit you, find schools you can realistically get into, and see what to do next. Estimates, not guarantees.",
  applicationName: "Aether",
  appleWebApp: {
    capable: true,
    title: "Aether",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f1ea",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} h-full`}>
      <body className="min-h-full antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
