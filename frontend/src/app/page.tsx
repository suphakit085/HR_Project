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
    <div className="min-h-screen bg-gradient-to-b from-[#020617] via-[#020617] to-[#020617] text-slate-50">
      {/* Top navigation / header */}
      <header className="px-6 py-4 border-b border-white/5 sticky top-0 z-20 backdrop-blur-xl bg-[#020617]/70">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-teal-400">HR OS</div>
              <div className="text-sm text-slate-400">AI-native People Platform</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <button className="hover:text-white transition-colors">สำหรับ HR</button>
            <button className="hover:text-white transition-colors">สำหรับผู้สมัคร</button>
            <button className="hover:text-white transition-colors">ความโปร่งใส</button>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 rounded-xl border border-teal-400/60 text-teal-300 hover:bg-teal-500 hover:text-white transition-all flex items-center gap-2 text-sm"
            >
              เข้าสู่ระบบ <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => router.push("/login")}
            className="md:hidden px-4 py-2 rounded-xl bg-teal-500 text-white text-sm flex items-center gap-1"
          >
            เข้าสู่ระบบ
          </button>
        </div>
      </header>

      {/* Hero section */}
      <main className="max-w-7xl mx-auto px-6">
        <section className="py-16 md:py-20 grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-12 items-center">
          {/* Left: copy */}
          <div className="space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 text-xs font-medium text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI-native HR Operating System
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-50 leading-tight">
                ระบบผู้ช่วย <span className="gradient-text">HR อัจฉริยะ</span> สำหรับองค์กรยุคใหม่
              </h1>
              <p className="mt-4 text-sm md:text-base text-slate-300 max-w-xl">
                จากเรซูเม่สู่การตัดสินใจรับคนทำงานในหน้าจอเดียว
                อัปโหลด สกัดข้อมูล สร้าง JD จับคู่ผู้สมัคร และตรวจสอบความโปร่งใส
                ได้ในแพลตฟอร์มเดียวแบบ AI-native
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/login")}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-sm md:text-base font-semibold shadow-lg shadow-teal-500/30 hover:shadow-xl hover:-translate-y-[1px] transition-all"
              >
                เริ่มใช้งานสำหรับ HR
              </button>
              <button
                onClick={() => router.push("/applicant/jobs")}
                className="px-6 py-3 rounded-xl border border-slate-700 text-sm md:text-base text-slate-200 hover:border-teal-400 hover:text-teal-200 transition-all"
              >
                ดูตำแหน่งงานที่เปิดรับ
              </button>
            </div>

            <div className="flex flex-wrap gap-6 pt-2 text-xs md:text-sm text-slate-400">
              <div>
                <div className="text-slate-200 font-semibold">6 Core Modules</div>
                <div>ตั้งแต่ Resume Parser ถึง Audit Log</div>
              </div>
              <div>
                <div className="text-slate-200 font-semibold">ลดเวลา Manual Work 80%</div>
                <div>ให้ทีม HR โฟกัสกับคนจริง ๆ</div>
              </div>
            </div>
          </div>

          {/* Right: mock dashboard card */}
          <div className="relative">
            <div className="absolute -inset-12 bg-teal-500/10 blur-3xl rounded-[3rem]" />
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-3xl p-5 md:p-6 shadow-2xl shadow-teal-500/20 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">HR DASHBOARD</div>
                  <div className="mt-1 text-sm text-slate-200">People & Hiring Overview</div>
                </div>
                <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-[10px] font-medium text-emerald-300 border border-emerald-400/30">
                  AI INSIGHTS
                </span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
                <div className="rounded-2xl bg-slate-900/70 border border-slate-700/80 p-3">
                  <div className="text-slate-400 text-[11px]">Active Jobs</div>
                  <div className="mt-1 text-lg font-semibold text-slate-50">12</div>
                  <div className="mt-1 text-[11px] text-emerald-300">+3 สัปดาห์นี้</div>
                </div>
                <div className="rounded-2xl bg-slate-900/70 border border-slate-700/80 p-3">
                  <div className="text-slate-400 text-[11px]">Candidates</div>
                  <div className="mt-1 text-lg font-semibold text-slate-50">248</div>
                  <div className="mt-1 text-[11px] text-teal-300">AI parsed</div>
                </div>
                <div className="rounded-2xl bg-slate-900/70 border border-slate-700/80 p-3">
                  <div className="text-slate-400 text-[11px]">Time Saved</div>
                  <div className="mt-1 text-lg font-semibold text-slate-50">82%</div>
                  <div className="mt-1 text-[11px] text-sky-300">vs manual process</div>
                </div>
              </div>

              {/* Matching preview */}
              <div className="rounded-2xl bg-slate-900/70 border border-slate-700/80 p-3 mb-4">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                      <Users className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <div className="text-slate-200">Senior Data Scientist</div>
                      <div className="text-[11px] text-slate-400">AI Matching Results</div>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-300">Top 3 แนะนำโดย AI</span>
                </div>
                <div className="space-y-2">
                  {[
                    { name: "Candidate #1024", score: 96, tags: ["Python", "ML", "Leadership"] },
                    { name: "Candidate #0998", score: 91, tags: ["NLP", "MLOps"] },
                    { name: "Candidate #0876", score: 88, tags: ["Analytics", "SQL"] },
                  ].map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between rounded-xl bg-slate-900/60 px-3 py-2 border border-slate-800/80"
                    >
                      <div>
                        <div className="text-[13px] text-slate-100">{c.name}</div>
                        <div className="flex gap-1 mt-1">
                          {c.tags.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] font-semibold text-emerald-300">{c.score}%</div>
                        <div className="mt-1 h-1.5 w-16 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400"
                            style={{ width: `${c.score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chatbot preview */}
              <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/40 border border-emerald-500/40 p-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="text-slate-100 font-medium">HR Copilot</div>
                  <p className="text-slate-300">
                    “ฉันสรุปผู้สมัครที่ตรงกับ JD นี้ให้แล้ว พร้อมเหตุผลประกอบการพิจารณา
                    และคำเตือนเรื่องความลำเอียงที่อาจเกิดขึ้น”
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core modules section */}
        <section className="py-12 md:py-16 border-t border-white/5">
          <div className="flex flex-col md:flex-row md:items-start gap-10">
            <div className="md:w-1/3 space-y-3">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-50">Core Modules ของ HR OS</h2>
              <p className="text-sm text-slate-400">
                ครอบคลุมครบทุกส่วนของ HR Journey ตั้งแต่การรับสมัคร
                การคัดกรอง ไปจนถึงการอธิบายเหตุผลของการตัดสินใจของ AI อย่างโปร่งใส
              </p>
            </div>
            <div className="md:w-2/3 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  icon: FileSearch,
                  title: "Resume Parser",
                  desc: "รับ PDF/DOCX และสกัดข้อมูลสำคัญแบบอัตโนมัติ พร้อม De-identification ก่อนสร้าง Embedding",
                  color: "from-teal-500 to-teal-400",
                },
                {
                  icon: Sparkles,
                  title: "JD Authoring",
                  desc: "ให้ AI ช่วยร่าง JD ตามบริบทองค์กร พร้อมแปลงเป็น Embedding เพื่อใช้จับคู่ทันที",
                  color: "from-emerald-500 to-emerald-400",
                },
                {
                  icon: Users,
                  title: "Matching Engine",
                  desc: "เปรียบเทียบ Embedding ผู้สมัครกับงาน พร้อม Reranker และ Matching Score อธิบายได้",
                  color: "from-sky-500 to-cyan-400",
                },
                {
                  icon: Shield,
                  title: "Audit & Monitoring",
                  desc: "เก็บ Audit Log และ Prompt/Response Tracing รองรับการตรวจสอบย้อนหลัง",
                  color: "from-amber-500 to-orange-400",
                },
                {
                  icon: Bot,
                  title: "HR Chatbot",
                  desc: "ถาม–ตอบ สร้าง JD สรุปผู้สมัคร และดึงข้อมูลจากระบบได้ผ่านแชตเดียว",
                  color: "from-fuchsia-500 to-purple-400",
                },
                {
                  icon: ArrowRight,
                  title: "Unified Dashboard",
                  desc: "รวมทุกมุมมองของ HR ตั้งแต่งาน ผู้สมัคร ไปจนถึงการตัดสินใจของ AI ในหน้าจอเดียว",
                  color: "from-slate-500 to-slate-300",
                },
              ].map((feature, i) => (
                <div
                  key={feature.title}
                  className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80 card-hover animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div
                    className={`w-9 h-9 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-3`}
                  >
                    <feature.icon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-50 mb-1.5">{feature.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow section */}
        <section className="py-12 md:py-16 border-t border-white/5">
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="lg:w-1/3 space-y-3">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-50">ออกแบบมาให้ไหลตาม Workflow จริง</h2>
              <p className="text-sm text-slate-400">
                ระบบถูกออกแบบตามลำดับการทำงานของ HR จริงในองค์กร:
                เริ่มที่ Upload & Extract → Generate JD → Match → Dashboard และ Chatbot
                ที่ช่วยในทุก ๆ ขั้นตอน
              </p>
            </div>
            <div className="lg:w-2/3">
              <ol className="grid md:grid-cols-4 gap-4 text-xs md:text-sm">
                {[
                  {
                    step: "01",
                    title: "Upload",
                    desc: "อัปโหลดเรซูเม่ PDF/DOCX ผ่าน Dashboard หรือ API",
                  },
                  {
                    step: "02",
                    title: "Extract",
                    desc: "Resume Parser แยกข้อมูล + De-identify แล้วสร้าง Embedding",
                  },
                  {
                    step: "03",
                    title: "Generate JD",
                    desc: "ให้ AI ช่วยสร้าง JD และเก็บเป็น Embedding ของงาน",
                  },
                  {
                    step: "04",
                    title: "Match & Dashboard",
                    desc: "Matching Engine จับคู่ + Rerank แล้วแสดงผลบน Dashboard/Chatbot",
                  },
                ].map((item, index) => (
                  <li
                    key={item.step}
                    className="relative bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500">{item.step}</span>
                      {index < 3 && (
                        <span className="text-[10px] text-slate-500 hidden md:inline-flex items-center gap-1">
                          ต่อไป <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="text-slate-100 font-semibold">{item.title}</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] md:text-xs text-slate-500">
          <div>© 2026 HR Assistant AI — AI-native HR OS for modern teams</div>
          <div className="flex gap-4">
            <span>FastAPI · Next.js · PostgreSQL + pgvector</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
