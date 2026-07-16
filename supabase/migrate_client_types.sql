-- Amplia client_type para CRM de vendas geral (landings/sites/serviços).
-- Execute no SQL Editor do Supabase se o schema já estiver aplicado.

ALTER TYPE public.client_type ADD VALUE IF NOT EXISTS 'empresa';
ALTER TYPE public.client_type ADD VALUE IF NOT EXISTS 'landing';
ALTER TYPE public.client_type ADD VALUE IF NOT EXISTS 'site';

ALTER TABLE public.clients
  ALTER COLUMN type SET DEFAULT 'empresa';
