-- Allow fractional card positions so a card can be inserted between two
-- existing cards without rewriting any other row. Existing integer values
-- convert losslessly; the default stays 0.
alter table public.cards
  alter column position type numeric using position::numeric;
