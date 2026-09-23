import client from './client'

export const getStudents = (params) => client.get('/students/', { params })
export const getStudent = (id) => client.get(`/students/${id}/`)
export const createStudent = (data) => client.post('/students/', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const updateStudent = (id, data) => client.patch(`/students/${id}/`, data, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const deleteStudent = (id) => client.delete(`/students/${id}/`)
export const assignNFC = (id, cardSerial) =>
  client.post(`/students/${id}/assign-nfc/`, { card_serial: cardSerial })
export const setNFCStatus = (id, action, reason = '') =>
  client.post(`/students/${id}/nfc-status/`, { action, reason })
export const nfcLookup = (uid) => client.get('/students/nfc-lookup/', { params: { uid } })
