import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid,
  Button,
  CardActionArea 
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useAuth } from '../Auth/AuthProvider'
import { mediaService } from '../../services/mediaService'
import { Media } from '../../types/media'
import AddMediaDialog from '../Media/AddMediaDialog'
import MediaDetail from '../Media/MediaDetail'

const HomePage: React.FC = () => {
  const { user } = useAuth()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Media | null>(null)
  const [items, setItems] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMedia()
  }, [user])

  const loadMedia = async () => {
    if (!user) return
    try {
      const data = await mediaService.getAll(user.id)
      setItems(data)
    } catch (error) {
      console.error('Error loading media:', error)
      // TODO: Add error handling
    } finally {
      setLoading(false)
    }
  }

  const handleAddMedia = async (media: { title: string; type: string; currentPosition: string }) => {
    if (!user) return
    try {
      const newItem = await mediaService.create(user.id, {
        title: media.title,
        type: media.type,
        current_position: media.currentPosition
      })
      setItems([newItem, ...items])
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error adding media:', error)
      // TODO: Add error handling
    }
  }

  const handleEditMedia = async (id: number, updates: { title: string; type: string; currentPosition: string }) => {
    try {
      const updatedItem = await mediaService.update(id, {
        title: updates.title,
        type: updates.type,
        current_position: updates.currentPosition
      })
      setItems(items.map(item => item.id === id ? updatedItem : item))
      setSelectedItem(updatedItem)
    } catch (error) {
      console.error('Error updating media:', error)
      // TODO: Add error handling
    }
  }

  const handleDeleteMedia = async (id: number) => {
    try {
      await mediaService.delete(id)
      setItems(items.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting media:', error)
      // TODO: Add error handling
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    )
  }

  if (selectedItem) {
    return (
      <MediaDetail 
        item={selectedItem} 
        onBack={() => setSelectedItem(null)}
        onEdit={handleEditMedia}
        onDelete={handleDeleteMedia}
      />
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">My List</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setIsAddDialogOpen(true)}
        >
          Add New
        </Button>
      </Box>

      <Grid container spacing={3}>
        {items.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card>
              <CardActionArea onClick={() => setSelectedItem(item)}>
                <CardContent>
                  <Typography variant="h6">{item.title}</Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {item.type}
                  </Typography>
                  <Typography variant="body2">
                    Current Position: {item.current_position}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <AddMediaDialog 
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleAddMedia}
      />
    </Box>
  )
}

export default HomePage 