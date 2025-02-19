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

interface EditMediaDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (media: { title: string; type: string; currentPosition: string }) => void
  item: {
    title: string
    type: string
    current_position: string
  }
}

const EditMediaDialog: React.FC<EditMediaDialogProps> = ({ open, onClose, onSubmit, item }) => {
  const [title, setTitle] = useState(item.title)
  const [type, setType] = useState(item.type)
  const [currentPosition, setCurrentPosition] = useState(item.current_position)

  const handleSubmit = () => {
    onSubmit({ title, type, currentPosition })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Item</DialogTitle>
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
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditMediaDialog 