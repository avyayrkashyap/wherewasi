import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'
import { useAuth } from '../Auth/AuthProvider'
import Login from '../Auth/Login'
import NavBar from './NavBar'
import HomePage from '../Pages/HomePage'

const MainLayout: React.FC = () => {
  const { user } = useAuth()

  if (!user) {
    return <Login />
  }

  return (
    <Box>
      <NavBar />
      <Box component="main" sx={{ p: 3 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Box>
  )
}

export default MainLayout
