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

// ─── Student API ───────────────────────────────────────────────────────────
export const studentApi = {
  create: (name, grade = '9') => api.post('/students/', { name, grade }),
  get: (id) => api.get(`/students/${id}`),
  updateLevel: (id, level) =>
    api.patch(`/students/${id}/level?level=${encodeURIComponent(level)}`),
}

// ─── Quiz API ──────────────────────────────────────────────────────────────
export const quizApi = {
  getQuestions: () => api.get('/quiz/questions'),
  checkAnswer: (questionId, selected) =>
    api.get(`/quiz/check-answer/${questionId}/${selected}`),
  submit: (student_id, answers) =>
    api.post('/quiz/submit', { student_id, answers }),
}

// ─── Lessons API ───────────────────────────────────────────────────────────
export const lessonsApi = {
  getByLevel: (level) => api.get(`/lessons/${level}`),
  startSession: (student_id, lesson_id) =>
    api.post('/lessons/session/start', { student_id, lesson_id }),
  submitPractice: (data) => api.post('/lessons/practice/answer', data),
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
}

// ─── Dashboard API ─────────────────────────────────────────────────────────
export const dashboardApi = {
  get: (student_id) => api.get(`/dashboard/${student_id}`),
}

export default api
