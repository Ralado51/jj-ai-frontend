# Arquitetura inicial — JJ AI Frontend

## 1. Objetivo

Construir o frontend oficial da JJ AI Platform com arquitetura modular, autenticação JWT, controle de acesso por função e integração com a API existente.

## 2. Stack planejada

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod
- Axios
- Lucide Icons
- next-themes

## 3. API

URL de produção planejada:

```text
https://api.jjnetwork.com.br
```

A URL deve ser configurada por variável de ambiente:

```env
NEXT_PUBLIC_API_URL=https://api.jjnetwork.com.br
```

## 4. Estrutura sugerida

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── documents/
│   │   ├── agents/
│   │   ├── workflows/
│   │   └── settings/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   ├── forms/
│   ├── feedback/
│   └── projects/
├── hooks/
├── lib/
├── providers/
├── services/
│   ├── api.ts
│   ├── auth.ts
│   └── projects.ts
├── types/
└── styles/
```

## 5. Primeira entrega funcional

### Autenticação

- cadastro;
- login;
- logout;
- recuperação do usuário atual;
- proteção de rotas;
- tratamento de sessão expirada.

### Projetos

- listar;
- visualizar;
- criar;
- editar;
- excluir conforme permissão.

### RBAC visual

- `admin`: leitura, criação, edição e exclusão;
- `member`: leitura, criação e edição;
- `viewer`: somente leitura.

A API continua sendo a fonte final de autorização. A interface deve apenas ocultar ou desabilitar ações incompatíveis com o perfil.

## 6. Estratégia de dados

- TanStack Query para cache e sincronização com API;
- Axios para cliente HTTP;
- Zod para validação de respostas e formulários;
- React Hook Form para formulários;
- chaves de consulta centralizadas;
- invalidação após mutações.

## 7. Autenticação

A implementação deverá priorizar cookies seguros quando a arquitetura permitir. Não armazenar dados sensíveis desnecessariamente no navegador.

O cliente HTTP deve:

- enviar o token nas requisições protegidas;
- tratar `401` como sessão expirada;
- tratar `403` como permissão insuficiente;
- padronizar mensagens de erro;
- evitar exposição de detalhes internos da API.

## 8. Design system

Os tokens definidos em `docs/brand-kit.md` devem ser implementados como variáveis CSS e mapeados no Tailwind.

Componentes devem partir do shadcn/ui, adaptados à identidade AI Premium.

## 9. Qualidade

- TypeScript em modo estrito;
- ESLint;
- formatação consistente;
- componentes pequenos e reutilizáveis;
- tratamento explícito de loading, erro e vazio;
- acessibilidade mínima WCAG AA;
- sem segredos versionados.

## 10. Deploy

O frontend deve ser preparado para deploy independente do backend, inicialmente por uma das opções:

- Vercel;
- Docker + Portainer + Traefik.

A decisão de hospedagem não deve ficar acoplada à camada de interface.
