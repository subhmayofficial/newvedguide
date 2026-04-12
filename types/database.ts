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
      legacy_leads: {
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
        Update: Partial<Database["public"]["Tables"]["legacy_leads"]["Insert"]>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          whatsapp_number: string | null;
          source_first: string | null;
          source_latest: string | null;
          utm_source_first: string | null;
          utm_medium_first: string | null;
          utm_campaign_first: string | null;
          utm_source_latest: string | null;
          utm_medium_latest: string | null;
          utm_campaign_latest: string | null;
          tags_json: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          whatsapp_number?: string | null;
          source_first?: string | null;
          source_latest?: string | null;
          utm_source_first?: string | null;
          utm_medium_first?: string | null;
          utm_campaign_first?: string | null;
          utm_source_latest?: string | null;
          utm_medium_latest?: string | null;
          utm_campaign_latest?: string | null;
          tags_json?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          type: string;
          price: string;
          currency: string;
          is_active: boolean;
          delivery_type: string | null;
          delivery_eta_hours: number | null;
          metadata_json: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          type: string;
          price: string | number;
          currency?: string;
          is_active?: boolean;
          delivery_type?: string | null;
          delivery_eta_hours?: number | null;
          metadata_json?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          customer_id: string | null;
          lead_type: string;
          status: string;
          journey_stage: string | null;
          source_page: string | null;
          entry_path: string | null;
          product_interest: string | null;
          form_name: string | null;
          has_order: boolean;
          linked_order_id: string | null;
          qualification_reason: string | null;
          conversion_reason: string | null;
          lost_reason: string | null;
          payload_json: Json | null;
          utm_json: Json | null;
          referrer: string | null;
          session_id: string | null;
          is_spam: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          lead_type: string;
          status: string;
          journey_stage?: string | null;
          source_page?: string | null;
          entry_path?: string | null;
          product_interest?: string | null;
          form_name?: string | null;
          has_order?: boolean;
          linked_order_id?: string | null;
          qualification_reason?: string | null;
          conversion_reason?: string | null;
          lost_reason?: string | null;
          payload_json?: Json | null;
          utm_json?: Json | null;
          referrer?: string | null;
          session_id?: string | null;
          is_spam?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [];
      };
      birth_details: {
        Row: {
          id: string;
          customer_id: string | null;
          lead_id: string | null;
          full_name: string | null;
          gender: string | null;
          report_language: string | null;
          date_of_birth: string | null;
          time_of_birth: string | null;
          birth_place: string | null;
          birth_city: string | null;
          birth_state: string | null;
          birth_country: string | null;
          latitude: string | null;
          longitude: string | null;
          timezone: string | null;
          birth_accuracy: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          lead_id?: string | null;
          full_name?: string | null;
          gender?: string | null;
          report_language?: string | null;
          date_of_birth?: string | null;
          time_of_birth?: string | null;
          birth_place?: string | null;
          birth_city?: string | null;
          birth_state?: string | null;
          birth_country?: string | null;
          latitude?: string | number | null;
          longitude?: string | number | null;
          timezone?: string | null;
          birth_accuracy?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["birth_details"]["Insert"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          lead_id: string | null;
          birth_details_id: string | null;
          source: string | null;
          entry_path: string | null;
          product_slug: string;
          status: string;
          payment_status: string;
          fulfillment_status: string;
          fulfillment_assignee: string | null;
          consultation_type: string | null;
          session_note: string | null;
          subtotal_amount: string;
          addon_amount: string;
          discount_amount: string;
          total_amount: string;
          currency: string;
          razorpay_order_id: string | null;
          payment_initiated_at: string | null;
          paid_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_id: string;
          lead_id?: string | null;
          birth_details_id?: string | null;
          source?: string | null;
          entry_path?: string | null;
          product_slug: string;
          status: string;
          payment_status: string;
          fulfillment_status: string;
          fulfillment_assignee?: string | null;
          consultation_type?: string | null;
          session_note?: string | null;
          subtotal_amount?: string | number;
          addon_amount?: string | number;
          discount_amount?: string | number;
          total_amount?: string | number;
          currency?: string;
          razorpay_order_id?: string | null;
          payment_initiated_at?: string | null;
          paid_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          item_type: string;
          product_slug: string;
          title: string;
          unit_price: string;
          quantity: number;
          total_price: string;
          metadata_json: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          item_type: string;
          product_slug: string;
          title: string;
          unit_price: string | number;
          quantity?: number;
          total_price: string | number;
          metadata_json?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          provider: string;
          provider_order_id: string | null;
          provider_payment_id: string | null;
          provider_signature: string | null;
          amount: string;
          currency: string;
          status: string;
          payment_method: string | null;
          raw_response_json: Json | null;
          failure_reason: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          provider?: string;
          provider_order_id?: string | null;
          provider_payment_id?: string | null;
          provider_signature?: string | null;
          amount: string | number;
          currency?: string;
          status: string;
          payment_method?: string | null;
          raw_response_json?: Json | null;
          failure_reason?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          event_name: string;
          event_group: string | null;
          customer_id: string | null;
          lead_id: string | null;
          order_id: string | null;
          session_id: string | null;
          source_page: string | null;
          page_path: string | null;
          entry_path: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          referrer: string | null;
          metadata_json: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_name: string;
          event_group?: string | null;
          customer_id?: string | null;
          lead_id?: string | null;
          order_id?: string | null;
          session_id?: string | null;
          source_page?: string | null;
          page_path?: string | null;
          entry_path?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          referrer?: string | null;
          metadata_json?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          note: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          note: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notes"]["Insert"]>;
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
        Relationships: [];
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
        Relationships: [];
      };
      legacy_orders: {
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
        Update: Partial<Database["public"]["Tables"]["legacy_orders"]["Insert"]>;
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
