import type { Metadata } from "next";
import { Syne, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "PR Assistant — AI code review for GitHub Pull Requests",
  description:
    "GitHub App that reviews pull request diffs with Claude and posts structured improvement suggestions automatically.",
  openGraph: {
    title: "PR Assistant",
    description:
      "Automatic AI code review for GitHub Pull Requests — bugs, security, naming, and more.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${display.variable} ${sans.variable} ${mono.variable} antialiased font-[family-name:var(--font-sans)]`}
      >
        {children}
      </body>
    </html>
  );
}
