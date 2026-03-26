"use client";

import { useEffect, useState } from "react";
import { candidatesAPI, jobsAPI } from "@/lib/api";
import { Users, Search, ChevronDown, ChevronUp, Star, FileText, Award, CheckSquare, Square, X, Download, Loader2 } from "lucide-react";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  // New states for Compare and Status features
  const [selectedAppIds, setSelectedAppIds] = useState<number[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<any | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareLanguage, setCompareLanguage] = useState<"th" | "en">("th");
  const applicationScoreMap = new Map<number, number | null>(
    applications.map((app) => [app.id, app.match_score ?? null])
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, jRes] = await Promise.all([
          candidatesAPI.list({ limit: 100 }),
          jobsAPI.list({ status_filter: "active", limit: 50 }),
        ]);
        setCandidates(cRes.data.candidates);
        setJobs(jRes.data.jobs);
      } catch {} finally { setLoading(false); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      fetchApplications(selectedJob);
      setSelectedAppIds([]);
    }
  }, [selectedJob]);

  const fetchApplications = async (jobId: number) => {
    try {
      const res = await candidatesAPI.getApplicationsForJob(jobId, { limit: 100 });
      setApplications(res.data.applications);
    } catch {
      setApplications([]);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-gray-400";
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-teal-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-500";
  };

  const getScoreBg = (score: number | null) => {
    if (!score) return "bg-gray-100";
    if (score >= 80) return "bg-emerald-50 border-emerald-200";
    if (score >= 60) return "bg-teal-50 border-teal-200";
    if (score >= 40) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  };

  const filteredCandidates = candidates.filter((c) =>
    (c.skills || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggleAppSelection = (appId: number) => {
    setSelectedAppIds((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const loadCompareResult = async (
    language: "th" | "en",
    options?: { openModal?: boolean }
  ) => {
    if (!selectedJob || selectedAppIds.length < 2) return;
    const openModal = options?.openModal ?? false;

    if (openModal) {
      setShowCompareModal(true);
      setCompareResult(null);
    }

    setIsComparing(true);
    try {
      const res = await candidatesAPI.compare({
        job_id: selectedJob,
        application_ids: selectedAppIds,
        output_language: language,
      });
      setCompareResult(res.data);
    } catch (error) {
      console.error("Comparison failed:", error);
      alert("Failed to compare candidates.");
      if (openModal) {
        setShowCompareModal(false);
      }
    } finally {
      setIsComparing(false);
    }
  };

  const handleCompare = async () => {
    await loadCompareResult(compareLanguage, { openModal: true });
  };

  const handleChangeCompareLanguage = async (nextLanguage: "th" | "en") => {
    if (nextLanguage === compareLanguage) return;
    setCompareLanguage(nextLanguage);

    if (!showCompareModal || !compareResult) return;
    await loadCompareResult(nextLanguage, { openModal: false });
  };

  const handleStatusChange = async (appId: number, newStatus: string) => {
    try {
      await candidatesAPI.updateApplicationStatus(appId, newStatus);
      if (selectedJob) {
        fetchApplications(selectedJob);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status.");
    }
  };

  const handleDownloadResume = async (candidateId: number, name: string) => {
    try {
      const res = await candidatesAPI.getResume(candidateId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `resume_${name.replace(/\s+/g, "_")}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download resume:", error);
      alert("Failed to download resume. Ensure the candidate has uploaded one.");
    }
  };

  return (
    <div className="animate-fade-in relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Candidates</h1>
          <p className="text-gray-500 text-sm mt-1">ดูรายชื่อผู้สมัครและคะแนนการจับคู่</p>
        </div>
        {selectedAppIds.length >= 2 && (
          <button
            onClick={handleCompare}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-medium"
          >
            <Users className="w-5 h-5" />
            เปรียบเทียบผู้สมัคร {selectedAppIds.length} คน (AI Compare)
          </button>
        )}
      </div>

      {/* Compare Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-6 h-6 text-teal-600" />
                {compareLanguage === "th" ? "ผลการวิเคราะห์เปรียบเทียบผู้สมัคร (AI Comparison)" : "AI Candidate Comparison"}
              </h2>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 text-xs">
                  <button
                    className={`px-2 py-1 rounded ${compareLanguage === "th" ? "bg-teal-500 text-white" : "text-gray-600"}`}
                    onClick={() => handleChangeCompareLanguage("th")}
                    disabled={isComparing}
                  >
                    TH
                  </button>
                  <button
                    className={`px-2 py-1 rounded ${compareLanguage === "en" ? "bg-teal-500 text-white" : "text-gray-600"}`}
                    onClick={() => handleChangeCompareLanguage("en")}
                    disabled={isComparing}
                  >
                    EN
                  </button>
                </div>
                <button onClick={() => setShowCompareModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              {isComparing ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Loader2 className="w-12 h-12 animate-spin text-teal-500 mb-4" />
                  <p className="font-medium text-lg text-gray-700">ระบบ AI กำลังวิเคราะห์และเปรียบเทียบผู้สมัครอย่างละเอียด...</p>
                  <p className="text-sm mt-2 text-gray-400">กระบวนการนี้อาจใช้เวลาสักครู่</p>
                </div>
              ) : compareResult ? (
                <div className="space-y-8">
                  <div className="bg-teal-50 border border-teal-100 p-6 rounded-2xl">
                    <h3 className="font-bold text-teal-800 mb-3 text-lg flex items-center gap-2">
                      <Award className="w-5 h-5" /> {compareLanguage === "th" ? "บทสรุปวิเคราะห์จาก AI" : "AI Analysis"}
                    </h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{compareResult.analysis}</p>
                  </div>
                  
                  {compareResult.recommendation_reasoning && (
                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
                      <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                        <Star className="w-5 h-5" /> {compareLanguage === "th" ? "ผู้ที่เหมาะสมที่สุด" : "Top Recommendation"}
                      </h3>
                      <p className="text-gray-700">{compareResult.recommendation_reasoning}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {compareResult.candidates?.map((cand: any, idx: number) => (
                      <div key={idx} className={`p-5 rounded-xl border ${cand.application_id === compareResult.recommended_application_id ? 'border-teal-400 bg-teal-50/30 shadow-md ring-2 ring-teal-500/20' : 'border-gray-200 bg-white'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-bold text-gray-800 text-lg">{cand.candidate_name || `Candidate #${cand.candidate_id}`}</h4>
                          {cand.application_id === compareResult.recommended_application_id && (
                            <span className="bg-teal-500 text-white text-xs px-2 py-1 rounded-full font-medium">Recommended</span>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          {(() => {
                            const displayScore =
                              applicationScoreMap.get(Number(cand.application_id)) ?? cand.match_score;
                            if (displayScore === null || displayScore === undefined) return null;
                            return (
                              <div>
                                <div className="text-xs text-gray-500 font-medium mb-1">
                                  {compareLanguage === "th" ? "ความเหมาะสมโดยรวม" : "Overall Job Fit"}
                                </div>
                                <div className={`text-2xl font-bold ${getScoreColor(displayScore)}`}>{displayScore}%</div>
                              </div>
                            );
                          })()}
                          
                          {cand.project_relevance_summary && (
                            <div>
                              <h5 className="text-sm font-semibold text-gray-700 mb-1">
                                {compareLanguage === "th" ? "ความเกี่ยวข้องของโปรเจกต์:" : "Project Relevance:"}
                              </h5>
                              <p className="text-sm text-gray-600 leading-relaxed">{cand.project_relevance_summary}</p>
                            </div>
                          )}

                          <div>
                            <h5 className="text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {compareLanguage === "th" ? "จุดแข็ง" : "Strengths"}
                            </h5>
                            <ul className="list-disc pl-5 space-y-1">
                              {cand.strengths?.map((s: string, i: number) => (
                                <li key={i} className="text-sm text-gray-600">{s}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h5 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> {compareLanguage === "th" ? "ส่วนที่ขาด / ควรพิจารณา" : "Gaps"}
                            </h5>
                            <ul className="list-disc pl-5 space-y-1">
                              {cand.gaps?.map((g: string, i: number) => (
                                <li key={i} className="text-sm text-gray-600">{g}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-red-500 flex flex-col items-center">
                  <X className="w-12 h-12 mb-2 opacity-50" />
                  <p>{compareLanguage === "th" ? "ไม่สามารถโหลดข้อมูลเปรียบเทียบได้" : "Failed to load comparison data."}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Job filter */}
      {jobs.length > 0 && (
        <div className="mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" /> กรองและจัดกลุ่มรายชื่อตามตำแหน่งงาน (เลือกเพื่อดูผู้สมัคร)
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedJob(null)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                !selectedJob ? "bg-teal-500 text-white shadow-md" : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-teal-300 hover:bg-white"
              }`}
            >
              รายชื่อรวมทั้งหมด (All)
            </button>
            {jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelectedJob(job.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedJob === job.id ? "bg-teal-500 text-white shadow-md" : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-teal-300 hover:bg-white"
                }`}
              >
                {job.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      {!selectedJob && (
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาด้วยทักษะในภาพรวม..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none text-sm text-gray-700 shadow-sm"
          />
        </div>
      )}

      {/* Applications for selected job */}
      {selectedJob && applications.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
              <Award className="w-6 h-6 text-teal-500" /> 
              รายชื่อผู้สมัครสำหรับตำแหน่งงาน (เรียงตามคะแนนที่ AI ประเมิน)
            </h2>
            <span className="text-sm text-gray-500 bg-white px-3 py-1 border border-gray-200 rounded-full shadow-sm">
              เลือก 2 คนขึ้นไปเพื่อเปรียบเทียบ
            </span>
          </div>
          
          <div className="space-y-4">
            {applications.map((app, i) => {
              const isSelected = selectedAppIds.includes(app.id);
              
              return (
                <div key={app.id} className={`bg-white rounded-2xl p-0 border overflow-hidden shadow-sm transition-all duration-200 ${isSelected ? 'border-teal-400 ring-1 ring-teal-400' : getScoreBg(app.match_score)}`}>
                  <div className="p-5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      {/* Selection Checkbox */}
                      <button 
                        onClick={() => toggleAppSelection(app.id)}
                        className={`p-1.5 rounded-lg transition-colors focus:outline-none ${isSelected ? 'text-teal-500 bg-teal-50' : 'text-gray-300 hover:text-teal-400 hover:bg-gray-50'}`}
                        aria-label="Select for comparison"
                      >
                        {isSelected ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                      </button>

                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-inner ${isSelected ? 'bg-gradient-to-br from-teal-500 to-emerald-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                        #{i + 1}
                      </div>

                      <div className="ml-2 w-[400px]">
                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-teal-700 transition-colors">
                          {app.candidate_name || "ผู้สมัคร (ปกปิดข้อมูล)"}
                        </h3>
                        <p className="text-sm text-gray-500 truncate" title={app.candidate_skills}>
                          {app.candidate_skills || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-1 justify-end items-center gap-6">
                      {/* Match Score */}
                      <div className="text-right px-4 py-2 bg-gray-50/50 rounded-xl border border-gray-100/50">
                        <div className={`text-3xl font-black ${getScoreColor(app.match_score)}`}>
                          {app.match_score ? `${app.match_score}%` : "N/A"}
                        </div>
                        <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{compareLanguage === "th" ? "คะแนนความเหมาะสม" : "Fit Score"}</div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 items-end">
                        {/* Status Dropdown */}
                        <div className="relative inline-flex">
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            className={`appearance-none pl-3 pr-8 py-1.5 rounded-full text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-sm border
                              ${app.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                              ${app.status === 'shortlisted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                              ${app.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                              ${app.status === 'interview' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                              ${app.status === 'hired' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                            `}
                          >
                            <option value="pending">⏳ Pending</option>
                            <option value="shortlisted">⭐ Target</option>
                            <option value="interview">🗣️ Interview</option>
                            <option value="hired">🎉 Hired</option>
                            <option value="rejected">❌ Rejected</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-current opacity-70 pointer-events-none" />
                        </div>

                        {/* Download Resume Button */}
                        <button
                          onClick={() => handleDownloadResume(app.candidate_id, app.candidate_name || "Candidate")}
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-teal-600 hover:bg-teal-50 px-2 py-1 rounded-md transition-colors"
                          title="Download Original Resume File"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {compareLanguage === "th" ? "ดูเรซูเม่" : "View Resume"}
                        </button>
                      </div>

                      <div className="w-px h-12 bg-gray-200 mx-2"></div>

                      <button
                        onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                        className="p-2.5 bg-gray-50 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors border border-gray-200 shadow-sm"
                        title="View Analysis Details"
                      >
                        {expandedId === app.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {expandedId === app.id && (
                    <div className="bg-gray-50 p-6 border-t border-gray-100 flex flex-col gap-4 animate-in slide-in-from-top-2">
                      {app.match_reasoning && (
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                          <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-amber-400" /> {compareLanguage === "th" ? "การวิเคราะห์ความเหมาะสม" : "Overall Reasoning"}
                          </h4>
                          <p className="text-sm text-gray-600 leading-relaxed">{app.match_reasoning}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Candidates View (When no job selected) */}
      {!selectedJob && (
        <>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100 shadow-sm" />
              ))}
            </div>
          ) : filteredCandidates.length > 0 ? (
            <div className="space-y-4">
              {filteredCandidates.map((candidate) => (
                <div key={candidate.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-teal-50 p-2 rounded-lg">
                          <FileText className="w-5 h-5 text-teal-600" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-teal-600 transition-colors">
                          {candidate.resume_original_name || `Candidate Record #${candidate.id}`}
                        </h3>
                        <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full border border-gray-200">
                          ID: {candidate.id}
                        </span>
                      </div>
                      <div className="ml-12 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-700">ทักษะที่มี:</span> {candidate.skills?.substring(0, 150) || "ไม่ระบุ"}
                          {(candidate.skills?.length || 0) > 150 ? "..." : ""}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-700">ประสบการณ์:</span> {candidate.experience_years ? `${candidate.experience_years} ปี` : "ไม่ระบุ"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end justify-between ml-4 set-col gap-4">
                      <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100 whitespace-nowrap">
                        วันลงทะเบียน: {new Date(candidate.created_at).toLocaleDateString("th-TH")}
                      </span>
                      <button
                        onClick={() => handleDownloadResume(candidate.id, candidate.resume_original_name || `Candidate_${candidate.id}`)}
                        className="flex items-center gap-2 text-sm font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 hover:text-teal-700 px-4 py-2 rounded-xl transition-all border border-teal-100 whitespace-nowrap"
                        title="Download Original Resume File"
                      >
                        <Download className="w-4 h-4" />
                        โหลดเรซูเม่
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-1">ยังไม่มีฐานข้อมูลผู้สมัคร</h3>
              <p className="text-gray-500">ทักษะที่คุณค้นหา หรือระบบยังไม่มีคนลงทะเบียน</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
