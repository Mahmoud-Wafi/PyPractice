import api from './client'
export const getLevels = () => api.get('/levels/')
export const getQuestions = slug => api.get(`/levels/${slug}/questions/`)
export const getQuestion = id => api.get(`/questions/${id}/`)
export const getProgress = () => api.get('/progress/')
