"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  ClipboardList,
  MessageCircle,
  LogOut,
  Bot,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/jobs", label: "Job Management", icon: Briefcase },
  { href: "/admin/candidates", label: "Candidates", icon: Users },
  { href: "/admin/audit", label: "Audit Logs", icon: ClipboardList },
];

export default function AdminSidebar() {
  const { user, loading, logout, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/login");
    }
  }, [user, loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="w-64 bg-[var(--sidebar-bg)] min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <aside className="w-64 bg-[var(--sidebar-bg)] min-h-screen flex flex-col shadow-xl">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">HR Assistant</h1>
            <p className="text-teal-300 text-xs">AI-Powered Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {adminLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-teal-500/20 text-teal-300 shadow-lg shadow-teal-500/10"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <link.icon className={`w-5 h-5 ${isActive ? "text-teal-400" : "text-gray-400 group-hover:text-teal-400"}`} />
              {link.label}
              {isActive && <ChevronRight className="w-4 h-4 ml-auto text-teal-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {user?.full_name?.charAt(0) || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-gray-400 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-red-400 transition-colors p-1"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
