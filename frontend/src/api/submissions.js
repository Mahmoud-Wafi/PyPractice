import api from './client'
export const submitCode = d => api.post('/submit/', d)
export const runCode = d => api.post('/run/', d)
export const getHistory = qid => api.get(`/questions/${qid}/submissions/`)
export const getAllSubmissions = () => api.get('/submissions/')
export const getStats = () => api.get('/submissions/stats/')
