# CRM Pessoal

Ferramenta pessoal de prospecção (hotéis, pousadas, resorts). React + Vite + Styled Components + Supabase.

## Setup

1. Copie `.env.example` para `.env` e preencha as chaves do Supabase.
2. No Supabase SQL Editor, execute `supabase/schema.sql`.
3. Em Authentication → Providers, mantenha Email habilitado. Para uso pessoal, pode desativar “Confirm email”.
4. Instale e rode:

```bash
npm install
npm run dev
```

## Telas

- Login
- Dashboard (+ Próximo Cliente)
- Clientes (CRUD, busca, filtros, CSV)
- Detalhes do Cliente (WhatsApp, email, status, follow-up, histórico)
- Modo Prospecção
- Modelos de Mensagem (`{cliente}`, `{cidade}`, `{responsavel}`)
- Configurações + estatísticas
