import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Self Serving Portal",
    template: "%s - Self Serving Portal",
  },
  description:
    "Provision cloud resources on-demand with standardized templates, built-in guardrails, and compliance controls.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col">
        <div
          aria-hidden
          className="backdrop pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem]"
        />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
