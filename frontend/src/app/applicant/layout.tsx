"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Bot, LogOut, Briefcase, FileText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/applicant/jobs", label: "ตำแหน่งงาน", icon: Briefcase },
  { href: "/applicant/applications", label: "ใบสมัครของฉัน", icon: FileText },
];

export default function ApplicantLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Top Nav */}
      <header className="bg-white border-b border-gray-100 px-6 py-3 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/applicant/jobs" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold gradient-text">HR Assistant AI</span>
            </Link>
            <nav className="flex gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname === link.href
                      ? "bg-teal-50 text-teal-700"
                      : "text-gray-500 hover:text-teal-600 hover:bg-gray-50"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.full_name}</span>
            <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {children}
      </main>
    </div>
  );
}
