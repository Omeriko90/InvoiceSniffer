-- Add two recurrence cadences to FixedExpenseFrequency. Placed next to their
-- period siblings (BIWEEKLY after WEEKLY, BIMONTHLY after MONTHLY) so the DB
-- enum order matches schema.prisma. Additive only — no existing rows change.
ALTER TYPE "FixedExpenseFrequency" ADD VALUE IF NOT EXISTS 'BIWEEKLY' AFTER 'WEEKLY';
ALTER TYPE "FixedExpenseFrequency" ADD VALUE IF NOT EXISTS 'BIMONTHLY' AFTER 'MONTHLY';
