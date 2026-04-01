-- ============================================================
-- USIL Ventures OS — Seed data
-- Ejecutar DESPUÉS de 01_schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- startups
-- ------------------------------------------------------------
insert into public.startups
  (id, nombre, generacion, tipo, estado, riesgo, cantidad_hitos, drive_url, objetivo_general)
values
  (
    'a1000000-0000-0000-0000-000000000001',
    'Jardín.pe',
    '9G', 'Innovadores', 'activa', 'bajo', 3,
    'https://drive.google.com/placeholder',
    'Jardin.Pe es el primer Marketplace especializado en plantas y afines de Perú y LATAM, donde mediante una plataforma web simple conectan a vendedores de plantas con el público general.'
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'Freenanzas',
    '11G', 'Innovadores', 'activa', 'bajo', 3,
    'https://drive.google.com/placeholder',
    'Uso de IA generativa para la creación de rutas de aprendizaje financieras personalizadas por usuarios.'
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'Flash Box',
    '12G', 'Dinámicos', 'activa', 'bajo', 3,
    'https://drive.google.com/placeholder',
    'Logística verde con microalmacenes inteligentes.'
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    'Tiky Toky',
    '12G', 'Innovadores', 'activa', 'alto', 3,
    'https://drive.google.com/placeholder',
    'MOOD: cócteles sin alcohol funcionales que replican el efecto social y el placer de beber, sin las consecuencias negativas del alcohol y sin culpa.'
  ),
  (
    'a1000000-0000-0000-0000-000000000005',
    'Tri Salsabor',
    '12G', 'Innovadores', 'activa', 'bajo', 3,
    'https://drive.google.com/placeholder',
    'Propuesta de salsas saludables en un solo empaque que permite servirse tres salsas en un solo acto, sin añadir demasiadas calorías. Sabores: ají, ketchup y mayonesa.'
  );

-- ------------------------------------------------------------
-- startup_contacts
-- ------------------------------------------------------------
insert into public.startup_contacts
  (startup_id, responsable, correo, celular)
values
  ('a1000000-0000-0000-0000-000000000001', 'Gregory Lee',      'gregory@jardin.pe',                   '942890785'),
  ('a1000000-0000-0000-0000-000000000002', 'Karyna Lazaro',    'klazaro.agencia@gmail.com',            '965192417'),
  ('a1000000-0000-0000-0000-000000000003', 'Norman Quijandria','norman.quijandria2407@gmail.com',      '908807994'),
  ('a1000000-0000-0000-0000-000000000004', 'Jose Pacheco',     'jose.pachecov.01@gmail.com',           '982937956'),
  ('a1000000-0000-0000-0000-000000000005', 'Susana Berrios',   'susanaberrios@marketingycreatividad.net','974908629');

-- ------------------------------------------------------------
-- startup_hitos (3 por startup, estado inicial: pendiente)
-- ------------------------------------------------------------
insert into public.startup_hitos
  (startup_id, nombre, orden, estado)
values
  -- Jardín.pe
  ('a1000000-0000-0000-0000-000000000001', 'Hito 1', 1, 'pendiente'),
  ('a1000000-0000-0000-0000-000000000001', 'Hito 2', 2, 'pendiente'),
  ('a1000000-0000-0000-0000-000000000001', 'Hito 3', 3, 'pendiente'),
  -- Freenanzas
  ('a1000000-0000-0000-0000-000000000002', 'Hito 1', 1, 'pendiente'),
  ('a1000000-0000-0000-0000-000000000002', 'Hito 2', 2, 'pendiente'),
  ('a1000000-0000-0000-0000-000000000002', 'Hito 3', 3, 'pendiente'),
  -- Flash Box
  ('a1000000-0000-0000-0000-000000000003', 'Hito 1', 1, 'pendiente'),
  ('a1000000-0000-0000-0000-000000000003', 'Hito 2', 2, 'pendiente'),
  ('a1000000-0000-0000-0000-000000000003', 'Hito 3', 3, 'pendiente'),
  -- Tiky Toky
  ('a1000000-0000-0000-0000-000000000004', 'Hito 1', 1, 'pendiente'),
  ('a1000000-0000-0000-0000-000000000004', 'Hito 2', 2, 'pendiente'),
  ('a1000000-0000-0000-0000-000000000004', 'Hito 3', 3, 'pendiente'),
  -- Tri Salsabor
  ('a1000000-0000-0000-0000-000000000005', 'Hito 1', 1, 'pendiente'),
  ('a1000000-0000-0000-0000-000000000005', 'Hito 2', 2, 'pendiente'),
  ('a1000000-0000-0000-0000-000000000005', 'Hito 3', 3, 'pendiente');
