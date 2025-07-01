export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_client_test_cases: {
        Row: {
          ai_client_id: string
          created_at: string
          id: string
          test_case_id: string
        }
        Insert: {
          ai_client_id: string
          created_at?: string
          id?: string
          test_case_id: string
        }
        Update: {
          ai_client_id?: string
          created_at?: string
          id?: string
          test_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_client_test_cases_ai_client_id_fkey"
            columns: ["ai_client_id"]
            isOneToOne: false
            referencedRelation: "ai_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_client_test_cases_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_clients: {
        Row: {
          category: string
          created_at: string
          id: string
          max_messages: number
          name: string
          prompt: string
          updated_at: string
          use_random_generation: boolean
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          max_messages?: number
          name: string
          prompt: string
          updated_at?: string
          use_random_generation?: boolean
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          max_messages?: number
          name?: string
          prompt?: string
          updated_at?: string
          use_random_generation?: boolean
        }
        Relationships: []
      }
      conversations: {
        Row: {
          ai_client_id: string | null
          chat_type: string
          created_at: string
          customer_message: string
          id: string
          service_response: string
          test_case_id: string | null
          test_mode: string
        }
        Insert: {
          ai_client_id?: string | null
          chat_type?: string
          created_at?: string
          customer_message: string
          id?: string
          service_response: string
          test_case_id?: string | null
          test_mode: string
        }
        Update: {
          ai_client_id?: string | null
          chat_type?: string
          created_at?: string
          customer_message?: string
          id?: string
          service_response?: string
          test_case_id?: string | null
          test_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_ai_client_id_fkey"
            columns: ["ai_client_id"]
            isOneToOne: false
            referencedRelation: "ai_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          content: string
          created_at: string
          file_type: string
          filename: string
          id: string
        }
        Insert: {
          content: string
          created_at?: string
          file_type: string
          filename: string
          id?: string
        }
        Update: {
          content?: string
          created_at?: string
          file_type?: string
          filename?: string
          id?: string
        }
        Relationships: []
      }
      test_cases: {
        Row: {
          attack_type: string
          category: string
          created_at: string
          expected_result: string
          id: string
          test_prompt: string
          updated_at: string
        }
        Insert: {
          attack_type: string
          category: string
          created_at?: string
          expected_result: string
          id?: string
          test_prompt: string
          updated_at?: string
        }
        Update: {
          attack_type?: string
          category?: string
          created_at?: string
          expected_result?: string
          id?: string
          test_prompt?: string
          updated_at?: string
        }
        Relationships: []
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
