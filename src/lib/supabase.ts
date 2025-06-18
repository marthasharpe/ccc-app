import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      ccc_paragraphs: {
        Row: {
          id: number
          paragraph_number: number
          content: string
          embedding: number[] | null
          created_at: string
        }
        Insert: {
          id?: number
          paragraph_number: number
          content: string
          embedding?: number[] | null
          created_at?: string
        }
        Update: {
          id?: number
          paragraph_number?: number
          content?: string
          embedding?: number[] | null
          created_at?: string
        }
      }
    }
  }
}