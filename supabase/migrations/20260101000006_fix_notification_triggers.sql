-- ============================================================
-- Migration: Fix Notification Triggers & Column Names
-- Fixes "record 'new' has no field 'supporter_id'" on volunteer_applications
-- and aligns money_donations and certificates triggers.
-- ============================================================

-- 1. Ensure table columns are consistent
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    -- Convert type to TEXT if it was an enum
    ALTER TABLE public.notifications ALTER COLUMN type TYPE TEXT USING type::text;

    -- Ensure action_url, link, and metadata columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'action_url') THEN
      ALTER TABLE public.notifications ADD COLUMN action_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'link') THEN
      ALTER TABLE public.notifications ADD COLUMN link TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'metadata') THEN
      ALTER TABLE public.notifications ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}';
    END IF;
  END IF;
END $$;

-- 2. Helper function: notify a user
CREATE OR REPLACE FUNCTION notify_user(
  p_user_id    UUID,
  p_type       TEXT,
  p_title      TEXT,
  p_body       TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_metadata   JSONB DEFAULT '{}'
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, action_url, link, metadata)
  VALUES (p_user_id, p_type, p_title, p_body, p_action_url, p_action_url, p_metadata);
END;
$$;

-- 3. Fix volunteer status change notification trigger
-- Replaces NEW.supporter_id with NEW.user_id
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

-- Drop and recreate trigger to ensure it points to the updated function
DROP TRIGGER IF EXISTS on_volunteer_status_change ON public.volunteer_applications;
CREATE TRIGGER on_volunteer_status_change
  AFTER UPDATE OF status ON public.volunteer_applications
  FOR EACH ROW EXECUTE FUNCTION trigger_volunteer_status_notification();

-- 4. Fix money donations notification trigger
-- Replaces NEW.supporter_id with NEW.user_id
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

DROP TRIGGER IF EXISTS on_donation_status_change ON public.money_donations;
CREATE TRIGGER on_donation_status_change
  AFTER UPDATE OF status ON public.money_donations
  FOR EACH ROW EXECUTE FUNCTION trigger_donation_confirmed_notification();

-- 5. Fix certificate issued trigger
-- Replaces NEW.holder_id with NEW.user_id, and NEW.code with NEW.public_code
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

DROP TRIGGER IF EXISTS on_certificate_issued ON public.certificates;
CREATE TRIGGER on_certificate_issued
  AFTER INSERT ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION trigger_certificate_issued_notification();
