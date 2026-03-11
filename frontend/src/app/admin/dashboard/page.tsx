"use client";

import { useEffect, useState } from "react";
import { jobsAPI, candidatesAPI, auditAPI } from "@/lib/api";
import { Users, Briefcase, ClipboardCheck, TrendingUp, ArrowUpRight, Clock } from "lucide-react";

interface Stats {
  totalJobs: number;
  activeJobs: number;
  totalCandidates: number;
  recentLogs: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalJobs: 0, activeJobs: 0, totalCandidates: 0, recentLogs: 0 });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allJobs, activeJobs, candidates, logs] = await Promise.all([
          jobsAPI.list({ limit: 50 }),
          jobsAPI.list({ status_filter: "active", limit: 50 }),
          candidatesAPI.list({ limit: 5 }),
          auditAPI.list({ limit: 10 }),
        ]);
        setStats({
          totalJobs: allJobs.data.total,
          activeJobs: activeJobs.data.total,
          totalCandidates: candidates.data.total,
          recentLogs: logs.data.total,
        });
        setRecentJobs(allJobs.data.jobs.slice(0, 5));
      } catch {
        // Silently handle — data may not be available
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: "ตำแหน่งงานทั้งหมด", value: stats.totalJobs, icon: Briefcase, color: "from-teal-500 to-teal-600", change: "" },
    { label: "ตำแหน่งที่เปิดรับ", value: stats.activeJobs, icon: ClipboardCheck, color: "from-emerald-500 to-green-600", change: "" },
    { label: "ผู้สมัครทั้งหมด", value: stats.totalCandidates, icon: Users, color: "from-cyan-500 to-blue-500", change: "" },
    { label: "Audit Logs", value: stats.recentLogs, icon: TrendingUp, color: "from-amber-500 to-orange-500", change: "" },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">ภาพรวมระบบ HR Assistant AI</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 border border-gray-100 card-hover animate-slide-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300" />
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {loading ? <div className="w-12 h-7 bg-gray-200 rounded animate-pulse" /> : card.value}
            </div>
            <div className="text-sm text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-teal-500" />
          ตำแหน่งงานล่าสุด
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentJobs.length > 0 ? (
          <div className="space-y-3">
            {recentJobs.map((job: any) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-50"
              >
                <div>
                  <h3 className="font-medium text-gray-800">{job.title}</h3>
                  <p className="text-sm text-gray-500">
                    {job.department || "General"} • {job.location || "Remote"}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    job.status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : job.status === "closed"
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <Briefcase className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p>ยังไม่มีตำแหน่งงาน</p>
            <p className="text-sm">สร้างตำแหน่งงานใหม่เพื่อเริ่มต้น</p>
          </div>
        )}
      </div>
    </div>
  );
}
