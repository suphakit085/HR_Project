"use client";

import { useEffect, useState, useRef } from "react";
import { jobsAPI, candidatesAPI } from "@/lib/api";
import { Search, MapPin, Building2, Clock, Upload, Loader2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";

export default function ApplicantJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [applyingTo, setApplyingTo] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [hasResume, setHasResume] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    jobsAPI.list({ status_filter: "active", limit: 50 })
      .then((res) => setJobs(res.data.jobs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await candidatesAPI.uploadResume(file);
      setHasResume(true);
      toast.success("อัปโหลดเรซูเม่สำเร็จ! ระบบกำลังวิเคราะห์ข้อมูล...");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "อัปโหลดไม่สำเร็จ");
    } finally { setUploading(false); }
  };

  const handleApply = async (jobId: number) => {
    if (!hasResume) {
      toast.error("กรุณาอัปโหลดเรซูเม่ก่อนสมัครงาน");
      return;
    }
    setApplyingTo(jobId);
    try {
      const res = await candidatesAPI.apply({ job_id: jobId });
      const score = res.data.match_score;
      toast.success(`สมัครงานสำเร็จ! ${score ? `คะแนนจับคู่: ${score}%` : ""}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "สมัครไม่สำเร็จ");
    } finally { setApplyingTo(null); }
  };

  const filteredJobs = jobs.filter((j) =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    (j.department || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      {/* Resume Upload Section */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-6 mb-6 border border-teal-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-800 mb-1">อัปโหลดเรซูเม่ของคุณ</h2>
            <p className="text-sm text-gray-500">รองรับไฟล์ PDF, DOCX — ระบบ AI จะวิเคราะห์และสกัดข้อมูลอัตโนมัติ</p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleUploadResume}
              className="hidden"
            />
            {hasResume ? (
              <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
                <CheckCircle className="w-5 h-5" /> อัปโหลดแล้ว
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2 text-sm disabled:opacity-60"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "กำลังวิเคราะห์..." : "อัปโหลดเรซูเม่"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ตำแหน่งงานที่เปิดรับ</h1>
        <p className="text-gray-500 text-sm mt-1">ค้นหาตำแหน่งที่เหมาะกับคุณ</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาตำแหน่งงาน หรือแผนก..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none text-sm text-gray-700"
        />
      </div>

      {/* Job Cards */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-52 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-2xl p-6 border border-gray-100 card-hover">
              <div className="mb-4">
                <h3 className="font-bold text-gray-800 text-lg mb-2">{job.title}</h3>
                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                  {job.department && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> {job.department}
                    </span>
                  )}
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {job.location}
                    </span>
                  )}
                  {job.employment_type && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {job.employment_type}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500 line-clamp-3 mb-4">{job.description?.substring(0, 200)}</p>
              {job.salary_range && (
                <p className="text-sm font-medium text-teal-600 mb-4">💰 {job.salary_range}</p>
              )}
              <button
                onClick={() => handleApply(job.id)}
                disabled={applyingTo === job.id}
                className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition-all text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {applyingTo === job.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> กำลังสมัคร & จับคู่...</>
                ) : (
                  "สมัครงานตำแหน่งนี้"
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">ไม่พบตำแหน่งงาน</p>
        </div>
      )}
    </div>
  );
}
