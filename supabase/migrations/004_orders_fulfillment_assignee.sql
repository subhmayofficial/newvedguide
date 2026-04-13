-- Who is fulfilling the order (admin assignment)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS fulfillment_assignee TEXT;

COMMENT ON COLUMN orders.fulfillment_assignee IS 'Admin: Ashu, Roshan, or NULL if unassigned';
