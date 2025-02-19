import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box
} from '@mui/material'

const MEDIA_TYPES = ['Book', 'TV Show', 'Movie', 'Anime', 'Manga']

interface AddMediaDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (media: { title: string; type: string; currentPosition: string }) => void
}

const AddMediaDialog: React.FC<AddMediaDialogProps> = ({ open, onClose, onSubmit }) => {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('')
  const [currentPosition, setCurrentPosition] = useState('')

  const handleSubmit = () => {
    onSubmit({ title, type, currentPosition })
    onClose()
    setTitle('')
    setType('')
    setCurrentPosition('')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Item</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
          />
          <TextField
            select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            fullWidth
          >
            {MEDIA_TYPES.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Current Position"
            value={currentPosition}
            onChange={(e) => setCurrentPosition(e.target.value)}
            fullWidth
            placeholder="e.g., Chapter 5 or Season 1 Episode 3"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddMediaDialog 