# Bulk Message Sender

Plataforma para orquestrar disparo em massa de mensagens via Twilio, com gerenciamento de sessões, templates (Twilio Content), variáveis dinâmicas (por contato) e variáveis estáticas (por sessão), controle de marcas (origens / remetentes) e acompanhamento de status de envio.

## Principais Funcionalidades

- Autenticação com papéis (Admin / User) via NextAuth.
- Gestão de usuários e marcas (brands) via rotas protegidas.
- Cadastro de sessões de envio (Session) associadas a Marca e Template.
- Upload de contatos (CSV) para listas vinculadas a uma sessão.
- Mapeamento de variáveis dinâmicas (colunas -> placeholders em template Twilio) e suporte a variáveis estáticas (`SessionStaticVariable`).
- Enfileiramento simples de mensagens e disparo sequencial.
- Upload de mídia (ex: imagens) associada a variáveis estáticas p/ Twilio Content (ex: placeholder numérico).
- Exportação dos resultados de uma sessão (endpoint `/api/sessions/[id]/export`).
- Testes iniciais (Vitest + Testing Library) para regras centrais.

## Arquitetura Resumida

| Camada | Descrição |
|--------|-----------|
| Next.js (App Router) | UI + API Routes |
| Prisma + PostgreSQL | Persistência relacional |
| Twilio SDK / Content API | Envio de mensagens e templates |
| Auth (NextAuth) | Sessões + Roles (ADMIN/USER) |


### Fluxo de uma Sessão
1. Usuário cria sessão vinculando: Brand + Template.
2. Upload CSV cria ContactList + Contacts (armazenando JSON bruto + telefone normalizado).
3. Definem-se mapeamentos: coluna CSV -> variável do template.
4. (Opcional) Faz upload de mídia / define variáveis estáticas (ex: `1 => filename.jpg`).
5. Inicia a sessão: sistema gera OutboundMessages e dispara sequencialmente (futuro: fila).
6. Status de cada envio atualizado (PENDING -> SENT / FAILED).

## Executando Localmente

### 1. Pré-requisitos
- Docker + Docker Compose
- Node.js 18+ (para scripts utilitários / testes locais fora do container)

### 2. Clonar e configurar ambiente
```bash
git clone <repo-url>
cd bulk-message-sender
cp .env.example .env
# Edite .env conforme necessidade (DB, Twilio, Admin etc.)
```

### 3. Subir infraestrutura
```bash
docker compose up -d --build
```

### 4. Aplicar migrações e seed
```bash
docker compose exec web npx prisma migrate dev --name init
docker compose exec web npm run seed
```

Admin padrão (pode ser configurado via variáveis):
- Email: `ADMIN_EMAIL` (default: admin@example.com)
- Senha: `ADMIN_PASSWORD` (default: ChangeMe123!)

### 5. Acessar a aplicação
Abra: http://localhost:3000/login

### 6. Scripts úteis (package.json)
```bash
npm run dev            # Dev server Next.js
npm run build          # Build produção
npm run start          # Start produção
npm run test           # Testes (Vitest)
npm run seed           # Popula admin inicial
npm run prisma:migrate # Migração interativa
npm run prisma:generate

# Docker helpers
npm run web:up | web:down | web:restart
npm run db:up  | db:down  | db:restart
```

## 📄 Licença

Distribuído sob licença MIT. Veja `LICENSE` para detalhes.

