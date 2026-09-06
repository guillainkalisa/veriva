import client from './client'

export const getColleges = () => client.get('/students/colleges/')
export const getSchools = (collegeId) =>
  client.get('/students/schools/', { params: { college: collegeId } })
export const getDepartments = (schoolId) =>
  client.get('/students/departments/', { params: { school: schoolId } })
export const getPrograms = (departmentId) =>
  client.get('/students/programs/', { params: { department: departmentId } })
