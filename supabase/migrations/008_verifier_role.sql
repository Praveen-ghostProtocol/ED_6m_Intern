-- Add verifier as a portal role. Keep this isolated so later migrations can safely use the enum value.
alter type public.app_role add value if not exists 'verifier';