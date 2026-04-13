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
      app_settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          marked_by: string | null
          session: string | null
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          marked_by?: string | null
          session?: string | null
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          session?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      class_fee_defaults: {
        Row: {
          annual_fee: number
          class_name: string
          created_at: string
          id: string
        }
        Insert: {
          annual_fee?: number
          class_name: string
          created_at?: string
          id?: string
        }
        Update: {
          annual_fee?: number
          class_name?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      class_teacher_assignments: {
        Row: {
          class_name: string
          created_at: string
          id: string
          section_name: string
          staff_id: string | null
        }
        Insert: {
          class_name: string
          created_at?: string
          id?: string
          section_name: string
          staff_id?: string | null
        }
        Update: {
          class_name?: string
          created_at?: string
          id?: string
          section_name?: string
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_teacher_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_results: {
        Row: {
          admission_no: string
          created_at: string
          examination_id: string
          grade: string
          id: string
          marks_obtained: number
          max_marks: number
          student_name: string
          subject: string
        }
        Insert: {
          admission_no: string
          created_at?: string
          examination_id: string
          grade: string
          id?: string
          marks_obtained: number
          max_marks: number
          student_name: string
          subject: string
        }
        Update: {
          admission_no?: string
          created_at?: string
          examination_id?: string
          grade?: string
          id?: string
          marks_obtained?: number
          max_marks?: number
          student_name?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "examinations"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_room_configs: {
        Row: {
          bench_capacity: number
          benches_per_row: number
          created_at: string
          examination_id: string
          id: string
          num_rows: number
          room_number: string
        }
        Insert: {
          bench_capacity?: number
          benches_per_row?: number
          created_at?: string
          examination_id: string
          id?: string
          num_rows?: number
          room_number: string
        }
        Update: {
          bench_capacity?: number
          benches_per_row?: number
          created_at?: string
          examination_id?: string
          id?: string
          num_rows?: number
          room_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_room_configs_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "examinations"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_schedules: {
        Row: {
          class: string
          created_at: string
          date: string
          end_time: string
          examination_id: string
          id: string
          room: string | null
          start_time: string
          subject: string
        }
        Insert: {
          class: string
          created_at?: string
          date: string
          end_time: string
          examination_id: string
          id?: string
          room?: string | null
          start_time: string
          subject: string
        }
        Update: {
          class?: string
          created_at?: string
          date?: string
          end_time?: string
          examination_id?: string
          id?: string
          room?: string | null
          start_time?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_schedules_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "examinations"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_seating_plans: {
        Row: {
          capacity: number | null
          class: string
          created_at: string
          date: string
          examination_id: string
          id: string
          room: string
          students: string[] | null
        }
        Insert: {
          capacity?: number | null
          class: string
          created_at?: string
          date: string
          examination_id: string
          id?: string
          room: string
          students?: string[] | null
        }
        Update: {
          capacity?: number | null
          class?: string
          created_at?: string
          date?: string
          examination_id?: string
          id?: string
          room?: string
          students?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_seating_plans_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "examinations"
            referencedColumns: ["id"]
          },
        ]
      }
      examinations: {
        Row: {
          classes: string[]
          created_at: string
          description: string | null
          id: string
          name: string
          start_date: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          classes?: string[]
          created_at?: string
          description?: string | null
          id?: string
          name: string
          start_date: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          classes?: string[]
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          start_date?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      fee_payments: {
        Row: {
          amount: number
          cashier_name: string | null
          cheque_bank: string | null
          cheque_date: string | null
          cheque_number: string | null
          class_name: string
          id: string
          payment_date: string | null
          payment_mode: string | null
          quarter: string | null
          receipt_number: string | null
          section: string
          session: string | null
          student_id: string | null
          student_name: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          cashier_name?: string | null
          cheque_bank?: string | null
          cheque_date?: string | null
          cheque_number?: string | null
          class_name: string
          id?: string
          payment_date?: string | null
          payment_mode?: string | null
          quarter?: string | null
          receipt_number?: string | null
          section: string
          session?: string | null
          student_id?: string | null
          student_name: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          cashier_name?: string | null
          cheque_bank?: string | null
          cheque_date?: string | null
          cheque_number?: string | null
          class_name?: string
          id?: string
          payment_date?: string | null
          payment_mode?: string | null
          quarter?: string | null
          receipt_number?: string | null
          section?: string
          session?: string | null
          student_id?: string | null
          student_name?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          assigned_by: string
          class_name: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          section_name: string
          subject: string
          title: string
        }
        Insert: {
          assigned_by: string
          class_name: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          section_name: string
          subject: string
          title: string
        }
        Update: {
          assigned_by?: string
          class_name?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          section_name?: string
          subject?: string
          title?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          target_type: string
          target_values: string[]
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          target_type?: string
          target_values?: string[]
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          target_type?: string
          target_values?: string[]
          title?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          class_name: string
          id: string
          name: string
        }
        Insert: {
          class_name: string
          id?: string
          name: string
        }
        Update: {
          class_name?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          "Full Name": string
          id: string
          join_date: string | null
          "Login Password": string | null
          "Mobile number": number | null
          "Monthly Salary": number | null
          Photo: string | null
          Resume: string | null
          Role: string
          salary_paid: boolean | null
          teaching_classes: string[] | null
        }
        Insert: {
          "Full Name": string
          id?: string
          join_date?: string | null
          "Login Password"?: string | null
          "Mobile number"?: number | null
          "Monthly Salary"?: number | null
          Photo?: string | null
          Resume?: string | null
          Role: string
          salary_paid?: boolean | null
          teaching_classes?: string[] | null
        }
        Update: {
          "Full Name"?: string
          id?: string
          join_date?: string | null
          "Login Password"?: string | null
          "Mobile number"?: number | null
          "Monthly Salary"?: number | null
          Photo?: string | null
          Resume?: string | null
          Role?: string
          salary_paid?: boolean | null
          teaching_classes?: string[] | null
        }
        Relationships: []
      }
      student_notices: {
        Row: {
          created_at: string
          id: string
          notice_id: string
          read: boolean
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notice_id: string
          read?: boolean
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notice_id?: string
          read?: boolean
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_notices_notice_id_fkey"
            columns: ["notice_id"]
            isOneToOne: false
            referencedRelation: "notices"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          admission_number: string
          bus_number: string | null
          class_name: string
          enroll_date: string | null
          father_email: string | null
          father_mobile: string | null
          father_name: string | null
          fee_amount: number
          fee_paid: boolean | null
          id: string
          installments: string[] | null
          mother_email: string | null
          mother_mobile: string | null
          mother_name: string | null
          name: string
          parent_mobile: string | null
          parent_name: string | null
          parent_password: string | null
          payment_mode: string | null
          photo_file: string | null
          pickup_location: string | null
          roll_number: number | null
          section: string
          transport_facility: boolean | null
        }
        Insert: {
          address?: string | null
          admission_number: string
          bus_number?: string | null
          class_name: string
          enroll_date?: string | null
          father_email?: string | null
          father_mobile?: string | null
          father_name?: string | null
          fee_amount?: number
          fee_paid?: boolean | null
          id?: string
          installments?: string[] | null
          mother_email?: string | null
          mother_mobile?: string | null
          mother_name?: string | null
          name: string
          parent_mobile?: string | null
          parent_name?: string | null
          parent_password?: string | null
          payment_mode?: string | null
          photo_file?: string | null
          pickup_location?: string | null
          roll_number?: number | null
          section?: string
          transport_facility?: boolean | null
        }
        Update: {
          address?: string | null
          admission_number?: string
          bus_number?: string | null
          class_name?: string
          enroll_date?: string | null
          father_email?: string | null
          father_mobile?: string | null
          father_name?: string | null
          fee_amount?: number
          fee_paid?: boolean | null
          id?: string
          installments?: string[] | null
          mother_email?: string | null
          mother_mobile?: string | null
          mother_name?: string | null
          name?: string
          parent_mobile?: string | null
          parent_name?: string | null
          parent_password?: string | null
          payment_mode?: string | null
          photo_file?: string | null
          pickup_location?: string | null
          roll_number?: number | null
          section?: string
          transport_facility?: boolean | null
        }
        Relationships: []
      }
      subject_assignments: {
        Row: {
          class_name: string
          created_at: string
          id: string
          section_name: string
          staff_id: string
          subject: string
        }
        Insert: {
          class_name: string
          created_at?: string
          id?: string
          section_name: string
          staff_id: string
          subject: string
        }
        Update: {
          class_name?: string
          created_at?: string
          id?: string
          section_name?: string
          staff_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
