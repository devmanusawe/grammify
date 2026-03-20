import type { Metadata } from "next";
import { Prompt, Inter } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/components/LangProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const prompt = Prompt({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Grammify - ตรวจคำผิดด้วย AI",
  description: "เว็บแอปพลิเคชันตรวจสอบคำผิดที่ขับเคลื่อนด้วย AI จาก Google Gemini รองรับภาษาไทยและภาษาอังกฤษ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${prompt.variable} ${inter.variable} font-sans min-h-screen flex flex-col`}>
        <LangProvider>
          <AuthProvider>
            <Navbar />
            {children}
            <Footer />
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}
