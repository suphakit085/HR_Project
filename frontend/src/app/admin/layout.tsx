import AdminSidebar from "@/components/AdminSidebar";
import ChatbotWidget from "@/components/ChatbotWidget";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
      <ChatbotWidget />
    </div>
  );
}
