import client from './client'

export const getCourses = (params) => client.get('/attendance/courses/', { params })
export const createCourse = (data) => client.post('/attendance/courses/', data)
export const updateCourse = (id, data) => client.patch(`/attendance/courses/${id}/`, data)
export const enrollStudents = (id, studentIds) => client.post(`/attendance/courses/${id}/enroll/`, { student_ids: studentIds })
export const unenrollStudents = (id, studentIds) => client.post(`/attendance/courses/${id}/unenroll/`, { student_ids: studentIds })
export const getCourseRoster = (id) => client.get(`/attendance/courses/${id}/roster/`)

export const getSessions = (params) => client.get('/attendance/sessions/', { params })
export const getSession = (id) => client.get(`/attendance/sessions/${id}/`)
export const createSession = (data) => client.post('/attendance/sessions/', data)
export const closeSession = (id) => client.post(`/attendance/sessions/${id}/close/`)
export const getSessionRecords = (id) => client.get(`/attendance/sessions/${id}/records/`)

export const getRecords = (params) => client.get('/attendance/records/', { params })
export const createRecord = (data) => client.post('/attendance/records/', data)

export const nfcAttendanceTap = (data) => client.post('/attendance/nfc-tap/', data)
export const nfcCampusTap = (data) => client.post('/attendance/campus-nfc-tap/', data)

export const getCampusEntries = (params) => client.get('/attendance/campus-entries/', { params })
export const getAttendanceSummary = () => client.get('/attendance/summary/')
