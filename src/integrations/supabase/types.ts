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
          created_at: string | null
          id: string
          key: string
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          value?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          class_name: string | null
          created_at: string | null
          date: string
          id: string
          marked_by: string | null
          section_name: string | null
          session: string | null
          status: string | null
          student_id: string | null
        }
        Insert: {
          class_name?: string | null
          created_at?: string | null
          date: string
          id?: string
          marked_by?: string | null
          section_name?: string | null
          session?: string | null
          status?: string | null
          student_id?: string | null
        }
        Update: {
          class_name?: string | null
          created_at?: string | null
          date?: string
          id?: string
          marked_by?: string | null
          section_name?: string | null
          session?: string | null
          status?: string | null
          student_id?: string | null
        }
        Relationships: [
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
          class_name: string
          created_at: string | null
          default_fee: number | null
          id: string
        }
        Insert: {
          class_name: string
          created_at?: string | null
          default_fee?: number | null
          id?: string
        }
        Update: {
          class_name?: string
          created_at?: string | null
          default_fee?: number | null
          id?: string
        }
        Relationships: []
      }
      class_subjects: {
        Row: {
          class_name: string
          created_at: string | null
          id: string
          subject_name: string
        }
        Insert: {
          class_name: string
          created_at?: string | null
          id?: string
          subject_name: string
        }
        Update: {
          class_name?: string
          created_at?: string | null
          id?: string
          subject_name?: string
        }
        Relationships: []
      }
      class_teacher_assignments: {
        Row: {
          class_name: string
          created_at: string | null
          id: string
          section_name: string
          staff_id: string | null
        }
        Insert: {
          class_name: string
          created_at?: string | null
          id?: string
          section_name: string
          staff_id?: string | null
        }
        Update: {
          class_name?: string
          created_at?: string | null
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
      credential_delivery_log: {
        Row: {
          admission_number: string | null
          created_at: string
          error_message: string | null
          id: string
          method: string
          parent_mobile: string | null
          sent_by: string | null
          status: string
          student_id: string | null
        }
        Insert: {
          admission_number?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          method?: string
          parent_mobile?: string | null
          sent_by?: string | null
          status?: string
          student_id?: string | null
        }
        Update: {
          admission_number?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          method?: string
          parent_mobile?: string | null
          sent_by?: string | null
          status?: string
          student_id?: string | null
        }
        Relationships: []
      }
      exam_results: {
        Row: {
          admission_no: string | null
          created_at: string | null
          examination_id: string | null
          grade: string | null
          id: string
          marks_obtained: number | null
          max_marks: number | null
          student_id: string | null
          student_name: string | null
          subject: string | null
        }
        Insert: {
          admission_no?: string | null
          created_at?: string | null
          examination_id?: string | null
          grade?: string | null
          id?: string
          marks_obtained?: number | null
          max_marks?: number | null
          student_id?: string | null
          student_name?: string | null
          subject?: string | null
        }
        Update: {
          admission_no?: string | null
          created_at?: string | null
          examination_id?: string | null
          grade?: string | null
          id?: string
          marks_obtained?: number | null
          max_marks?: number | null
          student_id?: string | null
          student_name?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "examinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_room_configs: {
        Row: {
          bench_capacity: number | null
          benches_per_row: number | null
          created_at: string | null
          examination_id: string | null
          id: string
          num_rows: number | null
          room_number: string
        }
        Insert: {
          bench_capacity?: number | null
          benches_per_row?: number | null
          created_at?: string | null
          examination_id?: string | null
          id?: string
          num_rows?: number | null
          room_number: string
        }
        Update: {
          bench_capacity?: number | null
          benches_per_row?: number | null
          created_at?: string | null
          examination_id?: string | null
          id?: string
          num_rows?: number | null
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
          class: string | null
          created_at: string | null
          date: string | null
          end_time: string | null
          examination_id: string | null
          id: string
          room: string | null
          start_time: string | null
          subject: string | null
        }
        Insert: {
          class?: string | null
          created_at?: string | null
          date?: string | null
          end_time?: string | null
          examination_id?: string | null
          id?: string
          room?: string | null
          start_time?: string | null
          subject?: string | null
        }
        Update: {
          class?: string | null
          created_at?: string | null
          date?: string | null
          end_time?: string | null
          examination_id?: string | null
          id?: string
          room?: string | null
          start_time?: string | null
          subject?: string | null
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
          class: string | null
          created_at: string | null
          date: string | null
          examination_id: string | null
          id: string
          room: string | null
          students: Json | null
        }
        Insert: {
          capacity?: number | null
          class?: string | null
          created_at?: string | null
          date?: string | null
          examination_id?: string | null
          id?: string
          room?: string | null
          students?: Json | null
        }
        Update: {
          capacity?: number | null
          class?: string | null
          created_at?: string | null
          date?: string | null
          examination_id?: string | null
          id?: string
          room?: string | null
          students?: Json | null
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
          classes: Json | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          start_date: string | null
          status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          classes?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          classes?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fee_payments: {
        Row: {
          amount: number | null
          cashier_name: string | null
          cheque_bank: string | null
          cheque_date: string | null
          cheque_number: string | null
          class_name: string | null
          created_at: string | null
          id: string
          payment_date: string | null
          payment_mode: string | null
          quarter: string | null
          receipt_number: string | null
          section: string | null
          session: string | null
          student_id: string | null
          student_name: string | null
          transaction_id: string | null
        }
        Insert: {
          amount?: number | null
          cashier_name?: string | null
          cheque_bank?: string | null
          cheque_date?: string | null
          cheque_number?: string | null
          class_name?: string | null
          created_at?: string | null
          id?: string
          payment_date?: string | null
          payment_mode?: string | null
          quarter?: string | null
          receipt_number?: string | null
          section?: string | null
          session?: string | null
          student_id?: string | null
          student_name?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number | null
          cashier_name?: string | null
          cheque_bank?: string | null
          cheque_date?: string | null
          cheque_number?: string | null
          class_name?: string | null
          created_at?: string | null
          id?: string
          payment_date?: string | null
          payment_mode?: string | null
          quarter?: string | null
          receipt_number?: string | null
          section?: string | null
          session?: string | null
          student_id?: string | null
          student_name?: string | null
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
          assigned_by: string | null
          attachment_url: string | null
          class_name: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          section_name: string | null
          subject: string | null
          title: string
        }
        Insert: {
          assigned_by?: string | null
          attachment_url?: string | null
          class_name?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          section_name?: string | null
          subject?: string | null
          title: string
        }
        Update: {
          assigned_by?: string | null
          attachment_url?: string | null
          class_name?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          section_name?: string | null
          subject?: string | null
          title?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          target_type: string | null
          target_values: Json | null
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          target_type?: string | null
          target_values?: Json | null
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          target_type?: string | null
          target_values?: Json | null
          title?: string
        }
        Relationships: []
      }
      payment_intents: {
        Row: {
          cashier_id: string | null
          cashier_name: string | null
          class_name: string
          created_at: string
          expected_amount: number
          id: string
          quarters: Json
          receipt_number: string | null
          section: string | null
          session: string | null
          status: string
          student_id: string
          student_name: string
          tr: string
          transaction_id: string | null
          used_at: string | null
        }
        Insert: {
          cashier_id?: string | null
          cashier_name?: string | null
          class_name: string
          created_at?: string
          expected_amount: number
          id?: string
          quarters?: Json
          receipt_number?: string | null
          section?: string | null
          session?: string | null
          status?: string
          student_id: string
          student_name: string
          tr: string
          transaction_id?: string | null
          used_at?: string | null
        }
        Update: {
          cashier_id?: string | null
          cashier_name?: string | null
          class_name?: string
          created_at?: string
          expected_amount?: number
          id?: string
          quarters?: Json
          receipt_number?: string | null
          section?: string | null
          session?: string | null
          status?: string
          student_id?: string
          student_name?: string
          tr?: string
          transaction_id?: string | null
          used_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admission_number: string | null
          created_at: string
          full_name: string | null
          mobile: string | null
          staff_id: string | null
          student_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admission_number?: string | null
          created_at?: string
          full_name?: string | null
          mobile?: string | null
          staff_id?: string | null
          student_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admission_number?: string | null
          created_at?: string
          full_name?: string | null
          mobile?: string | null
          staff_id?: string | null
          student_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          student_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          student_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_payments: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string
          month: string
          paid: boolean | null
          paid_date: string | null
          staff_id: string
          year: number
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string
          month: string
          paid?: boolean | null
          paid_date?: string | null
          staff_id: string
          year: number
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string
          month?: string
          paid?: boolean | null
          paid_date?: string | null
          staff_id?: string
          year?: number
        }
        Relationships: []
      }
      sections: {
        Row: {
          class_name: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          class_name: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          class_name?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          created_at: string | null
          "Full Name": string
          id: string
          join_date: string | null
          "Mobile number": string | null
          "Monthly Salary": number | null
          Photo: string | null
          Resume: string | null
          Role: string
          salary_paid: boolean | null
          teaching_classes: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          "Full Name": string
          id?: string
          join_date?: string | null
          "Mobile number"?: string | null
          "Monthly Salary"?: number | null
          Photo?: string | null
          Resume?: string | null
          Role: string
          salary_paid?: boolean | null
          teaching_classes?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          "Full Name"?: string
          id?: string
          join_date?: string | null
          "Mobile number"?: string | null
          "Monthly Salary"?: number | null
          Photo?: string | null
          Resume?: string | null
          Role?: string
          salary_paid?: boolean | null
          teaching_classes?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      student_notices: {
        Row: {
          created_at: string | null
          id: string
          notice_id: string | null
          read: boolean | null
          student_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notice_id?: string | null
          read?: boolean | null
          student_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notice_id?: string | null
          read?: boolean | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_notices_notice_id_fkey"
            columns: ["notice_id"]
            isOneToOne: false
            referencedRelation: "notices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_notices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_subjects: {
        Row: {
          created_at: string | null
          id: string
          student_id: string
          subject_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          student_id: string
          subject_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          student_id?: string
          subject_name?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          address: string | null
          admission_number: string | null
          bus_number: string | null
          class_name: string
          created_at: string | null
          enroll_date: string | null
          father_email: string | null
          father_mobile: string | null
          father_name: string | null
          fee_amount: number | null
          fee_paid: boolean | null
          id: string
          installments: Json | null
          mother_email: string | null
          mother_mobile: string | null
          mother_name: string | null
          name: string
          parent_mobile: string | null
          parent_name: string | null
          parent_user_id: string | null
          payment_mode: string | null
          photo_file: string | null
          pickup_location: string | null
          roll_number: string | null
          section: string | null
          transport_facility: boolean | null
        }
        Insert: {
          address?: string | null
          admission_number?: string | null
          bus_number?: string | null
          class_name: string
          created_at?: string | null
          enroll_date?: string | null
          father_email?: string | null
          father_mobile?: string | null
          father_name?: string | null
          fee_amount?: number | null
          fee_paid?: boolean | null
          id?: string
          installments?: Json | null
          mother_email?: string | null
          mother_mobile?: string | null
          mother_name?: string | null
          name: string
          parent_mobile?: string | null
          parent_name?: string | null
          parent_user_id?: string | null
          payment_mode?: string | null
          photo_file?: string | null
          pickup_location?: string | null
          roll_number?: string | null
          section?: string | null
          transport_facility?: boolean | null
        }
        Update: {
          address?: string | null
          admission_number?: string | null
          bus_number?: string | null
          class_name?: string
          created_at?: string | null
          enroll_date?: string | null
          father_email?: string | null
          father_mobile?: string | null
          father_name?: string | null
          fee_amount?: number | null
          fee_paid?: boolean | null
          id?: string
          installments?: Json | null
          mother_email?: string | null
          mother_mobile?: string | null
          mother_name?: string | null
          name?: string
          parent_mobile?: string | null
          parent_name?: string | null
          parent_user_id?: string | null
          payment_mode?: string | null
          photo_file?: string | null
          pickup_location?: string | null
          roll_number?: string | null
          section?: string | null
          transport_facility?: boolean | null
        }
        Relationships: []
      }
      subject_assignments: {
        Row: {
          class_name: string
          created_at: string | null
          id: string
          section_name: string
          staff_id: string | null
          subject: string
        }
        Insert: {
          class_name: string
          created_at?: string | null
          id?: string
          section_name: string
          staff_id?: string | null
          subject: string
        }
        Update: {
          class_name?: string
          created_at?: string | null
          id?: string
          section_name?: string
          staff_id?: string | null
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_staff_id: { Args: never; Returns: string }
      current_student_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_assigned_class_teacher: {
        Args: { _class: string; _section: string; _user_id: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      parent_of_class_section: {
        Args: { _class: string; _section: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "manager"
        | "principal"
        | "teacher"
        | "cashier"
        | "exam_incharge"
        | "parent"
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
    Enums: {
      app_role: [
        "manager",
        "principal",
        "teacher",
        "cashier",
        "exam_incharge",
        "parent",
      ],
    },
  },
} as const
