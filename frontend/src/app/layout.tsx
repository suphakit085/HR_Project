import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ClientProviders from "@/components/ClientProviders";

export const metadata: Metadata = {
  title: "HR Assistant AI — Intelligent Recruitment Platform",
  description: "AI-powered HR Assistant for resume parsing, job matching, and recruitment management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="antialiased">
        <ClientProviders>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: { borderRadius: "12px", background: "#1e293b", color: "#fff" },
              duration: 3000,
            }}
          />
        </ClientProviders>
      </body>
    </html>
  );
}
