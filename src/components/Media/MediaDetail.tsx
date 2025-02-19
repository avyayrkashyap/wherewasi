import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import EditMediaDialog from './EditMediaDialog'
import { mediaService } from '../../services/mediaService'

interface MediaDetailProps {
  item: {
    id: number
    title: string
    type: string
    current_position: string
    notes?: string
  }
  onBack: () => void
  onEdit: (id: number, updates: { title: string; type: string; currentPosition: string }) => void
  onDelete: (id: number) => void
}

const MediaDetail: React.FC<MediaDetailProps> = ({ item, onBack, onEdit, onDelete }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [notes, setNotes] = useState(item.notes || '')
  const [isSavingNotes, setSavingNotes] = useState(false)

  const handleEdit = (updates: { title: string; type: string; currentPosition: string }) => {
    onEdit(item.id, updates)
  }

  const handleDelete = () => {
    onDelete(item.id)
    onBack()
  }

  const handleNotesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNotes = e.target.value
    setNotes(newNotes)
    
    try {
      setSavingNotes(true)
      await mediaService.updateNotes(item.id, newNotes)
    } catch (error) {
      console.error('Error saving notes:', error)
      // TODO: Add error handling
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton onClick={onBack}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">{item.title}</Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">Details</Typography>
          <Box>
            <IconButton color="primary" onClick={() => setIsEditDialogOpen(true)}>
              <EditIcon />
            </IconButton>
            <IconButton color="error" onClick={() => setIsDeleteDialogOpen(true)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Type"
            value={item.type}
            InputProps={{ readOnly: true }}
            fullWidth
          />
          <TextField
            label="Current Position"
            value={item.current_position}
            InputProps={{ readOnly: true }}
            fullWidth
          />
          <TextField
            label="Notes"
            multiline
            rows={4}
            value={notes}
            onChange={handleNotesChange}
            placeholder="Add notes about where you left off..."
            fullWidth
            helperText={isSavingNotes ? 'Saving...' : ' '}
          />
        </Box>
      </Paper>

      <EditMediaDialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleEdit}
        item={item}
      />

      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Delete Item</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{item.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MediaDetail 