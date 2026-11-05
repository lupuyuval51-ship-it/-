
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "ai_conversations": {
                  Row: {
                    "business_id": string,"created_at": string,"id": string,"last_message_at": string,"title": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"id"?: string,"last_message_at"?: string,"title"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"id"?: string,"last_message_at"?: string,"title"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ai_conversations_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"ai_messages": {
                  Row: {
                    "actions": NonNullable<Json>,"applied_action_ids": (string)[],"content": string,"conversation_id": string,"created_at": string,"follow_ups": NonNullable<Json>,"id": string,"input_tokens": number | null,"model": string | null,"output_tokens": number | null,"role": string,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actions"?: NonNullable<Json>,"applied_action_ids"?: (string)[],"content"?: string,"conversation_id": string,"created_at"?: string,"follow_ups"?: NonNullable<Json>,"id"?: string,"input_tokens"?: number | null,"model"?: string | null,"output_tokens"?: number | null,"role": string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "actions"?: NonNullable<Json>,"applied_action_ids"?: (string)[],"content"?: string,"conversation_id"?: string,"created_at"?: string,"follow_ups"?: NonNullable<Json>,"id"?: string,"input_tokens"?: number | null,"model"?: string | null,"output_tokens"?: number | null,"role"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ai_messages_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "ai_conversations"
      referencedColumns: ["id"]
    }
                  ]
                },"ai_usage_records": {
                  Row: {
                    "business_id": string | null,"cost_usd_micros": number,"created_at": string,"error_code": string | null,"feature": string,"id": string,"input_tokens": number,"model": string,"output_tokens": number,"status": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id"?: string | null,"cost_usd_micros"?: number,"created_at"?: string,"error_code"?: string | null,"feature": string,"id"?: string,"input_tokens"?: number,"model": string,"output_tokens"?: number,"status"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "business_id"?: string | null,"cost_usd_micros"?: number,"created_at"?: string,"error_code"?: string | null,"feature"?: string,"id"?: string,"input_tokens"?: number,"model"?: string,"output_tokens"?: number,"status"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ai_usage_records_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"business_goals": {
                  Row: {
                    "business_id": string,"created_at": string,"current_value": number,"due_date": string | null,"id": string,"metric": string,"status": string,"target_value": number,"title": string,"unit": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"current_value"?: number,"due_date"?: string | null,"id"?: string,"metric": string,"status"?: string,"target_value": number,"title": string,"unit"?: string,"updated_at"?: string
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"current_value"?: number,"due_date"?: string | null,"id"?: string,"metric"?: string,"status"?: string,"target_value"?: number,"title"?: string,"unit"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "business_goals_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"business_plans": {
                  Row: {
                    "business_id": string,"created_at": string,"current_version_id": string | null,"id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"current_version_id"?: string | null,"id"?: string,"updated_at"?: string
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"current_version_id"?: string | null,"id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "business_plans_business_id_fkey"
      columns: ["business_id"]
isOneToOne: true
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "business_plans_current_version_id_fkey"
      columns: ["current_version_id"]
isOneToOne: false
      referencedRelation: "plan_versions"
      referencedColumns: ["id"]
    }
                  ]
                },"businesses": {
                  Row: {
                    "archived_at": string | null,"country_code": string | null,"created_at": string,"currency": string,"id": string,"idea": string,"name": string,"onboarding_completed_at": string | null,"owner_id": string,"stage": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"country_code"?: string | null,"created_at"?: string,"currency"?: string,"id"?: string,"idea"?: string,"name": string,"onboarding_completed_at"?: string | null,"owner_id"?: string,"stage"?: string,"updated_at"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"country_code"?: string | null,"created_at"?: string,"currency"?: string,"id"?: string,"idea"?: string,"name"?: string,"onboarding_completed_at"?: string | null,"owner_id"?: string,"stage"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"financial_models": {
                  Row: {
                    "business_id": string,"conservative_cost_pct": number,"conservative_price_pct": number,"conservative_volume_pct": number,"created_at": string,"forecast_months": number,"optimistic_cost_pct": number,"optimistic_price_pct": number,"optimistic_volume_pct": number,"starting_capital_minor": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"conservative_cost_pct"?: number,"conservative_price_pct"?: number,"conservative_volume_pct"?: number,"created_at"?: string,"forecast_months"?: number,"optimistic_cost_pct"?: number,"optimistic_price_pct"?: number,"optimistic_volume_pct"?: number,"starting_capital_minor"?: number,"updated_at"?: string
                  }
                  Update: {
                    "business_id"?: string,"conservative_cost_pct"?: number,"conservative_price_pct"?: number,"conservative_volume_pct"?: number,"created_at"?: string,"forecast_months"?: number,"optimistic_cost_pct"?: number,"optimistic_price_pct"?: number,"optimistic_volume_pct"?: number,"starting_capital_minor"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "financial_models_business_id_fkey"
      columns: ["business_id"]
isOneToOne: true
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"launch_checklist_items": {
                  Row: {
                    "business_id": string,"category": string,"created_at": string,"description": string,"id": string,"notes": string,"sort_order": number,"source_name": string | null,"source_url": string | null,"status": string,"template_key": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"category": string,"created_at"?: string,"description"?: string,"id"?: string,"notes"?: string,"sort_order"?: number,"source_name"?: string | null,"source_url"?: string | null,"status"?: string,"template_key"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "business_id"?: string,"category"?: string,"created_at"?: string,"description"?: string,"id"?: string,"notes"?: string,"sort_order"?: number,"source_name"?: string | null,"source_url"?: string | null,"status"?: string,"template_key"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "launch_checklist_items_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"marketing_assets": {
                  Row: {
                    "business_id": string,"content": NonNullable<Json>,"created_at": string,"id": string,"kind": string,"origin": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"content"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"kind": string,"origin"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "business_id"?: string,"content"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"kind"?: string,"origin"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "marketing_assets_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"milestones": {
                  Row: {
                    "achieved_at": string | null,"business_id": string,"created_at": string,"id": string,"phase": string,"sort_order": number,"source": string,"target_date": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "achieved_at"?: string | null,"business_id": string,"created_at"?: string,"id"?: string,"phase": string,"sort_order"?: number,"source"?: string,"target_date"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "achieved_at"?: string | null,"business_id"?: string,"created_at"?: string,"id"?: string,"phase"?: string,"sort_order"?: number,"source"?: string,"target_date"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "milestones_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"onboarding_responses": {
                  Row: {
                    "business_id": string,"created_at": string,"id": string,"question_key": string,"skipped": boolean,"updated_at": string,"value": Json | null
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"id"?: string,"question_key": string,"skipped"?: boolean,"updated_at"?: string,"value"?: Json | null
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"id"?: string,"question_key"?: string,"skipped"?: boolean,"updated_at"?: string,"value"?: Json | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "onboarding_responses_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"plan_sections": {
                  Row: {
                    "content": NonNullable<Json>,"created_at": string,"id": string,"origin": string,"plan_version_id": string,"section_key": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "content": NonNullable<Json>,"created_at"?: string,"id"?: string,"origin": string,"plan_version_id": string,"section_key": string,"updated_at"?: string
                  }
                  Update: {
                    "content"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"origin"?: string,"plan_version_id"?: string,"section_key"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "plan_sections_plan_version_id_fkey"
      columns: ["plan_version_id"]
isOneToOne: false
      referencedRelation: "plan_versions"
      referencedColumns: ["id"]
    }
                  ]
                },"plan_versions": {
                  Row: {
                    "based_on_version_id": string | null,"change_note": string | null,"created_at": string,"created_by": string | null,"error_code": string | null,"finance_proposal": Json | null,"id": string,"model": string | null,"origin": string,"plan_id": string,"status": string,"updated_at": string,"version_number": number
                  }
                  ComputedFields: never
                  Insert: {
                    "based_on_version_id"?: string | null,"change_note"?: string | null,"created_at"?: string,"created_by"?: string | null,"error_code"?: string | null,"finance_proposal"?: Json | null,"id"?: string,"model"?: string | null,"origin": string,"plan_id": string,"status"?: string,"updated_at"?: string,"version_number"?: number
                  }
                  Update: {
                    "based_on_version_id"?: string | null,"change_note"?: string | null,"created_at"?: string,"created_by"?: string | null,"error_code"?: string | null,"finance_proposal"?: Json | null,"id"?: string,"model"?: string | null,"origin"?: string,"plan_id"?: string,"status"?: string,"updated_at"?: string,"version_number"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "plan_versions_based_on_version_id_fkey"
      columns: ["based_on_version_id"]
isOneToOne: false
      referencedRelation: "plan_versions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "plan_versions_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "business_plans"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "active_business_id": string | null,"created_at": string,"display_name": string | null,"id": string,"locale": string,"theme": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active_business_id"?: string | null,"created_at"?: string,"display_name"?: string | null,"id": string,"locale"?: string,"theme"?: string,"updated_at"?: string
                  }
                  Update: {
                    "active_business_id"?: string | null,"created_at"?: string,"display_name"?: string | null,"id"?: string,"locale"?: string,"theme"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_active_business_id_fkey"
      columns: ["active_business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"recurring_expenses": {
                  Row: {
                    "basis": string,"business_id": string,"category": string,"created_at": string,"id": string,"label": string,"monthly_amount_minor": number,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "basis"?: string,"business_id": string,"category"?: string,"created_at"?: string,"id"?: string,"label": string,"monthly_amount_minor"?: number,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "basis"?: string,"business_id"?: string,"category"?: string,"created_at"?: string,"id"?: string,"label"?: string,"monthly_amount_minor"?: number,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "recurring_expenses_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"revenue_streams": {
                  Row: {
                    "basis": string,"business_id": string,"created_at": string,"id": string,"label": string,"monthly_growth_pct": number,"monthly_units": number,"sort_order": number,"unit_price_minor": number,"unit_variable_cost_minor": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "basis"?: string,"business_id": string,"created_at"?: string,"id"?: string,"label": string,"monthly_growth_pct"?: number,"monthly_units"?: number,"sort_order"?: number,"unit_price_minor"?: number,"unit_variable_cost_minor"?: number,"updated_at"?: string
                  }
                  Update: {
                    "basis"?: string,"business_id"?: string,"created_at"?: string,"id"?: string,"label"?: string,"monthly_growth_pct"?: number,"monthly_units"?: number,"sort_order"?: number,"unit_price_minor"?: number,"unit_variable_cost_minor"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "revenue_streams_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"roadmap_phases": {
                  Row: {
                    "business_id": string,"created_at": string,"id": string,"objective": string,"phase": string,"starts_on": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"id"?: string,"objective"?: string,"phase": string,"starts_on"?: string,"updated_at"?: string
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"id"?: string,"objective"?: string,"phase"?: string,"starts_on"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "roadmap_phases_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"startup_costs": {
                  Row: {
                    "amount_minor": number,"basis": string,"business_id": string,"category": string,"created_at": string,"id": string,"label": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_minor"?: number,"basis"?: string,"business_id": string,"category"?: string,"created_at"?: string,"id"?: string,"label": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "amount_minor"?: number,"basis"?: string,"business_id"?: string,"category"?: string,"created_at"?: string,"id"?: string,"label"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "startup_costs_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"subscription_entitlements": {
                  Row: {
                    "created_at": string,"current_period_end": string | null,"source": string,"status": string,"tier": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"current_period_end"?: string | null,"source"?: string,"status"?: string,"tier"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"current_period_end"?: string | null,"source"?: string,"status"?: string,"tier"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"task_dependencies": {
                  Row: {
                    "created_at": string,"depends_on_task_id": string,"task_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"depends_on_task_id": string,"task_id": string
                  }
                  Update: {
                    "created_at"?: string,"depends_on_task_id"?: string,"task_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
      columns: ["depends_on_task_id"]
isOneToOne: false
      referencedRelation: "tasks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "task_dependencies_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "tasks"
      referencedColumns: ["id"]
    }
                  ]
                },"tasks": {
                  Row: {
                    "business_id": string,"completed_at": string | null,"created_at": string,"description": string,"due_date": string | null,"id": string,"milestone_id": string | null,"phase": string | null,"priority": string,"sort_order": number,"source": string,"status": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"completed_at"?: string | null,"created_at"?: string,"description"?: string,"due_date"?: string | null,"id"?: string,"milestone_id"?: string | null,"phase"?: string | null,"priority"?: string,"sort_order"?: number,"source"?: string,"status"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "business_id"?: string,"completed_at"?: string | null,"created_at"?: string,"description"?: string,"due_date"?: string | null,"id"?: string,"milestone_id"?: string | null,"phase"?: string | null,"priority"?: string,"sort_order"?: number,"source"?: string,"status"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tasks_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_milestone_fkey"
      columns: ["milestone_id","business_id"]
isOneToOne: false
      referencedRelation: "milestones"
      referencedColumns: ["id","business_id"]
    }
                  ]
                },"transactions": {
                  Row: {
                    "amount_minor": number,"business_id": string,"category": string,"created_at": string,"id": string,"kind": string,"note": string,"occurred_on": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_minor": number,"business_id": string,"category"?: string,"created_at"?: string,"id"?: string,"kind": string,"note"?: string,"occurred_on"?: string,"updated_at"?: string
                  }
                  Update: {
                    "amount_minor"?: number,"business_id"?: string,"category"?: string,"created_at"?: string,"id"?: string,"kind"?: string,"note"?: string,"occurred_on"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "transactions_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "advisor_action_ids":
{ Args: { "p_actions": Json }; Returns: (string)[]
                           },
"ai_usage_month_start":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"ai_usage_summary":
{ Args: Record<PropertyKey, never>; Returns: {
              "feature": string,"used": number
            }[]
                           },
"assert_business_access":
{ Args: { "p_business_id": string }; Returns: undefined
                           },
"current_tier":
{ Args: { "p_user"?: string }; Returns: string
                           },
"ensure_business_plan":
{ Args: { "p_business_id": string }; Returns: {
              "business_id": string,
"created_at": string,
"current_version_id": string | null,
"id": string,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "business_plans"
        isOneToOne: true
        isSetofReturn: false
      } },
"ensure_financial_model":
{ Args: { "p_business_id": string }; Returns: {
              "business_id": string,
"conservative_cost_pct": number,
"conservative_price_pct": number,
"conservative_volume_pct": number,
"created_at": string,
"forecast_months": number,
"optimistic_cost_pct": number,
"optimistic_price_pct": number,
"optimistic_volume_pct": number,
"starting_capital_minor": number,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "financial_models"
        isOneToOne: true
        isSetofReturn: false
      } },
"finalize_ai_usage":
{ Args: { "p_cost": number,"p_error"?: string,"p_id": string,"p_input": number,"p_output": number,"p_status": string }; Returns: undefined
                           },
"is_valid_marketing_content":
{ Args: { "p": Json }; Returns: boolean
                           },
"is_valid_plan_section_content":
{ Args: { "p": Json }; Returns: boolean
                           },
"owns_business":
{ Args: { "b": string }; Returns: boolean
                           },
"owns_conversation":
{ Args: { "p_conversation_id": string }; Returns: boolean
                           },
"owns_plan":
{ Args: { "p_plan_id": string }; Returns: boolean
                           },
"owns_plan_version":
{ Args: { "p_version_id": string }; Returns: boolean
                           },
"owns_task":
{ Args: { "p_task_id": string }; Returns: boolean
                           },
"replace_ai_roadmap":
{ Args: { "p_business_id": string }; Returns: undefined
                           },
"reserve_ai_usage":
{ Args: { "p_business": string,"p_cost_cap_micros": number,"p_feature": string,"p_model": string,"p_monthly_limit": number,"p_user": string }; Returns: string
                           },
"restore_plan_version":
{ Args: { "p_version_id": string }; Returns: string
                           },
"save_plan_section":
{ Args: { "p_business_id": string,"p_content": Json,"p_note"?: string,"p_origin"?: string,"p_section_key": string }; Returns: string
                           },
"tier_limits":
{ Args: { "p_tier": string }; Returns: {
              "max_businesses": number,"max_forecast_months": number
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
