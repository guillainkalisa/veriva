import client from './client'

export const getDashboardStats = () => client.get('/verification/dashboard/')
export const getIncidents = (params) => client.get('/verification/incidents/', { params })
export const createIncident = (data) => client.post('/verification/incidents/', data)
export const resolveIncident = (id, notes) =>
  client.post(`/verification/incidents/${id}/resolve/`, { resolution_notes: notes })
