import React from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { BrowserRouter } from 'react-router-dom'
import { theme } from './utils/theme'
import { AuthProvider } from './components/Auth/AuthProvider'
import MainLayout from './components/Layout/MainLayout'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <BrowserRouter>
          <MainLayout />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App 