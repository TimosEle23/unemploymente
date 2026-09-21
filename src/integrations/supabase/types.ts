export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      application_events: {
        Row: {
          application_id: string
          created_at: string
          event_date: string
          event_type: string
          id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          event_date?: string
          event_type: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          event_date?: string
          event_type?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          application_deadline: string | null
          applied_at: string | null
          benefits: string[]
          cloud_technologies: string[]
          company: string
          contact_info: string | null
          created_at: string
          currency: string | null
          description: string | null
          education_requirements: string | null
          employment_type: string | null
          extra_info: string | null
          extraction_source: string | null
          frameworks: string[]
          id: string
          is_seed: boolean
          job_board: string | null
          job_title: string
          job_url: string | null
          location: string | null
          ml_technologies: string[]
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          posted_date: string | null
          preferred_skills: string[]
          programming_languages: string[]
          qualifications: string[]
          recruiter_contact: string | null
          recruiter_name: string | null
          required_experience: string | null
          required_skills: string[]
          requirements: string[]
          responsibilities: string[]
          salary_max: number | null
          salary_min: number | null
          salary_text: string | null
          status: string
          updated_at: string
          user_id: string
          work_arrangement: string | null
        }
        Insert: {
          application_deadline?: string | null
          applied_at?: string | null
          benefits?: string[]
          cloud_technologies?: string[]
          company: string
          contact_info?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          education_requirements?: string | null
          employment_type?: string | null
          extra_info?: string | null
          extraction_source?: string | null
          frameworks?: string[]
          id?: string
          is_seed?: boolean
          job_board?: string | null
          job_title: string
          job_url?: string | null
          location?: string | null
          ml_technologies?: string[]
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          posted_date?: string | null
          preferred_skills?: string[]
          programming_languages?: string[]
          qualifications?: string[]
          recruiter_contact?: string | null
          recruiter_name?: string | null
          required_experience?: string | null
          required_skills?: string[]
          requirements?: string[]
          responsibilities?: string[]
          salary_max?: number | null
          salary_min?: number | null
          salary_text?: string | null
          status?: string
          updated_at?: string
          user_id: string
          work_arrangement?: string | null
        }
        Update: {
          application_deadline?: string | null
          applied_at?: string | null
          benefits?: string[]
          cloud_technologies?: string[]
          company?: string
          contact_info?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          education_requirements?: string | null
          employment_type?: string | null
          extra_info?: string | null
          extraction_source?: string | null
          frameworks?: string[]
          id?: string
          is_seed?: boolean
          job_board?: string | null
          job_title?: string
          job_url?: string | null
          location?: string | null
          ml_technologies?: string[]
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          posted_date?: string | null
          preferred_skills?: string[]
          programming_languages?: string[]
          qualifications?: string[]
          recruiter_contact?: string | null
          recruiter_name?: string | null
          required_experience?: string | null
          required_skills?: string[]
          requirements?: string[]
          responsibilities?: string[]
          salary_max?: number | null
          salary_min?: number | null
          salary_text?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          work_arrangement?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          application_id: string | null
          created_at: string
          email: string | null
          id: string
          linkedin: string | null
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          linkedin?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          linkedin?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      followups: {
        Row: {
          action: string
          application_id: string
          created_at: string
          done: boolean
          due_date: string | null
          id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action: string
          application_id: string
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string
          application_id?: string
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followups_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          application_id: string
          category: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id: string
          category?: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          education: string[]
          email: string | null
          full_name: string | null
          headline: string | null
          id: string
          skills: string[]
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          created_at?: string
          education?: string[]
          email?: string | null
          full_name?: string | null
          headline?: string | null
          id: string
          skills?: string[]
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          created_at?: string
          education?: string[]
          email?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          skills?: string[]
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      screenshots: {
        Row: {
          application_id: string | null
          created_at: string
          file_name: string | null
          id: string
          ocr_text: string | null
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          file_name?: string | null
          id?: string
          ocr_text?: string | null
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          file_name?: string | null
          id?: string
          ocr_text?: string | null
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "screenshots_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          application_id: string
          created_at: string
          id: string
          kind: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          kind?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          kind?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
