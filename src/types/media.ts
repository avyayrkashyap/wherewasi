export interface Media {
  id: number
  title: string
  type: string
  current_position: string
  notes?: string
  user_id: string
  created_at: string
  updated_at: string
}

export type MediaCreate = Omit<Media, 'id' | 'created_at' | 'updated_at' | 'user_id'>
export type MediaUpdate = Partial<MediaCreate> 