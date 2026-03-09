
-- Vložení úvodních eventů do tabulky events
INSERT INTO public.events (id, title, date, location, status, image, description)
VALUES 
  ('mini-1', 'LAVRS market', '2026-03-21', 'Vnitroblock, Holešovice', 'open', '/media/1cde43c8-e02d-43da-aa4c-2c21532f5797.webp', NULL),
  ('mini-2', 'LAVRS market', '2026-05-30', 'Vnitroblock, Holešovice', 'open', '/media/LAVRSMarket-1681924565.png', NULL),
  ('mini-3', 'LAVRS market', '2026-07-25', 'Vnitroblock, Holešovice', 'open', '/media/Lavrsmarket-2022-foto-Dominika-Hruba.jpg', NULL),
  ('vianoce-mini-1', 'Vánoční LAVRS market', '2026-11-28', 'Radlická Kulturní Sportovna', 'closed', '/media/lavrs-bundy-foto-dominika-hruba-nahled.jpg', NULL),
  ('lavrs-big-1', 'LAVRS market', '2026-09-25', 'Garbe Holešovice', 'closed', '/media/lavrs-market.webp', '1 booking = 2 dny. Přihláška se vztahuje na oba dny.')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  date = EXCLUDED.date,
  location = EXCLUDED.location,
  status = EXCLUDED.status,
  image = EXCLUDED.image,
  description = EXCLUDED.description;

-- Vložení plánu pro první event (ukázka)
INSERT INTO public.event_plans (id, event_id, grid_width, grid_height, prices, equipment, category_sizes, extras)
VALUES (
  'plan-mini-1', 
  'mini-1', 
  12, 
  8, 
  '{"Secondhands": "2.500 Kč", "České značky": "3.800 Kč", "Designers": "4.200 Kč", "Beauty ZONE": "3.500 Kč", "TATTOO": "5.500 Kč", "Reuse": "2.200 Kč"}',
  '{"Secondhands": ["1x Stojan na šaty (vlastní)", "1x Stůl", "1x Židle"], "České značky": ["1x Stojan na šaty", "1x Stůl", "2x Židle"], "Designers": ["1x Stojan na šaty", "1x Stůl", "2x Židle", "Zrcadlo"], "Beauty ZONE": ["1x Stůl", "2x Židle", "Zrcadlo"], "TATTOO": ["1x Stůl", "2x Židle", "Podložka"], "Reuse": ["1x Stůl", "2x Židle"]}',
  '{"Secondhands": "Spot M", "České značky": "Spot S", "Designers": "Spot M", "Beauty ZONE": "Spot S", "TATTOO": "Spot L", "Reuse": "Spot M"}',
  '[{"id": "extra-chair", "label": "Extra Židle", "price": "200 Kč"}, {"id": "extra-table", "label": "Extra Stůl", "price": "400 Kč"}, {"id": "rack-rent", "label": "Extra stojan", "price": "300 Kč"}, {"id": "electricity", "label": "Přípojka elektřiny", "price": "500 Kč"}]'
)
ON CONFLICT (id) DO NOTHING;

-- Vložení zón por plan-mini-1
INSERT INTO public.zones (id, event_plan_id, name, color, category, capacities)
VALUES 
  ('z1', 'plan-mini-1', 'Hlavní sál', '#EF4444', 'Secondhands', '{"S": 5, "M": 10, "L": 2}'),
  ('z2', 'plan-mini-1', 'Designers Zone', '#8B5CF6', 'Designers', '{"S": 2, "M": 5, "L": 1}')
ON CONFLICT (id) DO NOTHING;

-- Vložení stojanů/stánků pro plan-mini-1
INSERT INTO public.stands (id, event_plan_id, x, y, size, zone_id)
VALUES 
  ('s1', 'plan-mini-1', 1, 1, 'M', 'z1'),
  ('s2', 'plan-mini-1', 1, 2, 'M', 'z1'),
  ('s3', 'plan-mini-1', 2, 1, 'S', 'z1'),
  ('s4', 'plan-mini-1', 5, 5, 'L', 'z2')
ON CONFLICT (id) DO NOTHING;

-- Vložení úvodních bannerů
INSERT INTO public.banners (id, title, subtitle, image, tag, sort_order)
VALUES 
  ('b1', 'Přípravy na Vánoce vrcholí', 'Nezapomeňte si včas rezervovat své místo na Vánočním LAVRS marketu. Kapacity se rychle plní!', '/media/1cde43c8-e02d-43da-aa4c-2c21532f5797.webp', 'DŮLEŽITÉ', 1),
  ('b2', 'Nová lokace v Holešovicích', 'Zářijový LAVRS market se přesouvá do úžasných prostor Garbe Holešovice. Máte se na co těšit.', '/media/lavrs-market.webp', 'NOVINKA', 2),
  ('b3', 'Workshop: Circular Fashion', 'Chcete se dozvědět více o tom, jak lépe prezentovat svou udržitelnou značku? Sledujte náš newsletter.', '/media/Lavrsmarket-2022-foto-Dominika-Hruba.jpg', 'WORKSHOP', 3)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  image = EXCLUDED.image,
  tag = EXCLUDED.tag,
  sort_order = EXCLUDED.sort_order;

-- Vložení úvodních kategorií značek
INSERT INTO public.categories (id, name, description)
VALUES 
  ('Secondhands', 'Secondhands', 'Vintage a second-hand móda'),
  ('České značky', 'České značky', 'Lokální české značky'),
  ('Designers', 'Designers', 'Designérské kousky'),
  ('Beauty ZONE', 'Beauty ZONE', 'Kosmetika a péče'),
  ('TATTOO', 'TATTOO', 'Tetování a body art'),
  ('Reuse', 'Reuse zone', 'Udržitelná a kreativní tvorba')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;
