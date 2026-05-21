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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_consent_declarations: {
        Row: {
          created_at: string
          face_likeness: boolean
          id: string
          name_use: boolean
          posthumous_use: boolean
          updated_at: string
          user_id: string
          voice_cloning: boolean
        }
        Insert: {
          created_at?: string
          face_likeness?: boolean
          id?: string
          name_use?: boolean
          posthumous_use?: boolean
          updated_at?: string
          user_id: string
          voice_cloning?: boolean
        }
        Update: {
          created_at?: string
          face_likeness?: boolean
          id?: string
          name_use?: boolean
          posthumous_use?: boolean
          updated_at?: string
          user_id?: string
          voice_cloning?: boolean
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_name: string
          category: string
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          asset_id: string
          certificate_hash: string
          certificate_url: string | null
          id: string
          issued_at: string
          metadata: Json | null
          registry_id: string
          user_id: string
        }
        Insert: {
          asset_id: string
          certificate_hash: string
          certificate_url?: string | null
          id?: string
          issued_at?: string
          metadata?: Json | null
          registry_id: string
          user_id: string
        }
        Update: {
          asset_id?: string
          certificate_hash?: string
          certificate_url?: string | null
          id?: string
          issued_at?: string
          metadata?: Json | null
          registry_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "registry_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_log: {
        Row: {
          consent_type: Database["public"]["Enums"]["consent_type"]
          created_at: string
          document_version: number | null
          granted: boolean
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_type: Database["public"]["Enums"]["consent_type"]
          created_at?: string
          document_version?: number | null
          granted: boolean
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_type?: Database["public"]["Enums"]["consent_type"]
          created_at?: string
          document_version?: number | null
          granted?: boolean
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      consent_signatures: {
        Row: {
          asset_id: string | null
          document_id: string
          document_version: number
          id: string
          ip_address: unknown
          signed_at: string
          user_id: string
        }
        Insert: {
          asset_id?: string | null
          document_id: string
          document_version: number
          id?: string
          ip_address?: unknown
          signed_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string | null
          document_id?: string
          document_version?: number
          id?: string
          ip_address?: unknown
          signed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_signatures_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "registry_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_signatures_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string
          extracted_text: string
          flagged_terms: Json
          id: string
          risk_level: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_text?: string
          flagged_terms?: Json
          id?: string
          risk_level?: string
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_text?: string
          flagged_terms?: Json
          id?: string
          risk_level?: string
          user_id?: string
        }
        Relationships: []
      }
      dmca_notices: {
        Row: {
          created_at: string
          id: string
          infringing_url: string
          notice_text: string
          platform: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          infringing_url: string
          notice_text: string
          platform: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          infringing_url?: string
          notice_text?: string
          platform?: string
          user_id?: string
        }
        Relationships: []
      }
      identity_statements: {
        Row: {
          created_at: string
          digital_signature: string
          id: string
          signed_at: string
          statement_text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          digital_signature: string
          id?: string
          signed_at?: string
          statement_text: string
          user_id: string
        }
        Update: {
          created_at?: string
          digital_signature?: string
          id?: string
          signed_at?: string
          statement_text?: string
          user_id?: string
        }
        Relationships: []
      }
      identity_verifications: {
        Row: {
          created_at: string
          government_id_url: string
          id: string
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          selfie_url: string
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          government_id_url: string
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          selfie_url: string
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          government_id_url?: string
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          selfie_url?: string
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      incident_reports: {
        Row: {
          created_at: string
          description: string
          evidence_url: string | null
          id: string
          infringing_url: string
          platform: string
          status: string
          updated_at: string
          user_id: string
          violation_type: string
        }
        Insert: {
          created_at?: string
          description?: string
          evidence_url?: string | null
          id?: string
          infringing_url: string
          platform: string
          status?: string
          updated_at?: string
          user_id: string
          violation_type: string
        }
        Update: {
          created_at?: string
          description?: string
          evidence_url?: string | null
          id?: string
          infringing_url?: string
          platform?: string
          status?: string
          updated_at?: string
          user_id?: string
          violation_type?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          content: string
          created_at: string
          document_type: string
          id: string
          is_active: boolean
          title: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          document_type: string
          id?: string
          is_active?: boolean
          title: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          document_type?: string
          id?: string
          is_active?: boolean
          title?: string
          version?: number
        }
        Relationships: []
      }
      likeness_scans: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          query: string
          result_count: number | null
          results: Json | null
          scan_type: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          query: string
          result_count?: number | null
          results?: Json | null
          scan_type?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          query?: string
          result_count?: number | null
          results?: Json | null
          scan_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      mention_folders: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mentions: {
        Row: {
          audio_url: string | null
          category: string | null
          confidence: number | null
          created_at: string
          excerpt: string | null
          folder_id: string | null
          found_at: string
          id: string
          match_label: string | null
          media_type: string | null
          mention_type: string
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          category?: string | null
          confidence?: number | null
          created_at?: string
          excerpt?: string | null
          folder_id?: string | null
          found_at?: string
          id?: string
          match_label?: string | null
          media_type?: string | null
          mention_type?: string
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string | null
          category?: string | null
          confidence?: number | null
          created_at?: string
          excerpt?: string | null
          folder_id?: string | null
          found_at?: string
          id?: string
          match_label?: string | null
          media_type?: string | null
          mention_type?: string
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentions_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "mention_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          dmca_updates: boolean
          id: string
          policy_changes: boolean
          scan_match: boolean
          updated_at: string
          user_id: string
          weekly_summary: boolean
        }
        Insert: {
          created_at?: string
          dmca_updates?: boolean
          id?: string
          policy_changes?: boolean
          scan_match?: boolean
          updated_at?: string
          user_id: string
          weekly_summary?: boolean
        }
        Update: {
          created_at?: string
          dmca_updates?: boolean
          id?: string
          policy_changes?: boolean
          scan_match?: boolean
          updated_at?: string
          user_id?: string
          weekly_summary?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      possible_fake_profiles: {
        Row: {
          bio_snippet: string | null
          confidence_score: number
          created_at: string
          display_name: string | null
          follower_count: number | null
          found_at: string
          id: string
          match_reason: string | null
          platform: string
          profile_pic_url: string | null
          risk_level: string
          search_query: string | null
          status: string
          updated_at: string
          url: string
          url_hash: string
          user_id: string
          username: string | null
        }
        Insert: {
          bio_snippet?: string | null
          confidence_score?: number
          created_at?: string
          display_name?: string | null
          follower_count?: number | null
          found_at?: string
          id?: string
          match_reason?: string | null
          platform: string
          profile_pic_url?: string | null
          risk_level?: string
          search_query?: string | null
          status?: string
          updated_at?: string
          url: string
          url_hash: string
          user_id: string
          username?: string | null
        }
        Update: {
          bio_snippet?: string | null
          confidence_score?: number
          created_at?: string
          display_name?: string | null
          follower_count?: number | null
          found_at?: string
          id?: string
          match_reason?: string | null
          platform?: string
          profile_pic_url?: string | null
          risk_level?: string
          search_query?: string | null
          status?: string
          updated_at?: string
          url?: string
          url_hash?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          admin_notes: string | null
          agency_name: string | null
          aka_names: string[] | null
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          created_at: string
          display_name: string | null
          external_actor_id: string | null
          external_risk_score: number | null
          face_capture_front_url: string | null
          face_capture_left_url: string | null
          face_capture_right_url: string | null
          face_descriptor: Json | null
          face_registered_at: string | null
          full_name: string
          headshot_url: string | null
          id: string
          imdb_url: string | null
          instagram_handle: string | null
          is_discoverable: boolean
          legal_accepted_at: string | null
          legal_name: string | null
          onboarding_why_seen: boolean
          performance_type: string | null
          phone: string | null
          preferred_language: string
          primary_market: string | null
          production_type: string | null
          signature_phrase: string | null
          slug: string | null
          stage_name: string | null
          tiktok_handle: string | null
          trademark_entity: string | null
          trademark_status: string | null
          union_affiliation: string | null
          union_id: string | null
          union_verified: boolean | null
          updated_at: string
          user_id: string
          verified_seal_seen_at: string | null
          voice_print_demo_url: string | null
          voice_print_duration_seconds: number | null
          voice_print_hash: string | null
          voice_print_url: string | null
          voice_registered_at: string | null
          writing_sample: string | null
          years_performing: string | null
          youtube_handle: string | null
        }
        Insert: {
          account_type?: string | null
          admin_notes?: string | null
          agency_name?: string | null
          aka_names?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          external_actor_id?: string | null
          external_risk_score?: number | null
          face_capture_front_url?: string | null
          face_capture_left_url?: string | null
          face_capture_right_url?: string | null
          face_descriptor?: Json | null
          face_registered_at?: string | null
          full_name?: string
          headshot_url?: string | null
          id?: string
          imdb_url?: string | null
          instagram_handle?: string | null
          is_discoverable?: boolean
          legal_accepted_at?: string | null
          legal_name?: string | null
          onboarding_why_seen?: boolean
          performance_type?: string | null
          phone?: string | null
          preferred_language?: string
          primary_market?: string | null
          production_type?: string | null
          signature_phrase?: string | null
          slug?: string | null
          stage_name?: string | null
          tiktok_handle?: string | null
          trademark_entity?: string | null
          trademark_status?: string | null
          union_affiliation?: string | null
          union_id?: string | null
          union_verified?: boolean | null
          updated_at?: string
          user_id: string
          verified_seal_seen_at?: string | null
          voice_print_demo_url?: string | null
          voice_print_duration_seconds?: number | null
          voice_print_hash?: string | null
          voice_print_url?: string | null
          voice_registered_at?: string | null
          writing_sample?: string | null
          years_performing?: string | null
          youtube_handle?: string | null
        }
        Update: {
          account_type?: string | null
          admin_notes?: string | null
          agency_name?: string | null
          aka_names?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          external_actor_id?: string | null
          external_risk_score?: number | null
          face_capture_front_url?: string | null
          face_capture_left_url?: string | null
          face_capture_right_url?: string | null
          face_descriptor?: Json | null
          face_registered_at?: string | null
          full_name?: string
          headshot_url?: string | null
          id?: string
          imdb_url?: string | null
          instagram_handle?: string | null
          is_discoverable?: boolean
          legal_accepted_at?: string | null
          legal_name?: string | null
          onboarding_why_seen?: boolean
          performance_type?: string | null
          phone?: string | null
          preferred_language?: string
          primary_market?: string | null
          production_type?: string | null
          signature_phrase?: string | null
          slug?: string | null
          stage_name?: string | null
          tiktok_handle?: string | null
          trademark_entity?: string | null
          trademark_status?: string | null
          union_affiliation?: string | null
          union_id?: string | null
          union_verified?: boolean | null
          updated_at?: string
          user_id?: string
          verified_seal_seen_at?: string | null
          voice_print_demo_url?: string | null
          voice_print_duration_seconds?: number | null
          voice_print_hash?: string | null
          voice_print_url?: string | null
          voice_registered_at?: string | null
          writing_sample?: string | null
          years_performing?: string | null
          youtube_handle?: string | null
        }
        Relationships: []
      }
      registry_assets: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          created_at: string
          description: string | null
          file_hash: string
          file_size_bytes: number | null
          file_url: string
          id: string
          mime_type: string | null
          registry_id: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["asset_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          created_at?: string
          description?: string | null
          file_hash: string
          file_size_bytes?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          registry_id?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type"]
          created_at?: string
          description?: string | null
          file_hash?: string
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          registry_id?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reported_violations: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          id: string
          screenshot_url: string | null
          status: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          id?: string
          screenshot_url?: string | null
          status?: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          id?: string
          screenshot_url?: string | null
          status?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      scan_runs: {
        Row: {
          actor_id: string | null
          created_at: string
          finished_at: string | null
          id: string
          items_scanned: number
          legitimate_found: number
          notes: string | null
          review_found: number
          scanner_name: string
          started_at: string
          status: string
          threats_found: number
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          finished_at?: string | null
          id?: string
          items_scanned?: number
          legitimate_found?: number
          notes?: string | null
          review_found?: number
          scanner_name: string
          started_at?: string
          status?: string
          threats_found?: number
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          finished_at?: string | null
          id?: string
          items_scanned?: number
          legitimate_found?: number
          notes?: string | null
          review_found?: number
          scanner_name?: string
          started_at?: string
          status?: string
          threats_found?: number
        }
        Relationships: []
      }
      social_scans: {
        Row: {
          actor_id: string
          bio_snippet: string | null
          confidence_score: number
          created_at: string
          display_name: string | null
          follower_count: number | null
          found_at: string
          id: string
          match_reason: string | null
          platform: string
          profile_pic_url: string | null
          raw_result: Json
          risk_level: string
          search_query: string
          status: string
          updated_at: string
          url: string
          url_hash: string
          user_id: string
          username: string | null
        }
        Insert: {
          actor_id: string
          bio_snippet?: string | null
          confidence_score?: number
          created_at?: string
          display_name?: string | null
          follower_count?: number | null
          found_at?: string
          id?: string
          match_reason?: string | null
          platform: string
          profile_pic_url?: string | null
          raw_result?: Json
          risk_level?: string
          search_query: string
          status?: string
          updated_at?: string
          url: string
          url_hash: string
          user_id: string
          username?: string | null
        }
        Update: {
          actor_id?: string
          bio_snippet?: string | null
          confidence_score?: number
          created_at?: string
          display_name?: string | null
          follower_count?: number | null
          found_at?: string
          id?: string
          match_reason?: string | null
          platform?: string
          profile_pic_url?: string | null
          raw_result?: Json
          risk_level?: string
          search_query?: string
          status?: string
          updated_at?: string
          url?: string
          url_hash?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          interval: Database["public"]["Enums"]["plan_interval"]
          is_active: boolean
          name: string
          price_cents: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          interval: Database["public"]["Enums"]["plan_interval"]
          is_active?: boolean
          name: string
          price_cents: number
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          interval?: Database["public"]["Enums"]["plan_interval"]
          is_active?: boolean
          name?: string
          price_cents?: number
        }
        Relationships: []
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
      user_subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start?: string
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          bio: string | null
          display_name: string | null
          headshot_url: string | null
          is_discoverable: boolean | null
          slug: string | null
          stage_name: string | null
          union_affiliation: string | null
          user_id: string | null
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          display_name?: string | null
          headshot_url?: string | null
          is_discoverable?: boolean | null
          slug?: string | null
          stage_name?: string | null
          union_affiliation?: string | null
          user_id?: string | null
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          display_name?: string | null
          headshot_url?: string | null
          is_discoverable?: boolean | null
          slug?: string | null
          stage_name?: string | null
          union_affiliation?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_registry_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "performer" | "admin" | "producer"
      asset_status: "pending" | "approved" | "rejected" | "revision_requested"
      asset_type: "image" | "video" | "audio" | "text" | "ai_model"
      consent_type:
        | "terms_of_service"
        | "likeness_rights"
        | "gdpr"
        | "ccpa"
        | "biometric"
        | "face_scan"
        | "voice_print"
      notification_type:
        | "verification_update"
        | "subscription_event"
        | "asset_update"
        | "admin_action"
        | "system"
      plan_interval: "monthly" | "annual"
      subscription_status: "active" | "canceled" | "past_due" | "trialing"
      verification_status: "pending" | "approved" | "rejected"
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
    Enums: {
      app_role: ["performer", "admin", "producer"],
      asset_status: ["pending", "approved", "rejected", "revision_requested"],
      asset_type: ["image", "video", "audio", "text", "ai_model"],
      consent_type: [
        "terms_of_service",
        "likeness_rights",
        "gdpr",
        "ccpa",
        "biometric",
        "face_scan",
        "voice_print",
      ],
      notification_type: [
        "verification_update",
        "subscription_event",
        "asset_update",
        "admin_action",
        "system",
      ],
      plan_interval: ["monthly", "annual"],
      subscription_status: ["active", "canceled", "past_due", "trialing"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
