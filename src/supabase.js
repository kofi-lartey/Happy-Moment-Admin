import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iyslevrqnzlgsfvqcekt.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5c2xldnJxbnpsZ3NmdnFjZWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NzE5NjEsImV4cCI6MjA4NzU0Nzk2MX0.WJpAGcB19xvOFnsG0ZD7pckNe7iIma3STtzTs7ZQCFc'
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
    console.warn('⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY not set. Admin panel may fail to update user records due to RLS. Get your service_role key from Supabase Dashboard > Settings > API.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
export const supabaseAdmin = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : supabase

// Admin credentials
export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin2025',
  fallbackPasswords: ['1313']
}

// Local storage keys
export const STORAGE_KEYS = {
  PHOTOS: 'birthdayPhotos',
  MESSAGES: 'birthdayMessages',
  GIFTS: 'birthdayGifts',
  MOM0: 'birthdayMomoNumber',
  VIEWS: 'birthdayViews',
  ADMIN_LOGGED_IN: 'adminLoggedIn',
  ORDERS: 'birthdayOrders',
  CURRENT_ORDER: 'currentOrderCode',
  USERS: 'birthdayUsers',
  CURRENT_USER: 'currentUser'
}

export const defaultGalleryImages = [
  'https://res.cloudinary.com/djjgkezui/image/upload/v1771045118/IMG-20240922-WA0010_ssgxfc.jpg',
  'https://res.cloudinary.com/djjgkezui/image/upload/v1771045117/IMG-20240425-WA0004_gzmq2d.jpg',
]
