import axios from "axios";
import Cookies from "js-cookie";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Seed Authorization header on client-side startup
if (typeof window !== "undefined") {
  const token = Cookies.get("token");
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }
}

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove("token", { path: "/" });
      delete api.defaults.headers.common.Authorization;
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; full_name: string; role: string; phone?: string }) =>
    api.post("/api/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/api/auth/login", data),
  getMe: () => api.get("/api/auth/me"),
};

// Jobs API
export const jobsAPI = {
  list: (params?: { status_filter?: string; skip?: number; limit?: number }) =>
    api.get("/api/jobs", { params }),
  get: (id: number) => api.get(`/api/jobs/${id}`),
  create: (data: any) => api.post("/api/jobs", data),
  update: (id: number, data: any) => api.put(`/api/jobs/${id}`, data),
  delete: (id: number) => api.delete(`/api/jobs/${id}`),
  generateJD: (data: { title: string; department?: string; seniority_level?: string; key_skills?: string; additional_notes?: string }) =>
    api.post("/api/jobs/generate-jd", data),
};

// Candidates API
export const candidatesAPI = {
  uploadResume: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/api/candidates/upload-resume", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  list: (params?: { skip?: number; limit?: number; search?: string }) =>
    api.get("/api/candidates", { params }),
  get: (id: number) => api.get(`/api/candidates/${id}`),
  getResume: (candidateId: number) =>
    api.get(`/api/candidates/${candidateId}/resume`, { responseType: "blob" }),
  compare: (data: { job_id: number; application_ids: number[]; output_language?: "th" | "en" }) =>
    api.post("/api/candidates/compare", data),
  apply: (data: { job_id: number; cover_letter?: string }) =>
    api.post("/api/candidates/apply", data),
  getApplicationsForJob: (jobId: number, params?: { skip?: number; limit?: number }) =>
    api.get(`/api/candidates/applications/job/${jobId}`, { params }),
  updateApplicationStatus: (applicationId: number, status: string) =>
    api.put(`/api/candidates/applications/${applicationId}/status?new_status=${status}`),
  myApplications: () => api.get("/api/candidates/my/applications"),
};

// Chatbot API
export const chatbotAPI = {
  sendMessage: (data: { message: string; session_id?: string; context?: string }) =>
    api.post("/api/chatbot", data),
  getContextSummary: () =>
    api.get("/api/chatbot/context/summary"),
  clearSession: (sessionId: string) =>
    api.delete(`/api/chatbot/session/${sessionId}`),
};

// Audit API
export const auditAPI = {
  list: (params?: { skip?: number; limit?: number; action?: string; entity_type?: string }) =>
    api.get("/api/audit", { params }),
};

export default api;

