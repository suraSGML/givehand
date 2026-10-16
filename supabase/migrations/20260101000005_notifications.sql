-- ============================================================
-- Migration: notifications table (Phase 7)
-- Run this in Supabase SQL editor if you want persistent
-- notifications. The app works with mock data without it.
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL DEFAULT '',
  action_url    TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}',
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications(user_id, created_at DESC);

-- RLS: users can only see and update their own notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark own notifications read"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can insert notifications (triggered by server actions)
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ── Helper function: notify a user ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_user(
  p_user_id    UUID,
  p_type       TEXT,
  p_title      TEXT,
  p_body       TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_metadata   JSONB DEFAULT '{}'
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, action_url, metadata)
  VALUES (p_user_id, p_type, p_title, p_body, p_action_url, p_metadata);
END;
$$;

-- ── Trigger: notify supporter when donation is confirmed ─────────────────────
CREATE OR REPLACE FUNCTION trigger_donation_confirmed_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM 'confirmed') THEN
    IF NEW.user_id IS NOT NULL THEN
      PERFORM notify_user(
        NEW.user_id,
        'donation_confirmed',
        'Donation Confirmed ✓',
        format('Your %s ETB donation has been confirmed by the organization.', NEW.amount::text),
        '/dashboard/donations',
        jsonb_build_object('donationId', NEW.id, 'amount', NEW.amount)
      );
    END IF;
  ELSIF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    IF NEW.user_id IS NOT NULL THEN
      PERFORM notify_user(
        NEW.user_id,
        'donation_rejected',
        'Donation Not Confirmed',
        format('Your %s ETB donation could not be verified. Please contact the organization.', NEW.amount::text),
        '/dashboard/donations',
        jsonb_build_object('donationId', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_donation_status_change
  AFTER UPDATE OF status ON money_donations
  FOR EACH ROW EXECUTE FUNCTION trigger_donation_confirmed_notification();

-- ── Trigger: notify supporter when volunteer application status changes ───────
CREATE OR REPLACE FUNCTION trigger_volunteer_status_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    IF NEW.user_id IS NOT NULL THEN
      PERFORM notify_user(
        NEW.user_id,
        'volunteer_approved',
        'Volunteer Application Approved',
        'Your volunteer application has been approved! Check your dashboard for shift details.',
        '/dashboard/commitments',
        jsonb_build_object('applicationId', NEW.id)
      );
    END IF;
  ELSIF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    IF NEW.user_id IS NOT NULL THEN
      PERFORM notify_user(
        NEW.user_id,
        'volunteer_rejected',
        'Volunteer Application Not Accepted',
        'Your volunteer application was not accepted for this shift. Thank you for your interest.',
        '/dashboard/commitments',
        jsonb_build_object('applicationId', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_volunteer_status_change
  AFTER UPDATE OF status ON volunteer_applications
  FOR EACH ROW EXECUTE FUNCTION trigger_volunteer_status_notification();

-- ── Trigger: notify supporter when certificate is issued ─────────────────────
CREATE OR REPLACE FUNCTION trigger_certificate_issued_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    PERFORM notify_user(
      NEW.user_id,
      'certificate_issued',
      'Certificate Ready for Download',
      format('Your GiveHand ET certificate (%s) is now available.', NEW.public_code),
      '/dashboard/certificates',
      jsonb_build_object('certificateId', NEW.id, 'code', NEW.public_code)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_certificate_issued
  AFTER INSERT ON certificates
  FOR EACH ROW EXECUTE FUNCTION trigger_certificate_issued_notification();
