export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          bio: string | null
          location: string | null
          is_admin: boolean
          is_anonymous: boolean
          privacy_settings: Json
          created_at: string
          updated_at: string
          last_active: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          bio?: string | null
          location?: string | null
          is_admin?: boolean
          is_anonymous?: boolean
          privacy_settings?: Json
          created_at?: string
          updated_at?: string
          last_active?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          bio?: string | null
          location?: string | null
          is_admin?: boolean
          is_anonymous?: boolean
          privacy_settings?: Json
          created_at?: string
          updated_at?: string
          last_active?: string
        }
      }
      progress: {
        Row: {
          id: string
          user_id: string
          lecture_slug: string
          completed_at: string
          tier_viewed: string
          time_spent: number
        }
        Insert: {
          id?: string
          user_id: string
          lecture_slug: string
          completed_at?: string
          tier_viewed: string
          time_spent?: number
        }
        Update: {
          id?: string
          user_id?: string
          lecture_slug?: string
          completed_at?: string
          tier_viewed?: string
          time_spent?: number
        }
      }
      notes: {
        Row: {
          id: string
          user_id: string
          lecture_slug: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lecture_slug: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lecture_slug?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      highlights: {
        Row: {
          id: string
          user_id: string
          lecture_slug: string
          text: string
          color: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lecture_slug: string
          text: string
          color: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lecture_slug?: string
          text?: string
          color?: string
          note?: string | null
          created_at?: string
        }
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          lecture_slug: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lecture_slug: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lecture_slug?: string
          note?: string | null
          created_at?: string
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          section_num: number
          score: number
          total_questions: number
          answers: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          section_num: number
          score: number
          total_questions: number
          answers: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          section_num?: number
          score?: number
          total_questions?: number
          answers?: Json
          created_at?: string
        }
      }
      discussions: {
        Row: {
          id: string
          lecture_slug: string | null
          news_id: string | null
          parent_id: string | null
          user_id: string
          content: string
          upvotes: number
          is_hidden: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lecture_slug?: string | null
          news_id?: string | null
          parent_id?: string | null
          user_id: string
          content: string
          upvotes?: number
          is_hidden?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lecture_slug?: string | null
          news_id?: string | null
          parent_id?: string | null
          user_id?: string
          content?: string
          upvotes?: number
          is_hidden?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      discussion_votes: {
        Row: {
          id: string
          discussion_id: string
          user_id: string
          vote: number
          created_at: string
        }
        Insert: {
          id?: string
          discussion_id: string
          user_id: string
          vote: number
          created_at?: string
        }
        Update: {
          id?: string
          discussion_id?: string
          user_id?: string
          vote?: number
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          discussion_id: string | null
          user_id: string | null
          reason: string
          status: string
          admin_notes: string | null
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          reporter_id: string
          discussion_id?: string | null
          user_id?: string | null
          reason: string
          status?: string
          admin_notes?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          reporter_id?: string
          discussion_id?: string | null
          user_id?: string | null
          reason?: string
          status?: string
          admin_notes?: string | null
          created_at?: string
          resolved_at?: string | null
        }
      }
      study_groups: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          is_private: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          is_private?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string
          is_private?: boolean
          created_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
      news_articles: {
        Row: {
          id: string
          title: string
          content: string
          original_sources: Json
          category: string
          curriculum_links: Json
          source_biases: string | null
          is_published: boolean
          created_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          title: string
          content: string
          original_sources: Json
          category: string
          curriculum_links?: Json
          source_biases?: string | null
          is_published?: boolean
          created_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          content?: string
          original_sources?: Json
          category?: string
          curriculum_links?: Json
          source_biases?: string | null
          is_published?: boolean
          created_at?: string
          published_at?: string | null
        }
      }
      news_submissions: {
        Row: {
          id: string
          raw_content: string
          source_channel: string | null
          status: string
          processed_article_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          raw_content: string
          source_channel?: string | null
          status?: string
          processed_article_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          raw_content?: string
          source_channel?: string | null
          status?: string
          processed_article_id?: string | null
          created_at?: string
        }
      }
      graduate_registry: {
        Row: {
          id: string
          user_id: string
          completed_at: string
          certificate_hash: string
          is_public: boolean
        }
        Insert: {
          id?: string
          user_id: string
          completed_at?: string
          certificate_hash: string
          is_public?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          completed_at?: string
          certificate_hash?: string
          is_public?: boolean
        }
      }
      user_bans: {
        Row: {
          id: string
          user_id: string
          reason: string
          banned_by: string
          banned_until: string | null
          is_permanent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reason: string
          banned_by: string
          banned_until?: string | null
          is_permanent?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reason?: string
          banned_by?: string
          banned_until?: string | null
          is_permanent?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
