-- Fase 2, Tarea 1: el lado que faltaba del marketplace.
--
-- Tres entidades y un expediente:
--   carriers  -> la empresa transportista
--   vehicles  -> sus unidades
--   drivers   -> sus operadores
--   carrier_documents -> el expediente, con vigencia y quien lo reviso
--
-- Nada de esto lo escribe el navegador. Las altas y la verificacion pasan por
-- RPC o por service role, igual que el resto del proyecto.

create type public.estatus_verificacion as enum ('pendiente', 'verificado', 'suspendido', 'rechazado');

create table public.carriers (
  id            uuid primary key default gen_random_uuid(),
  razon_social  text not null,
  nombre_corto  text,
  rfc           text,
  contacto      text,
  telefono      text,
  email         text,
  estatus       public.estatus_verificacion not null default 'pendiente',
  notas         text,
  -- Cuando el transportista tenga login propio se cuelga aqui. Hoy nadie
  -- del lado transportista entra a la app: lo da de alta el operador.
  user_id       uuid references auth.users(id) on delete set null,
  verificado_en timestamptz,
  verificado_por uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

create unique index carriers_rfc_idx on public.carriers (upper(rfc)) where rfc is not null;

comment on table public.carriers is
  'Empresas transportistas. estatus lo mueve el RPC de verificacion, nunca el navegador.';

create table public.vehicles (
  id           uuid primary key default gen_random_uuid(),
  carrier_id   uuid not null references public.carriers(id) on delete cascade,
  placas       text not null,
  tipo         text,
  num_economico text,
  marca        text,
  modelo       text,
  anio         int,
  estatus      public.estatus_verificacion not null default 'pendiente',
  created_at   timestamptz not null default now()
);

create unique index vehicles_placas_idx on public.vehicles (upper(replace(placas, '-', '')));
create index vehicles_carrier_idx on public.vehicles (carrier_id);

create table public.drivers (
  id                uuid primary key default gen_random_uuid(),
  carrier_id        uuid not null references public.carriers(id) on delete cascade,
  nombre            text not null,
  licencia_federal  text,
  telefono          text,
  estatus           public.estatus_verificacion not null default 'pendiente',
  created_at        timestamptz not null default now()
);

create index drivers_carrier_idx on public.drivers (carrier_id);


-- Catalogo de documentos. Vive en tabla y no en el codigo a proposito: la
-- lista definitiva de que es obligatorio la confirma el abogado, no yo, y
-- cambiarla no debe requerir un deploy.
create table public.document_types (
  clave      text primary key,
  nombre     text not null,
  aplica_a   text not null check (aplica_a in ('carrier', 'vehicle', 'driver')),
  requerido  boolean not null default true,
  vence      boolean not null default true,
  orden      int not null default 100,
  nota       text
);

insert into public.document_types (clave, nombre, aplica_a, requerido, vence, orden, nota) values
  ('permiso_sct',        'Permiso SCT de autotransporte federal', 'carrier', true,  true,  10, 'Confirmar con el abogado la modalidad exacta que aplica.'),
  ('poliza_rc',          'Poliza de responsabilidad civil',       'carrier', true,  true,  20, null),
  ('poliza_carga',       'Poliza de carga',                       'carrier', true,  true,  30, 'Puede venir en la misma poliza que RC.'),
  ('constancia_fiscal',  'Constancia de situacion fiscal',        'carrier', true,  false, 40, null),
  ('acta_constitutiva',  'Acta constitutiva',                     'carrier', false, false, 50, 'Solo si es persona moral.'),
  ('tarjeta_circulacion','Tarjeta de circulacion',                'vehicle', true,  true,  10, null),
  ('verificacion_fisico','Verificacion fisico-mecanica',          'vehicle', true,  true,  20, null),
  ('licencia_federal',   'Licencia federal de conductor',         'driver',  true,  true,  10, null),
  ('ine',                'Identificacion oficial',                'driver',  true,  false, 20, null);


create type public.estatus_documento as enum ('pendiente', 'aprobado', 'rechazado');

create table public.carrier_documents (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null references public.document_types(clave),
  -- Exactamente uno de los tres. Se usan llaves foraneas de verdad y no un
  -- owner_id generico para que la base no permita un expediente huerfano.
  carrier_id  uuid references public.carriers(id) on delete cascade,
  vehicle_id  uuid references public.vehicles(id) on delete cascade,
  driver_id   uuid references public.drivers(id) on delete cascade,
  storage_path text,
  vence_el    date,
  estatus     public.estatus_documento not null default 'pendiente',
  motivo_rechazo text,
  revisado_por uuid references auth.users(id),
  revisado_en timestamptz,
  created_at  timestamptz not null default now(),
  constraint carrier_documents_un_solo_dueno check (
    (carrier_id is not null)::int + (vehicle_id is not null)::int + (driver_id is not null)::int = 1
  )
);

create index carrier_documents_carrier_idx on public.carrier_documents (carrier_id);
create index carrier_documents_vehicle_idx on public.carrier_documents (vehicle_id);
create index carrier_documents_driver_idx  on public.carrier_documents (driver_id);
create index carrier_documents_vence_idx   on public.carrier_documents (vence_el)
  where estatus = 'aprobado';

comment on table public.carrier_documents is
  'Expediente documental. vence_el es lo que convierte esto en un control real y no en un archivero.';


-- Los envios podran apuntar a las entidades reales. Se dejan nulas para no
-- romper los envios que ya existen ni el RPC asignar_unidad actual.
alter table public.shipments
  add column if not exists carrier_id uuid references public.carriers(id),
  add column if not exists vehicle_id uuid references public.vehicles(id),
  add column if not exists driver_id  uuid references public.drivers(id);


-- RLS: por ahora esto es territorio del operador. No hay login de
-- transportista todavia; cuando lo haya, se agrega una politica que filtre
-- por carriers.user_id.
alter table public.carriers          enable row level security;
alter table public.vehicles          enable row level security;
alter table public.drivers           enable row level security;
alter table public.carrier_documents enable row level security;
alter table public.document_types    enable row level security;

create policy "carriers: solo el operador"
  on public.carriers for select using ((select public.es_operador()));
create policy "vehicles: solo el operador"
  on public.vehicles for select using ((select public.es_operador()));
create policy "drivers: solo el operador"
  on public.drivers for select using ((select public.es_operador()));
create policy "carrier_documents: solo el operador"
  on public.carrier_documents for select using ((select public.es_operador()));
create policy "document_types: cualquiera autenticado los lee"
  on public.document_types for select using (auth.uid() is not null);
