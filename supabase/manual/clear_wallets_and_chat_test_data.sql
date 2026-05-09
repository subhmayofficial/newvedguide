-- =============================================================================
-- MANUAL SCRIPT — run in Supabase SQL Editor only when you mean to wipe data.
-- Backs up nothing. Review before execute.
--
-- Why disable trigger: user_profiles_wallet_guard() only allows balance updates
-- when current_user is service_role. SQL Editor runs as postgres — direct UPDATE
-- would raise: wallet_balance_paise cannot be updated directly
-- =============================================================================

BEGIN;

TRUNCATE TABLE public.wallet_ledger;

DO $body$
BEGIN
  ALTER TABLE public.user_profiles DISABLE TRIGGER trg_user_profiles_wallet_guard;
  UPDATE public.user_profiles
  SET wallet_balance_paise = 0,
      updated_at = now();
  ALTER TABLE public.user_profiles ENABLE TRIGGER trg_user_profiles_wallet_guard;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    ALTER TABLE public.user_profiles ENABLE TRIGGER trg_user_profiles_wallet_guard;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  RAISE;
END;
$body$;

DELETE FROM public.chat_sessions;

TRUNCATE TABLE public.wallet_recharge_intents;

COMMIT;

-- -----------------------------------------------------------------------------
-- OPTIONAL — delete auth users EXCEPT admin@vedguide.com (run separately if needed)
-- -----------------------------------------------------------------------------
-- BEGIN;
-- DELETE FROM auth.users
-- WHERE lower(coalesce(email, '')) <> lower('admin@vedguide.com');
-- COMMIT;
