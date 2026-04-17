-- DropColumns: Remove legacy Stripe payment fields
-- These columns were created in the init migration but are no longer in the schema.
-- The project now uses Paymob for card payments.

-- SQLite doesn't support DROP COLUMN directly before 3.35.0
-- Using the ALTER TABLE DROP COLUMN syntax (supported in SQLite 3.35.0+)
ALTER TABLE "Order" DROP COLUMN "stripeSessionId";
ALTER TABLE "Order" DROP COLUMN "stripePaymentId";
