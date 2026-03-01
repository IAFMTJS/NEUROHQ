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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accountability_settings: {
        Row: {
          enabled: boolean
          penalty_xp_amount: number
          penalty_xp_enabled: boolean
          streak_freeze_tokens: number
          updated_at: string
          user_id: string
        }
        Insert: {
          enabled?: boolean
          penalty_xp_amount?: number
          penalty_xp_enabled?: boolean
          streak_freeze_tokens?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          enabled?: boolean
          penalty_xp_amount?: number
          penalty_xp_enabled?: boolean
          streak_freeze_tokens?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accountability_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          achievement_key: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_key: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_key?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      alignment_log: {
        Row: {
          actual_distribution: Json
          alignment_score: number
          created_at: string
          date: string
          id: string
          planned_distribution: Json
          strategy_id: string
        }
        Insert: {
          actual_distribution: Json
          alignment_score: number
          created_at?: string
          date: string
          id?: string
          planned_distribution: Json
          strategy_id: string
        }
        Update: {
          actual_distribution?: Json
          alignment_score?: number
          created_at?: string
          date?: string
          id?: string
          planned_distribution?: Json
          strategy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alignment_log_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategy_focus"
            referencedColumns: ["id"]
          },
        ]
      }
      alternatives: {
        Row: {
          created_at: string
          id: string
          reference_id: string | null
          suggestion_text: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reference_id?: string | null
          suggestion_text: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reference_id?: string | null
          suggestion_text?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alternatives_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          payload: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          payload?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          payload?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_conversation_turn: {
        Row: {
          last_extracted_content: string | null
          last_extracted_type: string | null
          last_response_type: string | null
          last_user_message: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          last_extracted_content?: string | null
          last_extracted_type?: string | null
          last_response_type?: string | null
          last_user_message?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          last_extracted_content?: string | null
          last_extracted_type?: string | null
          last_response_type?: string | null
          last_user_message?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_conversation_turn_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_feature_flags: {
        Row: {
          confrontation_level: string
          courage_attribution: boolean
          defensive_identity_detection: boolean
          energy_fact_check: boolean
          identity_intervention: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          confrontation_level?: string
          courage_attribution?: boolean
          defensive_identity_detection?: boolean
          energy_fact_check?: boolean
          identity_intervention?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          confrontation_level?: string
          courage_attribution?: boolean
          defensive_identity_detection?: boolean
          energy_fact_check?: boolean
          identity_intervention?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_feature_flags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_user_context: {
        Row: {
          content: string
          created_at: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_user_context_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      avoidance_tracker: {
        Row: {
          completed: number
          last_forced_at: string | null
          last_forced_level: number | null
          skipped: number
          tag: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: number
          last_forced_at?: string | null
          last_forced_level?: number | null
          skipped?: number
          tag: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: number
          last_forced_at?: string | null
          last_forced_level?: number | null
          skipped?: number
          tag?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avoidance_tracker_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      behavior_patterns: {
        Row: {
          acknowledged: boolean
          created_at: string
          detected_at: string
          id: string
          pattern_type: string
          suggestion: string | null
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          created_at?: string
          detected_at?: string
          id?: string
          pattern_type: string
          suggestion?: string | null
          user_id: string
        }
        Update: {
          acknowledged?: boolean
          created_at?: string
          detected_at?: string
          id?: string
          pattern_type?: string
          suggestion?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavior_patterns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      behavior_profile: {
        Row: {
          avoidance_patterns: Json | null
          confrontation_mode: string
          discipline_level: string
          energy_pattern: string
          hobby_commitment: Json | null
          identity_targets: string[]
          minimal_integrity_threshold_days: number
          pet_attachment_level: number
          pet_type: string
          updated_at: string
          user_id: string
          week_theme: string | null
        }
        Insert: {
          avoidance_patterns?: Json | null
          confrontation_mode?: string
          discipline_level?: string
          energy_pattern?: string
          hobby_commitment?: Json | null
          identity_targets?: string[]
          minimal_integrity_threshold_days?: number
          pet_attachment_level?: number
          pet_type?: string
          updated_at?: string
          user_id: string
          week_theme?: string | null
        }
        Update: {
          avoidance_patterns?: Json | null
          confrontation_mode?: string
          discipline_level?: string
          energy_pattern?: string
          hobby_commitment?: Json | null
          identity_targets?: string[]
          minimal_integrity_threshold_days?: number
          pet_attachment_level?: number
          pet_type?: string
          updated_at?: string
          user_id?: string
          week_theme?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "behavior_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      behaviour_log: {
        Row: {
          created_at: string
          date: string
          difficulty_level: number | null
          energy_after: number | null
          energy_before: number | null
          id: string
          mission_completed_at: string | null
          mission_id: string | null
          mission_started_at: string | null
          performance_rank: string | null
          performance_score: number | null
          resisted_before_start: boolean
          user_id: string
          xp_gained: number | null
        }
        Insert: {
          created_at?: string
          date: string
          difficulty_level?: number | null
          energy_after?: number | null
          energy_before?: number | null
          id?: string
          mission_completed_at?: string | null
          mission_id?: string | null
          mission_started_at?: string | null
          performance_rank?: string | null
          performance_score?: number | null
          resisted_before_start?: boolean
          user_id: string
          xp_gained?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          difficulty_level?: number | null
          energy_after?: number | null
          energy_before?: number | null
          id?: string
          mission_completed_at?: string | null
          mission_id?: string | null
          mission_started_at?: string | null
          performance_rank?: string | null
          performance_score?: number | null
          resisted_before_start?: boolean
          user_id?: string
          xp_gained?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "behaviour_log_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behaviour_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_entries: {
        Row: {
          amount_cents: number
          category: string | null
          created_at: string
          date: string
          freeze_reminder_sent: boolean
          freeze_until: string | null
          id: string
          is_planned: boolean
          note: string | null
          recurring: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          category?: string | null
          created_at?: string
          date: string
          freeze_reminder_sent?: boolean
          freeze_until?: string | null
          id?: string
          is_planned?: boolean
          note?: string | null
          recurring?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          category?: string | null
          created_at?: string
          date?: string
          freeze_reminder_sent?: boolean
          freeze_until?: string | null
          id?: string
          is_planned?: boolean
          note?: string | null
          recurring?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_entries_archive: {
        Row: {
          amount_cents: number
          archived_at: string
          category: string | null
          created_at: string
          date: string
          freeze_reminder_sent: boolean
          freeze_until: string | null
          id: string
          is_planned: boolean
          note: string | null
          recurring: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          archived_at?: string
          category?: string | null
          created_at?: string
          date: string
          freeze_reminder_sent?: boolean
          freeze_until?: string | null
          id: string
          is_planned?: boolean
          note?: string | null
          recurring?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          archived_at?: string
          category?: string | null
          created_at?: string
          date?: string
          freeze_reminder_sent?: boolean
          freeze_until?: string | null
          id?: string
          is_planned?: boolean
          note?: string | null
          recurring?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_entries_archive_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_targets: {
        Row: {
          category: string
          created_at: string
          flexible: boolean
          id: string
          priority: number
          target_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          flexible?: boolean
          id?: string
          priority: number
          target_cents: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          flexible?: boolean
          id?: string
          priority?: number
          target_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_targets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          created_at: string
          duration_hours: number | null
          end_at: string
          external_id: string | null
          id: string
          is_social: boolean
          source: string | null
          start_at: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_hours?: number | null
          end_at: string
          external_id?: string | null
          id?: string
          is_social?: boolean
          source?: string | null
          start_at: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_hours?: number | null
          end_at?: string
          external_id?: string | null
          id?: string
          is_social?: boolean
          source?: string | null
          start_at?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          id: string
          name: string
          progress_pct: number
          started_at: string
          target_end_at: string
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          progress_pct?: number
          started_at?: string
          target_end_at: string
          theme: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          progress_pct?: number
          started_at?: string
          target_end_at?: string
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_state: {
        Row: {
          created_at: string
          date: string
          emotional_state: string | null
          energy: number | null
          focus: number | null
          focus_consumed: number | null
          id: string
          is_rest_day: boolean | null
          load: number | null
          mental_battery: number | null
          mood_note: string | null
          sensory_load: number | null
          sleep_hours: number | null
          social_load: number | null
          updated_at: string
          user_id: string
          zero_completion_penalty_applied: boolean | null
        }
        Insert: {
          created_at?: string
          date: string
          emotional_state?: string | null
          energy?: number | null
          focus?: number | null
          focus_consumed?: number | null
          id?: string
          is_rest_day?: boolean | null
          load?: number | null
          mental_battery?: number | null
          mood_note?: string | null
          sensory_load?: number | null
          sleep_hours?: number | null
          social_load?: number | null
          updated_at?: string
          user_id: string
          zero_completion_penalty_applied?: boolean | null
        }
        Update: {
          created_at?: string
          date?: string
          emotional_state?: string | null
          energy?: number | null
          focus?: number | null
          focus_consumed?: number | null
          id?: string
          is_rest_day?: boolean | null
          load?: number | null
          mental_battery?: number | null
          mood_note?: string | null
          sensory_load?: number | null
          sleep_hours?: number | null
          social_load?: number | null
          updated_at?: string
          user_id?: string
          zero_completion_penalty_applied?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      education_options: {
        Row: {
          archived_at: string | null
          category: string | null
          created_at: string
          effort_score: number | null
          future_value_score: number | null
          id: string
          interest_score: number | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          category?: string | null
          created_at?: string
          effort_score?: number | null
          future_value_score?: number | null
          id?: string
          interest_score?: number | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          category?: string | null
          created_at?: string
          effort_score?: number | null
          future_value_score?: number | null
          id?: string
          interest_score?: number | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_options_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      escalation_logs: {
        Row: {
          created_at: string
          evidence_snapshot: Json | null
          id: string
          tier: number
          trigger_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          evidence_snapshot?: Json | null
          id?: string
          tier: number
          trigger_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          evidence_snapshot?: Json | null
          id?: string
          tier?: number
          trigger_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_discipline_score: {
        Row: {
          created_at: string
          date: string
          id: string
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          score: number
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_discipline_score_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      friction_events: {
        Row: {
          completed_at: string | null
          created_at: string
          delay_minutes: number | null
          event_type: string
          id: string
          mission_id: string | null
          opened_at: string | null
          started_at: string | null
          task_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          delay_minutes?: number | null
          event_type: string
          id?: string
          mission_id?: string | null
          opened_at?: string | null
          started_at?: string | null
          task_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          delay_minutes?: number | null
          event_type?: string
          id?: string
          mission_id?: string | null
          opened_at?: string | null
          started_at?: string | null
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friction_events_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friction_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friction_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_events: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      income_sources: {
        Row: {
          amount_cents: number
          created_at: string
          day_of_month: number
          id: string
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          day_of_month: number
          id?: string
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          day_of_month?: number
          id?: string
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_sources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_sessions: {
        Row: {
          created_at: string
          date: string
          education_option_id: string | null
          id: string
          learning_type: string | null
          minutes: number
          monthly_book_id: string | null
          strategy_quarter: number | null
          strategy_year: number | null
          topic: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          education_option_id?: string | null
          id?: string
          learning_type?: string | null
          minutes: number
          monthly_book_id?: string | null
          strategy_quarter?: number | null
          strategy_year?: number | null
          topic?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          education_option_id?: string | null
          id?: string
          learning_type?: string | null
          minutes?: number
          monthly_book_id?: string | null
          strategy_quarter?: number | null
          strategy_year?: number | null
          topic?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_sessions_education_option_id_fkey"
            columns: ["education_option_id"]
            isOneToOne: false
            referencedRelation: "education_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_sessions_monthly_book_id_fkey"
            columns: ["monthly_book_id"]
            isOneToOne: false
            referencedRelation: "monthly_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_chain_steps: {
        Row: {
          chain_id: string
          created_at: string
          id: string
          step_order: number
          task_id: string | null
        }
        Insert: {
          chain_id: string
          created_at?: string
          id?: string
          step_order: number
          task_id?: string | null
        }
        Update: {
          chain_id?: string
          created_at?: string
          id?: string
          step_order?: number
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_chain_steps_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "mission_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_chain_steps_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_chains: {
        Row: {
          alignment_bonus_pct: number
          completed_at: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alignment_bonus_pct?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alignment_bonus_pct?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_chains_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_events: {
        Row: {
          created_at: string
          duration_before_start_seconds: number | null
          duration_to_complete_seconds: number | null
          event_type: string
          id: string
          mission_id: string
          occurred_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_before_start_seconds?: number | null
          duration_to_complete_seconds?: number | null
          event_type: string
          id?: string
          mission_id: string
          occurred_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_before_start_seconds?: number | null
          duration_to_complete_seconds?: number | null
          event_type?: string
          id?: string
          mission_id?: string
          occurred_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_events_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_state: {
        Row: {
          active_mission_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_mission_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_mission_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_state_active_mission_id_fkey"
            columns: ["active_mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          active: boolean
          category: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          difficulty_level: number
          domain: string | null
          energy_cost: number
          focus_requirement: number | null
          id: string
          mission_type: string
          name: string
          recurrence_type: string | null
          skill_link: string | null
          social_intensity: number | null
          started_at: string | null
          streak_eligible: boolean
          updated_at: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          active?: boolean
          category?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          difficulty_level?: number
          domain?: string | null
          energy_cost?: number
          focus_requirement?: number | null
          id?: string
          mission_type?: string
          name: string
          recurrence_type?: string | null
          skill_link?: string | null
          social_intensity?: number | null
          started_at?: string | null
          streak_eligible?: boolean
          updated_at?: string
          user_id: string
          xp_reward?: number
        }
        Update: {
          active?: boolean
          category?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          difficulty_level?: number
          domain?: string | null
          energy_cost?: number
          focus_requirement?: number | null
          id?: string
          mission_type?: string
          name?: string
          recurrence_type?: string | null
          skill_link?: string | null
          social_intensity?: number | null
          started_at?: string | null
          streak_eligible?: boolean
          updated_at?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "missions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_books: {
        Row: {
          chapters_per_week: number | null
          completed_at: string | null
          created_at: string
          id: string
          month: number
          pages_per_day: number | null
          pages_read: number | null
          pages_updated_at: string | null
          slot: number
          title: string
          total_pages: number | null
          user_id: string
          year: number
        }
        Insert: {
          chapters_per_week?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          month: number
          pages_per_day?: number | null
          pages_read?: number | null
          pages_updated_at?: string | null
          slot?: number
          title: string
          total_pages?: number | null
          user_id: string
          year: number
        }
        Update: {
          chapters_per_week?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          month?: number
          pages_per_day?: number | null
          pages_read?: number | null
          pages_updated_at?: string | null
          slot?: number
          title?: string
          total_pages?: number | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_books_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_xp_notifications: {
        Row: {
          id: string
          user_id: string
          total_xp: number
          sources: Json
          for_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_xp?: number
          sources?: Json
          for_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_xp?: number
          sources?: Json
          for_date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_xp_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quarterly_strategy: {
        Row: {
          anti_goals: string | null
          created_at: string
          id: string
          identity_statement: string | null
          key_results: string | null
          kr_checked: Json
          north_star: string | null
          one_word: string | null
          primary_theme: string | null
          quarter: number
          savings_goal_id: string | null
          secondary_theme: string | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          anti_goals?: string | null
          created_at?: string
          id?: string
          identity_statement?: string | null
          key_results?: string | null
          kr_checked?: Json
          north_star?: string | null
          one_word?: string | null
          primary_theme?: string | null
          quarter: number
          savings_goal_id?: string | null
          secondary_theme?: string | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          anti_goals?: string | null
          created_at?: string
          id?: string
          identity_statement?: string | null
          key_results?: string | null
          kr_checked?: Json
          north_star?: string | null
          one_word?: string | null
          primary_theme?: string | null
          quarter?: number
          savings_goal_id?: string | null
          secondary_theme?: string | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "quarterly_strategy_savings_goal_id_fkey"
            columns: ["savings_goal_id"]
            isOneToOne: false
            referencedRelation: "savings_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quarterly_strategy_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reality_reports: {
        Row: {
          created_at: string
          id: string
          payload: Json
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload: Json
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "reality_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_budget_templates: {
        Row: {
          amount_cents: number
          category: string | null
          created_at: string
          day_of_month: number | null
          day_of_week: number | null
          id: string
          next_generate_date: string
          note: string | null
          recurrence_rule: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          category?: string | null
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          id?: string
          next_generate_date: string
          note?: string | null
          recurrence_rule: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          category?: string | null
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          id?: string
          next_generate_date?: string
          note?: string | null
          recurrence_rule?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_budget_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_contributions: {
        Row: {
          amount_cents: number
          contributed_at: string
          created_at: string
          goal_id: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          contributed_at?: string
          created_at?: string
          goal_id: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          contributed_at?: string
          created_at?: string
          goal_id?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "savings_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_contributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          created_at: string
          current_cents: number
          deadline: string | null
          id: string
          name: string
          status: string
          target_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_cents?: number
          deadline?: string | null
          id?: string
          name: string
          status?: string
          target_cents: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_cents?: number
          deadline?: string | null
          id?: string
          name?: string
          status?: string
          target_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_check_in: {
        Row: {
          checked_at: string
          user_id: string
        }
        Insert: {
          checked_at?: string
          user_id: string
        }
        Update: {
          checked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_check_in_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_focus: {
        Row: {
          archive_reason: string | null
          archive_reason_note: string | null
          created_at: string
          deadline: string
          end_date: string | null
          id: string
          identity_profile: string
          is_active: boolean
          phase: string
          pressure_boost_after_deadline: boolean
          primary_domain: string
          secondary_domains: Json
          start_date: string
          target_metric: string | null
          thesis: string
          thesis_why: string | null
          updated_at: string
          user_id: string
          weekly_allocation: Json
        }
        Insert: {
          archive_reason?: string | null
          archive_reason_note?: string | null
          created_at?: string
          deadline: string
          end_date?: string | null
          id?: string
          identity_profile?: string
          is_active?: boolean
          phase?: string
          pressure_boost_after_deadline?: boolean
          primary_domain: string
          secondary_domains?: Json
          start_date?: string
          target_metric?: string | null
          thesis: string
          thesis_why?: string | null
          updated_at?: string
          user_id: string
          weekly_allocation?: Json
        }
        Update: {
          archive_reason?: string | null
          archive_reason_note?: string | null
          created_at?: string
          deadline?: string
          end_date?: string | null
          id?: string
          identity_profile?: string
          is_active?: boolean
          phase?: string
          pressure_boost_after_deadline?: boolean
          primary_domain?: string
          secondary_domains?: Json
          start_date?: string
          target_metric?: string | null
          thesis?: string
          thesis_why?: string | null
          updated_at?: string
          user_id?: string
          weekly_allocation?: Json
        }
        Relationships: [
          {
            foreignKeyName: "strategy_focus_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_key_results: {
        Row: {
          created_at: string
          id: string
          progress_pct: number | null
          sort_order: number
          status: string
          strategy_id: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          progress_pct?: number | null
          sort_order?: number
          status?: string
          strategy_id: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          progress_pct?: number | null
          sort_order?: number
          status?: string
          strategy_id?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_key_results_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "quarterly_strategy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_key_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_review: {
        Row: {
          alignment_score: number | null
          biggest_drift_domain: string | null
          created_at: string
          id: string
          notes: string | null
          strategy_id: string
          strongest_domain: string | null
          week_number: number
          week_start: string
        }
        Insert: {
          alignment_score?: number | null
          biggest_drift_domain?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          strategy_id: string
          strongest_domain?: string | null
          week_number: number
          week_start: string
        }
        Update: {
          alignment_score?: number | null
          biggest_drift_domain?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          strategy_id?: string
          strongest_domain?: string | null
          week_number?: number
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_review_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategy_focus"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plan: {
        Row: {
          daily_goal_minutes: number
          preferred_time: string | null
          reminder_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          daily_goal_minutes?: number
          preferred_time?: string | null
          reminder_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          daily_goal_minutes?: number
          preferred_time?: string | null
          reminder_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_plan_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_events: {
        Row: {
          created_at: string
          duration_before_start_seconds: number | null
          duration_to_complete_seconds: number | null
          event_type: string
          id: string
          occurred_at: string
          performance_rank: string | null
          performance_score: number | null
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_before_start_seconds?: number | null
          duration_to_complete_seconds?: number | null
          event_type: string
          id?: string
          occurred_at?: string
          performance_rank?: string | null
          performance_score?: number | null
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_before_start_seconds?: number | null
          duration_to_complete_seconds?: number | null
          event_type?: string
          id?: string
          occurred_at?: string
          performance_rank?: string | null
          performance_score?: number | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          avoidance_tag: string | null
          base_xp: number | null
          carry_over_count: number
          category: string | null
          cognitive_load: number | null
          completed: boolean
          completed_at: string | null
          created_at: string
          deleted_at: string | null
          difficulty: number | null
          discipline_weight: number | null
          domain: string | null
          due_date: string | null
          emotional_resistance: number | null
          energy_required: number | null
          fatigue_impact: number | null
          focus_required: number | null
          hobby_tag: string | null
          id: string
          impact: number | null
          mental_load: number | null
          mission_chain_id: string | null
          mission_intent: string | null
          notes: string | null
          parent_task_id: string | null
          priority: number | null
          psychology_label: string | null
          recurrence_rule: string | null
          recurrence_weekdays: string | null
          snooze_until: string | null
          social_load: number | null
          strategic_value: number | null
          strategy_key_result_id: string | null
          title: string
          updated_at: string
          urgency: number | null
          user_id: string
          validation_type: string | null
        }
        Insert: {
          avoidance_tag?: string | null
          base_xp?: number | null
          carry_over_count?: number
          category?: string | null
          cognitive_load?: number | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          difficulty?: number | null
          discipline_weight?: number | null
          domain?: string | null
          due_date?: string | null
          emotional_resistance?: number | null
          energy_required?: number | null
          fatigue_impact?: number | null
          focus_required?: number | null
          hobby_tag?: string | null
          id?: string
          impact?: number | null
          mental_load?: number | null
          mission_chain_id?: string | null
          mission_intent?: string | null
          notes?: string | null
          parent_task_id?: string | null
          priority?: number | null
          psychology_label?: string | null
          recurrence_rule?: string | null
          recurrence_weekdays?: string | null
          snooze_until?: string | null
          social_load?: number | null
          strategic_value?: number | null
          strategy_key_result_id?: string | null
          title: string
          updated_at?: string
          urgency?: number | null
          user_id: string
          validation_type?: string | null
        }
        Update: {
          avoidance_tag?: string | null
          base_xp?: number | null
          carry_over_count?: number
          category?: string | null
          cognitive_load?: number | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          difficulty?: number | null
          discipline_weight?: number | null
          domain?: string | null
          due_date?: string | null
          emotional_resistance?: number | null
          energy_required?: number | null
          fatigue_impact?: number | null
          focus_required?: number | null
          hobby_tag?: string | null
          id?: string
          impact?: number | null
          mental_load?: number | null
          mission_chain_id?: string | null
          mission_intent?: string | null
          notes?: string | null
          parent_task_id?: string | null
          priority?: number | null
          psychology_label?: string | null
          recurrence_rule?: string | null
          recurrence_weekdays?: string | null
          snooze_until?: string | null
          social_load?: number | null
          strategic_value?: number | null
          strategy_key_result_id?: string | null
          title?: string
          updated_at?: string
          urgency?: number | null
          user_id?: string
          validation_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_mission_chain_id_fkey"
            columns: ["mission_chain_id"]
            isOneToOne: false
            referencedRelation: "mission_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_strategy_key_result_id_fkey"
            columns: ["strategy_key_result_id"]
            isOneToOne: false
            referencedRelation: "strategy_key_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_analytics_daily: {
        Row: {
          active_seconds: number
          brain_status_logged: boolean
          carry_over_count: number
          created_at: string
          date: string
          energy_avg: number | null
          focus_avg: number | null
          id: string
          learning_minutes: number
          missions_completed: number
          session_count: number
          tasks_completed: number
          tasks_planned: number
          total_session_time_seconds: number
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          active_seconds?: number
          brain_status_logged?: boolean
          carry_over_count?: number
          created_at?: string
          date: string
          energy_avg?: number | null
          focus_avg?: number | null
          id?: string
          learning_minutes?: number
          missions_completed?: number
          session_count?: number
          tasks_completed?: number
          tasks_planned?: number
          total_session_time_seconds?: number
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          active_seconds?: number
          brain_status_logged?: boolean
          carry_over_count?: number
          created_at?: string
          date?: string
          energy_avg?: number | null
          focus_avg?: number | null
          id?: string
          learning_minutes?: number
          missions_completed?: number
          session_count?: number
          tasks_completed?: number
          tasks_planned?: number
          total_session_time_seconds?: number
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_analytics_daily_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_behavior: {
        Row: {
          inactive_days: number
          last_active_date: string | null
          last_study_date: string | null
          missed_reason: string | null
          missed_reason_count: number
          no_book_selected: boolean
          updated_at: string
          user_id: string
          weekly_consistency: number
        }
        Insert: {
          inactive_days?: number
          last_active_date?: string | null
          last_study_date?: string | null
          missed_reason?: string | null
          missed_reason_count?: number
          no_book_selected?: boolean
          updated_at?: string
          user_id: string
          weekly_consistency?: number
        }
        Update: {
          inactive_days?: number
          last_active_date?: string | null
          last_study_date?: string | null
          missed_reason?: string | null
          missed_reason_count?: number
          no_book_selected?: boolean
          updated_at?: string
          user_id?: string
          weekly_consistency?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_behavior_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_category_limits: {
        Row: {
          category: string
          created_at: string
          limit_cents: number
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          limit_cents: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          limit_cents?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_category_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_economy: {
        Row: {
          discipline_points: number
          focus_credits: number
          momentum_boosters: number
          updated_at: string
          user_id: string
        }
        Insert: {
          discipline_points?: number
          focus_credits?: number
          momentum_boosters?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          discipline_points?: number
          focus_credits?: number
          momentum_boosters?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_economy_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          life_areas: Json
          momentum_score: number
          prime_window_end: string | null
          prime_window_start: string | null
          progression_rank: string
          rank_title: string | null
          specialization: string | null
          streak_shield_used_this_month: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          life_areas?: Json
          momentum_score?: number
          prime_window_end?: string | null
          prime_window_start?: string | null
          progression_rank?: string
          rank_title?: string | null
          specialization?: string | null
          streak_shield_used_this_month?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          life_areas?: Json
          momentum_score?: number
          prime_window_end?: string | null
          prime_window_start?: string | null
          progression_rank?: string
          rank_title?: string | null
          specialization?: string | null
          streak_shield_used_this_month?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_gamification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_google_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_google_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_identity_engine: {
        Row: {
          active_campaign_id: string | null
          archetype: string
          evolution_phase: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_campaign_id?: string | null
          archetype?: string
          evolution_phase?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_campaign_id?: string | null
          archetype?: string
          evolution_phase?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_identity_active_campaign"
            columns: ["active_campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_identity_engine_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          auto_master_missions: boolean
          color_mode: string
          compact_ui: boolean
          reduced_motion: boolean
          selected_emotion: string | null
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_master_missions?: boolean
          color_mode?: string
          compact_ui?: boolean
          reduced_motion?: boolean
          selected_emotion?: string | null
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_master_missions?: boolean
          color_mode?: string
          compact_ui?: boolean
          reduced_motion?: boolean
          selected_emotion?: string | null
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reputation: {
        Row: {
          consistency: number
          discipline: number
          impact: number
          updated_at: string
          user_id: string
        }
        Insert: {
          consistency?: number
          discipline?: number
          impact?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          consistency?: number
          discipline?: number
          impact?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reputation_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skills: {
        Row: {
          skill_key: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          skill_key: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          skill_key?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streak: {
        Row: {
          current_streak: number
          last_completion_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_completion_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_completion_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streak_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_xp: {
        Row: {
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_xp_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          budget_period: string | null
          calendar_feed_token: string | null
          created_at: string
          currency: string | null
          display_name: string | null
          email: string | null
          id: string
          impulse_quick_add_minutes: number | null
          impulse_risk_categories: Json | null
          impulse_threshold_pct: number | null
          last_payday_date: string | null
          last_rollover_date: string | null
          monthly_budget_cents: number | null
          monthly_savings_cents: number | null
          payday_day_of_month: number | null
          push_quiet_hours_end: string | null
          push_quiet_hours_start: string | null
          push_quote_enabled: boolean | null
          push_quote_time: string | null
          push_sent_count: number | null
          push_sent_date: string | null
          push_subscription_json: Json | null
          role: string | null
          timezone: string | null
          updated_at: string
          weekly_learning_target_minutes: number | null
        }
        Insert: {
          avatar_url?: string | null
          budget_period?: string | null
          calendar_feed_token?: string | null
          created_at?: string
          currency?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          impulse_quick_add_minutes?: number | null
          impulse_risk_categories?: Json | null
          impulse_threshold_pct?: number | null
          last_payday_date?: string | null
          last_rollover_date?: string | null
          monthly_budget_cents?: number | null
          monthly_savings_cents?: number | null
          payday_day_of_month?: number | null
          push_quiet_hours_end?: string | null
          push_quiet_hours_start?: string | null
          push_quote_enabled?: boolean | null
          push_quote_time?: string | null
          push_sent_count?: number | null
          push_sent_date?: string | null
          push_subscription_json?: Json | null
          role?: string | null
          timezone?: string | null
          updated_at?: string
          weekly_learning_target_minutes?: number | null
        }
        Update: {
          avatar_url?: string | null
          budget_period?: string | null
          calendar_feed_token?: string | null
          created_at?: string
          currency?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          impulse_quick_add_minutes?: number | null
          impulse_risk_categories?: Json | null
          impulse_threshold_pct?: number | null
          last_payday_date?: string | null
          last_rollover_date?: string | null
          monthly_budget_cents?: number | null
          monthly_savings_cents?: number | null
          payday_day_of_month?: number | null
          push_quiet_hours_end?: string | null
          push_quiet_hours_start?: string | null
          push_quote_enabled?: boolean | null
          push_quote_time?: string | null
          push_sent_count?: number | null
          push_sent_date?: string | null
          push_subscription_json?: Json | null
          role?: string | null
          timezone?: string | null
          updated_at?: string
          weekly_learning_target_minutes?: number | null
        }
        Relationships: []
      }
      weekly_budget_adjustment: {
        Row: {
          behavior_index: number
          budget_discipline_met: boolean
          created_at: string
          discretionary_change_cents: number
          id: string
          recovery_available: boolean
          savings_transfer_cents: number
          user_id: string
          week_start: string
        }
        Insert: {
          behavior_index: number
          budget_discipline_met?: boolean
          created_at?: string
          discretionary_change_cents?: number
          id?: string
          recovery_available?: boolean
          savings_transfer_cents?: number
          user_id: string
          week_start: string
        }
        Update: {
          behavior_index?: number
          budget_discipline_met?: boolean
          created_at?: string
          discretionary_change_cents?: number
          id?: string
          recovery_available?: boolean
          savings_transfer_cents?: number
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_budget_adjustment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reports: {
        Row: {
          avg_rank_numeric: number | null
          consistency_days: number | null
          created_at: string
          id: string
          missions_completed: number
          performance_index: number | null
          rank_progress: number | null
          streak_status: number
          total_minutes: number
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          avg_rank_numeric?: number | null
          consistency_days?: number | null
          created_at?: string
          id?: string
          missions_completed?: number
          performance_index?: number | null
          rank_progress?: number | null
          streak_status?: number
          total_minutes?: number
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          avg_rank_numeric?: number | null
          consistency_days?: number | null
          created_at?: string
          id?: string
          missions_completed?: number
          performance_index?: number | null
          rank_progress?: number | null
          streak_status?: number
          total_minutes?: number
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_events: {
        Row: {
          amount: number
          created_at: string
          id: string
          source_type: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          source_type: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          source_type?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mission_user_stats: {
        Row: {
          avg_time_seconds: number | null
          completion_rate: number | null
          hesitation_time_avg: number | null
          mission_id: string | null
          roi: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_events_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_user_stats: {
        Row: {
          avg_time_seconds: number | null
          completion_rate: number | null
          hesitation_time_avg: number | null
          task_id: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_user_is_admin: { Args: never; Returns: boolean }
      get_calendar_feed_events: {
        Args: { p_token: string }
        Returns: {
          end_at: string
          id: string
          start_at: string
          title: string
        }[]
      }
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

/** Convenience alias for tasks table Row */
export type Task = Database["public"]["Tables"]["tasks"]["Row"]

/** Quote shape for quote-of-the-day (quotes table may be absent in schema; app expects this shape) */
export type Quote = {
  id: number
  author_name: string
  era: string
  topic: string | null
  quote_text: string
  created_at: string
}
