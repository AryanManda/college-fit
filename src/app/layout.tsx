import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/Providers";
import { AppShell } from "../components/AppShell";

const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata = {
  title: "CollegeMatch AI — Career & College Pathway",
  description:
    "Build your path: discover careers that fit you, find schools you can realistically get into, and see what to do next. Estimates, not guarantees.",
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
