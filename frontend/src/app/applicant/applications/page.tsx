"use client";

import { useEffect, useState } from "react";
import { candidatesAPI } from "@/lib/api";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    candidatesAPI.myApplications()
      .then((res) => setApplications(res.data.applications))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    pending: { icon: Clock, color: "bg-amber-100 text-amber-700", label: "รอตรวจสอบ" },
    reviewing: { icon: AlertCircle, color: "bg-blue-100 text-blue-700", label: "กำลังตรวจสอบ" },
    shortlisted: { icon: CheckCircle, color: "bg-emerald-100 text-emerald-700", label: "ผ่านการคัดเลือก" },
    interview: { icon: CheckCircle, color: "bg-teal-100 text-teal-700", label: "นัดสัมภาษณ์" },
    offered: { icon: CheckCircle, color: "bg-green-100 text-green-700", label: "ได้รับข้อเสนอ" },
    rejected: { icon: XCircle, color: "bg-red-100 text-red-600", label: "ไม่ผ่าน" },
    withdrawn: { icon: XCircle, color: "bg-gray-100 text-gray-600", label: "ถอนใบสมัคร" },
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ใบสมัครของฉัน</h1>
        <p className="text-gray-500 text-sm mt-1">ติดตามสถานะการสมัครงานของคุณ</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((app) => {
            const status = statusConfig[app.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            return (
              <div key={app.id} className="bg-white rounded-2xl p-5 border border-gray-100 card-hover">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{app.job_title || `ตำแหน่ง #${app.job_id}`}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        สมัครเมื่อ {new Date(app.applied_at).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {app.match_score && (
                      <div className="text-right">
                        <div className="text-lg font-bold text-teal-600">{app.match_score}%</div>
                        <div className="text-xs text-gray-400">Match</div>
                      </div>
                    )}
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.label}
                    </span>
                  </div>
                </div>
                {app.match_reasoning && (
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <p className="text-sm text-gray-500">{app.match_reasoning}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-lg">ยังไม่มีใบสมัคร</p>
          <p className="text-sm mt-1">ไปที่หน้าตำแหน่งงานเพื่อสมัครงาน</p>
        </div>
      )}
    </div>
  );
}
