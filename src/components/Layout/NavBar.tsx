import React from 'react'
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { useAuth } from '../Auth/AuthProvider'

const NavBar: React.FC = () => {
  const { user, signOut } = useAuth()

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          WhereWasI
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1">
            {user?.email}
          </Typography>
          <Button color="inherit" onClick={signOut}>
            Sign Out
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default NavBar 