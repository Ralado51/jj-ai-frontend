# Diretrizes de UI — JJ AI Platform

## 1. Modelo de aplicação

A interface seguirá o modelo de **dashboard SaaS corporativo**, com navegação lateral, cabeçalho contextual e áreas de trabalho orientadas a dados.

```text
┌──────────────────────────────────────────────┐
│ Sidebar │ Header: busca | alertas | usuário │
│         ├────────────────────────────────────┤
│ Logo    │ Título e ações da página          │
│         │                                    │
│ Dashboard│ Cards, tabelas e formulários      │
│ Projetos │                                    │
│ Docs     │ Conteúdo principal                │
│ Agentes  │                                    │
│ Fluxos   │                                    │
│ Config.  │                                    │
└──────────────────────────────────────────────┘
```

## 2. Navegação principal

Itens previstos:

- Dashboard
- Projetos
- Documentos
- Agentes
- Workflows
- Configurações

A sidebar deve ser recolhível e manter ícones visíveis no estado compacto.

## 3. Layout

- grid de 12 colunas;
- sidebar expandida: 256 px;
- sidebar compacta: 72 px;
- conteúdo máximo: 1440 px;
- espaçamento baseado em múltiplos de 4 px;
- padding padrão de página: 24–32 px;
- mobile-first com adaptação progressiva.

## 4. Componentes

### Botões

- primário: gradiente azul/ciano;
- secundário: superfície escura com borda;
- ghost: transparente;
- destrutivo: vermelho;
- altura padrão: 40 px;
- foco sempre visível;
- ações irreversíveis exigem confirmação.

### Cards

- fundo `surface`;
- borda fina;
- raio de 12 px;
- padding entre 20 e 24 px;
- sombra discreta;
- sem efeito glassmorphism excessivo.

### Inputs

- altura padrão: 40 px;
- label sempre visível;
- placeholder não substitui label;
- estado de erro com mensagem textual;
- foco com borda azul e halo discreto.

### Tabelas

- cabeçalho fixo quando necessário;
- ações por linha em menu contextual;
- estados vazios claros;
- paginação consistente;
- responsividade por ocultação progressiva de colunas.

### Modais e drawers

- modal para confirmações e tarefas curtas;
- drawer lateral para criar ou editar entidades;
- formulários longos devem usar página dedicada.

## 5. Telas iniciais

### Login

- painel de branding à esquerda em desktop;
- formulário à direita;
- logo e tagline;
- fundo navy;
- gradiente e glow discretos;
- versão compacta para mobile.

### Dashboard

Cards previstos:

- projetos ativos;
- usuários;
- documentos;
- agentes;
- workflows executados.

Também deve apresentar atividade recente e atalhos para ações frequentes.

### Projetos

- busca;
- filtro por status;
- botão `Novo projeto`;
- tabela ou cards conforme largura;
- ações de visualizar, editar e excluir;
- interface adaptada às permissões do usuário.

## 6. Estados da interface

Cada tela deve prever:

- carregamento;
- vazio;
- erro;
- sucesso;
- sem permissão;
- desconectado;
- indisponibilidade temporária da API.

## 7. Acessibilidade

- contraste mínimo conforme WCAG AA;
- navegação completa por teclado;
- foco visível;
- labels e descrições acessíveis;
- ícones de ação com texto alternativo;
- não depender apenas de cor para comunicar estado;
- respeitar `prefers-reduced-motion`.

## 8. Movimento

- transições curtas entre 150 e 250 ms;
- evitar animações contínuas;
- feedback de hover e foco discreto;
- skeletons para carregamento de conteúdo;
- animações devem apoiar compreensão, não decoração.

## 9. Responsividade

### Desktop

Sidebar fixa e conteúdo em múltiplas colunas.

### Tablet

Sidebar compacta ou em overlay. Cards em duas colunas.

### Mobile

Menu em drawer, conteúdo em uma coluna e ações prioritárias sempre acessíveis.

## 10. Regras de consistência

- usar tokens do design system, nunca cores avulsas;
- usar Lucide Icons como padrão;
- manter nomenclatura objetiva em português;
- evitar componentes duplicados;
- reutilizar padrões de formulário, tabela e feedback;
- dark mode será o tema padrão; light mode poderá ser adicionado posteriormente.
