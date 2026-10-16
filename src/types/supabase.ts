/**
 * Supabase database types for GiveHand ET.
 * Matches all 16 core tables, views, and enums from Phase 2 migrations.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "supporter" | "organization" | "admin";
export type OrgStatus = "pending" | "verified" | "rejected" | "suspended";
export type OrgMemberRole = "owner" | "manager" | "staff";
export type NeedStatus =
  | "draft"
  | "open"
  | "in_progress"
  | "completed"
  | "cancelled";
export type NeedUrgency = "low" | "medium" | "high" | "critical";
export type ItemType = "volunteer" | "material" | "money";
export type VolunteerAppStatus =
  | "applied"
  | "approved"
  | "waitlisted"
  | "rejected"
  | "confirmed"
  | "attended"
  | "no_show"
  | "completed"
  | "cancelled";
export type MaterialPledgeStatus =
  | "pledged"
  | "in_transit"
  | "delivered"
  | "received"
  | "partially_received"
  | "rejected"
  | "cancelled";
export type MoneyDonationStatus =
  | "pledged"
  | "payment_submitted"
  | "confirmed"
  | "rejected"
  | "cancelled";
export type PaymentMethod =
  | "telebirr"
  | "cbe_birr"
  | "bank_transfer"
  | "chapa"
  | "cash"
  | "other";
export type CertificateType =
  | "volunteer_service"
  | "donation_receipt"
  | "partner_recognition";
export type NotificationType =
  | "application_status"
  | "donation_confirmed"
  | "pledge_status"
  | "new_update"
  | "certificate_issued"
  | "org_verified"
  | "general";

// ============================================================================
// ROW TYPES
// ============================================================================

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  subcity: string | null;
  bio: string | null;
  avatar_url: string | null;
  skills: string[] | null;
  interests: string[] | null;
  availability: string | null;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
};

export type Organization = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  registration_number: string | null;
  status: OrgStatus;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationMember = {
  id: string;
  organization_id: string;
  user_id: string;
  member_role: OrgMemberRole;
  created_at: string;
};

export type OrganizationDocument = {
  id: string;
  organization_id: string;
  file_path: string;
  doc_type: string;
  review_note: string | null;
  status: string;
  created_at: string;
};

export type Category = {
  id: string;
  name_en: string;
  name_am: string;
  icon: string | null;
  created_at: string;
};

export type Need = {
  id: string;
  organization_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  location_text: string | null;
  lat: number | null;
  lng: number | null;
  is_remote: boolean;
  start_date: string | null;
  end_date: string | null;
  status: NeedStatus;
  urgency: boolean;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
};

export type NeedItem = {
  id: string;
  need_id: string;
  item_type: ItemType;
  title: string;
  description: string | null;
  target_quantity: number | null;
  target_amount: number | null;
  unit: string | null;
  metadata: Record<string, unknown> | null;
  deadline: string | null;
  created_at: string;
};

export type VolunteerShift = {
  id: string;
  need_item_id: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  created_at: string;
};

export type VolunteerApplication = {
  id: string;
  need_item_id: string;
  shift_id: string | null;
  user_id: string;
  message: string | null;
  status: VolunteerAppStatus;
  hours_logged: number;
  checked_in_at: string | null;
  checked_out_at: string | null;
  check_in_token: string | null;
  created_at: string;
};

export type MaterialPledge = {
  id: string;
  need_item_id: string;
  user_id: string;
  quantity: number;
  received_quantity: number;
  delivery_method: string;
  status: MaterialPledgeStatus;
  condition_note: string | null;
  photo_url: string | null;
  created_at: string;
};

export type MoneyDonation = {
  id: string;
  need_item_id: string;
  user_id: string | null;
  amount: number;
  method: PaymentMethod;
  reference_number: string | null;
  proof_url: string | null;
  is_anonymous: boolean;
  status: MoneyDonationStatus;
  reject_reason: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
};

export type Certificate = {
  id: string;
  public_code: string;
  type: CertificateType;
  user_id: string;
  organization_id: string;
  related_id: string | null;
  data: Record<string, unknown>;
  issued_at: string;
  revoked_at: string | null;
};

export type NeedUpdate = {
  id: string;
  need_id: string;
  author_id: string;
  body: string;
  image_url: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type Report = {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  resolved_by: string | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

export type NeedItemProgress = {
  need_item_id: string;
  need_id: string;
  item_type: ItemType;
  title: string;
  target_quantity: number | null;
  target_amount: number | null;
  unit: string | null;
  confirmed_volunteers: number;
  attended_volunteers: number;
  total_hours_logged: number;
  pledged_material_quantity: number;
  received_material_quantity: number;
  pledged_money_amount: number;
  confirmed_money_amount: number;
  progress_percentage: number;
};

export type NeedOverallProgress = {
  need_id: string;
  title: string;
  status: NeedStatus;
  urgency: boolean;
  total_items: number;
  average_progress: number;
};

// ============================================================================
// DATABASE TYPE DEFINITION
// ============================================================================

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Omit<Profile, "id">> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      organizations: {
        Row: Organization;
        Insert: Partial<Omit<Organization, "id">> & { owner_id: string; name: string; slug: string };
        Update: Partial<Organization>;
        Relationships: [];
      };
      organization_members: {
        Row: OrganizationMember;
        Insert: Partial<Omit<OrganizationMember, "id">> & { organization_id: string; user_id: string };
        Update: Partial<OrganizationMember>;
        Relationships: [];
      };
      organization_documents: {
        Row: OrganizationDocument;
        Insert: Partial<Omit<OrganizationDocument, "id">> & { organization_id: string; file_path: string; doc_type: string };
        Update: Partial<OrganizationDocument>;
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: Partial<Omit<Category, "id">> & { name_en: string; name_am: string };
        Update: Partial<Category>;
        Relationships: [];
      };
      needs: {
        Row: Need;
        Insert: Partial<Omit<Need, "id">> & { organization_id: string; title: string };
        Update: Partial<Need>;
        Relationships: [];
      };
      need_items: {
        Row: NeedItem;
        Insert: Partial<Omit<NeedItem, "id">> & { need_id: string; item_type: ItemType; title: string };
        Update: Partial<NeedItem>;
        Relationships: [];
      };
      volunteer_shifts: {
        Row: VolunteerShift;
        Insert: Partial<Omit<VolunteerShift, "id">> & { need_item_id: string; starts_at: string; ends_at: string };
        Update: Partial<VolunteerShift>;
        Relationships: [];
      };
      volunteer_applications: {
        Row: VolunteerApplication;
        Insert: Partial<Omit<VolunteerApplication, "id">> & { need_item_id: string; user_id: string };
        Update: Partial<VolunteerApplication>;
        Relationships: [];
      };
      material_pledges: {
        Row: MaterialPledge;
        Insert: Partial<Omit<MaterialPledge, "id">> & { need_item_id: string; user_id: string; quantity: number };
        Update: Partial<MaterialPledge>;
        Relationships: [];
      };
      money_donations: {
        Row: MoneyDonation;
        Insert: Partial<Omit<MoneyDonation, "id">> & { need_item_id: string; amount: number };
        Update: Partial<MoneyDonation>;
        Relationships: [];
      };
      certificates: {
        Row: Certificate;
        Insert: Partial<Omit<Certificate, "id">> & { user_id: string; organization_id: string };
        Update: Partial<Certificate>;
        Relationships: [];
      };
      need_updates: {
        Row: NeedUpdate;
        Insert: Partial<Omit<NeedUpdate, "id">> & { need_id: string; author_id: string; body: string };
        Update: Partial<NeedUpdate>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: Partial<Omit<Notification, "id">> & { user_id: string; title: string; body: string };
        Update: Partial<Notification>;
        Relationships: [];
      };
      reports: {
        Row: Report;
        Insert: Partial<Omit<Report, "id">> & { reporter_id: string; target_type: string; target_id: string; reason: string };
        Update: Partial<Report>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<Omit<AuditLog, "id">> & { action: string; target_type: string };
        Update: Partial<AuditLog>;
        Relationships: [];
      };
    };
    Views: {
      need_item_progress: {
        Row: NeedItemProgress;
        Relationships: [];
      };
      need_overall_progress: {
        Row: NeedOverallProgress;
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_org_member: {
        Args: { org_id: string };
        Returns: boolean;
      };
      is_org_owner: {
        Args: { org_id: string };
        Returns: boolean;
      };
      is_verified_org: {
        Args: { org_id: string };
        Returns: boolean;
      };
      log_audit_event: {
        Args: {
          p_actor_id: string;
          p_action: string;
          p_target_type: string;
          p_target_id?: string;
          p_details?: Record<string, unknown>;
        };
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      org_status: OrgStatus;
      org_member_role: OrgMemberRole;
      need_status: NeedStatus;
      need_urgency: NeedUrgency;
      item_type: ItemType;
      volunteer_app_status: VolunteerAppStatus;
      material_pledge_status: MaterialPledgeStatus;
      money_donation_status: MoneyDonationStatus;
      payment_method: PaymentMethod;
      certificate_type: CertificateType;
      notification_type: NotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
};
