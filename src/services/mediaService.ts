import { supabase } from '../utils/supabase'
import { Media, MediaCreate, MediaUpdate } from '../types/media'

export const mediaService = {
  async getAll(userId: string): Promise<Media[]> {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async create(userId: string, media: MediaCreate): Promise<Media> {
    const { data, error } = await supabase
      .from('media')
      .insert([{ ...media, user_id: userId }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: number, updates: MediaUpdate): Promise<Media> {
    const { data, error } = await supabase
      .from('media')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('media')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async updateNotes(id: number, notes: string): Promise<void> {
    const { error } = await supabase
      .from('media')
      .update({ notes })
      .eq('id', id)

    if (error) throw error
  }
} 