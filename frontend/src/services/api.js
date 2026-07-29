import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data || '')
    return config
  },
  (error) => {
    console.error('[API] Request error:', error)
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    console.log(`[API] ✅ ${response.config.url} →`, response.data)
    return response
  },
  (error) => {
    const msg = error.response?.data?.detail || error.message || 'Unknown error'
    console.error(`[API] ❌ ${error.config?.url} → ${msg}`)
    return Promise.reject(new Error(msg))
  }
)
// ─── Auth API ──────────────────────────────────────────────────────────────
export const authApi = {
  loginPin: (student_id, pin) => api.post('/auth/login/pin', { student_id, pin }),
  loginSso: (role, provider) => api.post('/auth/login/sso', { role, provider }),
  loginOtp: (parent_id, otp) => api.post('/auth/login/otp', { parent_id, otp }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

// ─── Student API ───────────────────────────────────────────────────────────
export const studentApi = {
  create: (name, grade, section, level) => api.post('/students/', { name, grade, section, level }),
  get: (id) => api.get(`/students/${id}`),
  updateLevel: (id, level) =>
    api.patch(`/students/${id}/level?level=${encodeURIComponent(level)}`),
}

// ─── Quiz API ──────────────────────────────────────────────────────────────
export const quizApi = {
  getQuestions: (conceptId = 1) => api.get(`/quiz/questions?concept_id=${conceptId}`),
  checkAnswer: (questionId, selected) =>
    api.get(`/quiz/check-answer/${questionId}/${selected}`),
  submit: (student_id, concept_id, answers) =>
    api.post('/quiz/submit', { student_id: String(student_id), concept_id, answers }),
};

// ─── Lessons API ───────────────────────────────────────────────────────────
export const lessonsApi = {
  getByLevel: (level, conceptId = 1) => api.get(`/lessons/${encodeURIComponent(level)}?concept_id=${conceptId}`),
  startSession: (student_id, lesson_id) =>
    api.post('/lessons/session/start', { student_id, lesson_id }),
  completeSession: (student_id, lesson_id, time_spent_seconds) =>
    api.post('/lessons/session/complete', { student_id, lesson_id, time_spent_seconds }),
  submitPractice: (data) => api.post('/lessons/practice/answer', data),
  getActiveSession: (studentId) => api.get(`/lessons/session/active/${studentId}`),
  getConceptLevel: (studentId, conceptId) => api.get(`/lessons/concept-level/${studentId}/${conceptId}`),
}

// ─── Doubts API ────────────────────────────────────────────────────────────
export const doubtsApi = {
  ask: async (student_id, question, mode, imageFile = null) => {
    const formData = new FormData()
    formData.append('student_id', student_id)
    formData.append('question', question)
    formData.append('mode', mode)
    if (imageFile) formData.append('image', imageFile)
    return axios.post('/api/doubts/ask', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
  },
  getHistory: (student_id) => api.get(`/doubts/history/${student_id}`),
  submitFeedback: (doubt_id, upvote) => api.post(`/doubts/${doubt_id}/feedback`, { upvote }),
}

// ─── Dashboard API ─────────────────────────────────────────────────────────
export const dashboardApi = {
  get: (student_id, chapter_id = null) => api.get(`/dashboard/${student_id}${chapter_id ? `?chapter_id=${chapter_id}` : ''}`),
}


// ─── Concepts API ──────────────────────────────────────────────────────────
export const conceptsApi = {
  getAll: () => api.get('/concepts/'),
  getTree: () => api.get('/concepts/tree'),
}

// ─── Teacher API ───────────────────────────────────────────────────────────
export const teacherApi = {
  getSections: () => api.get('/teacher/sections'),
  getDashboard: (section) => api.get(`/teacher/dashboard?section=${encodeURIComponent(section)}`),
  getRoster: (section) => api.get(`/teacher/roster${section ? `?section=${encodeURIComponent(section)}` : ''}`),
  getHeatmap: (section) => api.get(`/teacher/heatmap?section=${encodeURIComponent(section)}`),
  getItemAnalysis: () => api.get(`/teacher/item-analysis`),
  getMessages: () => api.get(`/teacher/messages`),
  assignPractice: (studentId, concept) => api.post('/teacher/assign-practice', { student_id: studentId, concept }),
  sendMessage: (studentId, message) => api.post('/teacher/message', { student_id: studentId, message })
}

// ─── Parent API ────────────────────────────────────────────────────────────
export const parentApi = {
  getOverview: (childId) => api.get(`/parent/overview/${childId}`),
  getDigest: (childId) => api.get(`/parent/digest/${childId}`),
  getAlerts: (childId) => api.get(`/parent/alerts/${childId}`),
  getSettings: (childId) => api.get(`/parent/settings/${childId}`),
  updateSettings: (childId, data) => api.post(`/parent/settings/${childId}`, data),
  messageTeacher: (childId, message) => api.post(`/parent/message/${childId}`, { message }),
  getAlertLog: (childId, alertId) => api.get(`/parent/alerts/${childId}/log/${alertId}`)
}

// ─── Admin API ─────────────────────────────────────────────────────────────
export const adminApi = {
  getCompliance: () => api.get('/admin/compliance'),
  getContentStats: () => api.get('/admin/content-stats'),
  importContent: (data) => api.post('/admin/import-content', data),
  getContentItems: () => api.get('/admin/content-items'),
  createContentItem: (data) => api.post('/admin/content-items', data),
  updateContentItem: (id, data) => api.put(`/admin/content-items/${id}`, data),
  deleteContentItem: (id) => api.delete(`/admin/content-items/${id}`),
}

export const notificationsApi = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all')
};

// ─── Escalations API ───────────────────────────────────────────────────────
export const escalationsApi = {
  getEscalations: (status = 'pending') => api.get(`/escalations/?status=${status}`),
  claimEscalation: (id) => api.post(`/escalations/${id}/claim`),
  respondEscalation: (id, responseText) => api.post(`/escalations/${id}/respond`, { response_text: responseText }),
  regenerateDraft: (id) => api.post(`/escalations/${id}/regenerate-draft`),
  createEscalation: (studentId, doubtText, conceptId = null, aiConfidence = null) =>
    api.post('/escalations/', { student_id: studentId, doubt_text: doubtText, concept_id: conceptId, ai_confidence: aiConfidence }),
}

// ─── Gamification API ──────────────────────────────────────────────────────
export const gamificationApi = {
  getProfile: (studentId) => api.get(`/gamification/${studentId}`),
  getBadges: (studentId) => api.get(`/gamification/badges/${studentId}`),
  getLeaderboard: () => api.get('/gamification/leaderboard'),
}

// ─── Report Card API ───────────────────────────────────────────────────────
export const reportCardApi = {
  getReportCard: (studentId) => api.get(`/report-card/${studentId}`),
}

export default api
