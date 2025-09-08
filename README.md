# Bulk Message Sender

Projeto inicial baseado nas diretrizes de `SOFTWARE.md`.

## Rodando localmente

1. Copie o arquivo `.env.example` para `.env` e ajuste valores.
2. Suba os containers:

```bash
docker compose up -d --build
```

3. Execute migrações e seed:

```bash
docker compose exec web npx prisma migrate dev --name init
docker compose exec web npm run seed
```

4. Acesse http://localhost:3000/login com as credenciais admin do `.env`.

## Próximos Passos

- Implementar criação de sessão (upload CSV, mapeamento de variáveis).
- Paginação de templates via API Twilio Content.
- Tela de configurações (marcas, credenciais Twilio).
- Clonar sessão existente.
- Processamento de disparos em worker / fila (avaliar BullMQ).
- Validações com Zod.

## Estrutura Atual (resumida)

```
prisma/
  schema.prisma
  seed.ts
src/
  app/
    api/auth/[...nextauth]/route.ts
    login/page.tsx
    layout.tsx
    page.tsx
    (protected)/sessions/page.tsx
  lib/
    prisma.ts
  services/
    twilio.ts
```
