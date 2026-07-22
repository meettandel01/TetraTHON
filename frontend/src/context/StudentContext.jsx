import React, { createContext, useContext, useState, useEffect } from 'react'

const StudentContext = createContext(null)

export const StudentProvider = ({ children }) => {
  const [student, setStudent] = useState(() => {
    // Persist student in localStorage for session continuity
    const saved = localStorage.getItem('tetrathon_student')
    return saved ? JSON.parse(saved) : null
  })

  const updateStudent = (data) => {
    const updated = { ...student, ...data }
    setStudent(updated)
    localStorage.setItem('tetrathon_student', JSON.stringify(updated))
    console.log('[Context] Student updated:', updated)
  }

  const clearStudent = () => {
    setStudent(null)
    localStorage.removeItem('tetrathon_student')
    console.log('[Context] Student cleared')
  }

  return (
    <StudentContext.Provider value={{ student, setStudent: updateStudent, clearStudent }}>
      {children}
    </StudentContext.Provider>
  )
}

export const useStudent = () => {
  const ctx = useContext(StudentContext)
  if (!ctx) throw new Error('useStudent must be used within StudentProvider')
  return ctx
}
