export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string;
          email: string | null;
          source: string | null;
          tool_slug: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          referrer: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name?: string | null;
          phone: string;
          email?: string | null;
          source?: string | null;
          tool_slug?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          referrer?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [];
      };
      kundli_submissions: {
        Row: {
          id: string;
          lead_id: string | null;
          full_name: string;
          phone: string;
          email: string | null;
          dob: string;
          tob: string;
          pob: string;
          lat: number | null;
          lon: number | null;
          timezone: string | null;
          result_data: Json | null;
          source: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          full_name: string;
          phone: string;
          email?: string | null;
          dob: string;
          tob: string;
          pob: string;
          lat?: number | null;
          lon?: number | null;
          timezone?: string | null;
          result_data?: Json | null;
          source?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["kundli_submissions"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "kundli_submissions_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          }
        ];
      };
      tool_submissions: {
        Row: {
          id: string;
          lead_id: string | null;
          tool_slug: string;
          input_payload: Json;
          result_payload: Json | null;
          source: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          tool_slug: string;
          input_payload: Json;
          result_payload?: Json | null;
          source?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["tool_submissions"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "tool_submissions_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          lead_id: string | null;
          kundli_submission_id: string | null;
          product_type: "kundli_report" | "consultation_15" | "consultation_full";
          product_name: string;
          amount_paise: number;
          full_name: string;
          phone: string;
          email: string | null;
          dob: string | null;
          tob: string | null;
          pob: string | null;
          problem_summary: string | null;
          preferred_slot_note: string | null;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          payment_verified: boolean;
          payment_status: "initiated" | "paid" | "failed" | "abandoned";
          order_status:
            | "pending"
            | "processing"
            | "completed"
            | "refunded"
            | "cancelled";
          source_funnel: string | null;
          source_page: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          referrer: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          kundli_submission_id?: string | null;
          product_type: "kundli_report" | "consultation_15" | "consultation_full";
          product_name: string;
          amount_paise: number;
          full_name: string;
          phone: string;
          email?: string | null;
          dob?: string | null;
          tob?: string | null;
          pob?: string | null;
          problem_summary?: string | null;
          preferred_slot_note?: string | null;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          payment_verified?: boolean;
          payment_status?: "initiated" | "paid" | "failed" | "abandoned";
          order_status?:
            | "pending"
            | "processing"
            | "completed"
            | "refunded"
            | "cancelled";
          source_funnel?: string | null;
          source_page?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          referrer?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "orders_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_kundli_submission_id_fkey";
            columns: ["kundli_submission_id"];
            isOneToOne: false;
            referencedRelation: "kundli_submissions";
            referencedColumns: ["id"];
          }
        ];
      };
      abandoned_checkouts: {
        Row: {
          id: string;
          order_id: string | null;
          product_type: string;
          full_name: string | null;
          phone: string | null;
          email: string | null;
          source_funnel: string | null;
          source_page: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          captured_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          product_type: string;
          full_name?: string | null;
          phone?: string | null;
          email?: string | null;
          source_funnel?: string | null;
          source_page?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          captured_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["abandoned_checkouts"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "abandoned_checkouts_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      consultations: {
        Row: {
          id: string;
          order_id: string;
          consultation_type: "15min" | "full";
          problem_summary: string | null;
          preferred_slot_raw: string | null;
          assigned_slot: string | null;
          status:
            | "pending_contact"
            | "scheduled"
            | "completed"
            | "cancelled";
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          consultation_type: "15min" | "full";
          problem_summary?: string | null;
          preferred_slot_raw?: string | null;
          assigned_slot?: string | null;
          status?:
            | "pending_contact"
            | "scheduled"
            | "completed"
            | "cancelled";
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["consultations"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "consultations_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      support_requests: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          email: string | null;
          order_reference: string | null;
          subject: string;
          message: string;
          status: "open" | "in_progress" | "resolved";
          resolution_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone?: string | null;
          email?: string | null;
          order_reference?: string | null;
          subject: string;
          message: string;
          status?: "open" | "in_progress" | "resolved";
          resolution_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["support_requests"]["Insert"]
        >;
        Relationships: [];
      };
      testimonials: {
        Row: {
          id: string;
          customer_name: string;
          location: string | null;
          rating: number;
          content: string;
          product_type: string | null;
          is_approved: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          location?: string | null;
          rating?: number;
          content: string;
          product_type?: string | null;
          is_approved?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["testimonials"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
