const SUPABASE_URL = 'https://hhichiqwpzchpqfawaim.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWNoaXF3cHpjaHBxZmF3YWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5MzM2MjYsImV4cCI6MjA1NTUwOTYyNn0.T_X1267Uus5lSE-uvXehgwaK6DV9gxzkL0pmj0nZGs0'

// Create the Supabase client using the global supabase object
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 