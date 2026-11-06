-- Default weekly hours (edit later from the admin panel). 0 = Sunday.
insert into public.business_hours (day_of_week, opening_time, closing_time, is_open) values
  (0, '10:00', '18:00', false),
  (1, '09:00', '19:00', true),
  (2, '09:00', '19:00', true),
  (3, '09:00', '19:00', true),
  (4, '09:00', '19:00', true),
  (5, '09:00', '19:00', true),
  (6, '10:00', '17:00', true);

-- Starter services (placeholders; edit prices in USD from the admin panel)
insert into public.services (name, description, category, price, duration_minutes, sort_order) values
  ('Classic Manicure', 'Shaping, cuticle care and polish.', 'manicure', 35, 45, 1),
  ('Gel Manicure', 'Long-lasting gel color with nail prep.', 'manicure', 50, 60, 2),
  ('Classic Pedicure', 'Soak, exfoliation, massage and polish.', 'pedicure', 55, 60, 3),
  ('Mani + Pedi Combo', 'Our signature manicure and pedicure together.', 'combo', 95, 120, 4),
  ('Custom Nail Art', 'Hand-painted designs, priced per set.', 'design', 20, 30, 5);
