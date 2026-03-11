"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Bot, ArrowRight, Shield, Sparkles, Users, FileSearch } from "lucide-react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(user.role === "admin" ? "/admin/dashboard" : "/applicant/jobs");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0fdfa] via-white to-[#f0fdfa]">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">HR Assistant AI</span>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-teal-500/25 transition-all flex items-center gap-2"
        >
          เข้าสู่ระบบ <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="inline-block px-4 py-1.5 bg-teal-100 text-teal-700 rounded-full text-sm font-medium mb-6">
          ✨ AI-Powered HR Platform
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
          ระบบผู้ช่วย <span className="gradient-text">HR อัจฉริยะ</span>
          <br />
          ขับเคลื่อนด้วย AI
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
          ตั้งแต่อัปโหลดเรซูเม่ สกัดข้อมูล สร้าง Job Description จับคู่ผู้สมัคร
          จนถึงการแสดงผล Dashboard — ทุกขั้นตอนมี AI ช่วย
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push("/login")}
            className="px-8 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-teal-500/25 transition-all"
          >
            เริ่มใช้งานเลย
          </button>
          <button
            onClick={() => router.push("/applicant/jobs")}
            className="px-8 py-3.5 bg-white text-teal-700 rounded-xl font-semibold text-lg border-2 border-teal-200 hover:border-teal-400 transition-all"
          >
            ดูตำแหน่งงาน
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Core Modules</h2>
          <p className="text-gray-500">ครอบคลุมทุก HR Journey ตั้งแต่สรรหาจนถึงคัดเลือก</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: FileSearch,
              title: "Resume Parser",
              desc: "สกัดข้อมูลจากเรซูเม่อัตโนมัติ พร้อม De-identification",
              color: "from-teal-500 to-teal-600",
              tags: ["PDF/DOCX", "AI Extract", "De-identify"],
            },
            {
              icon: Sparkles,
              title: "JD Authoring",
              desc: "สร้าง Job Description ด้วย AI อย่างมืออาชีพ",
              color: "from-emerald-500 to-emerald-600",
              tags: ["AI Generate", "Auto Draft"],
            },
            {
              icon: Users,
              title: "Matching Engine",
              desc: "จับคู่ผู้สมัครกับตำแหน่งงาน พร้อมคะแนนและเหตุผล",
              color: "from-cyan-500 to-cyan-600",
              tags: ["Embedding", "Reranker", "Score"],
            },
            {
              icon: Shield,
              title: "Audit & Monitoring",
              desc: "ตรวจสอบย้อนหลังทุกการทำงาน Prompt/Response Tracing",
              color: "from-amber-500 to-orange-500",
              tags: ["Audit Log", "Tracing"],
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-gray-100 card-hover animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{feature.desc}</p>
              <div className="flex flex-wrap gap-2">
                {feature.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-gradient-to-r from-[#0f3d3e] to-[#0d6e6e] rounded-3xl p-10 flex justify-around items-center">
          {[
            { value: "6", label: "Core Modules" },
            { value: "AI", label: "Powered Engine" },
            { value: "80%", label: "ลดเวลา HR" },
            { value: "24/7", label: "AI พร้อมเสมอ" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-bold text-teal-300">{stat.value}</div>
              <div className="text-teal-100 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-400 text-sm">
        © 2026 HR Assistant AI — Built with FastAPI, Next.js & Generative AI
      </footer>
    </div>
  );
}
