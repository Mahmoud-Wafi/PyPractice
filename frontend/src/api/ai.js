import api from './client'
export const chat = d => api.post('/ai/chat/', d)
export const getHint = (qid, d) => api.post(`/ai/hint/${qid}/`, d)
