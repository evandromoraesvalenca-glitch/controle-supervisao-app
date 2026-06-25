# Checklist Digital de Pré-Abertura - Linha 6

Plataforma web responsiva para checklist operacional de pré-abertura de estações. A interface foi pensada para uso em campo no celular, com botões grandes, salvamento parcial, evidência fotográfica para NOK, resumo antes de finalizar, histórico, dashboard e área administrativa.

## Tecnologias

- Next.js com React e TypeScript
- Tailwind CSS
- Supabase para autenticação, banco, RLS e storage de fotos
- jsPDF para relatório PDF
- Exportação CSV compatível com Excel

## Estrutura

- `src/app`: telas principais da aplicação
- `src/components`: componentes reutilizáveis
- `src/lib`: dados iniciais, utilitários, Supabase e exportadores
- `supabase/schema.sql`: tabelas, tipos, políticas RLS e bucket de fotos
- `supabase/seed.sql`: estações e itens iniciais do checklist
- `.env.example`: variáveis de ambiente necessárias

## Como rodar

1. Instale as dependências:

```bash
npm install
```

2. Copie o arquivo de ambiente:

```bash
cp .env.example .env.local
```

3. Preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

4. No Supabase, execute `supabase/schema.sql` e depois `supabase/seed.sql`.

5. Inicie a aplicação:

```bash
npm run dev
```

## Fluxo de uso

1. Login simplificado por nome, RE e perfil.
2. Escolha da estação por botões grandes.
3. Início da inspeção com data e horário automáticos.
4. Preenchimento por categoria com OK, NOK ou N/A.
5. NOK exige observação e foto.
6. Salvamento parcial permite continuar depois.
7. Resumo mostra totais, pendências e itens NOK.
8. Finalização trava a inspeção para usuários comuns.
9. Histórico permite filtros, PDF, impressão e exportação para Excel.
10. Dashboard consolida indicadores operacionais.

## Observações de integração Supabase

A interface funciona em modo local para demonstração, usando o armazenamento do navegador. Para produção, conecte as operações aos métodos do Supabase em `src/lib/supabase.ts`, mantendo as tabelas do script SQL.

As políticas RLS criadas cobrem:

- usuário autenticado e ativo visualiza dados;
- supervisor cria e edita inspeções não finalizadas;
- administrador edita tudo e reabre inspeções;
- consulta apenas visualiza histórico e dashboard;
- NOK exige observação e evidência fotográfica no banco.

## Próximos passos recomendados

- Conectar as operações CRUD da tela administrativa diretamente ao Supabase.
- Subir fotos para o bucket `inspecao-fotos` em vez de manter apenas nomes no modo demo.
- Criar convites de usuários pelo painel do Supabase Auth.
- Adicionar filtros por estação vinculada ao supervisor, se a operação exigir segregação por local.
