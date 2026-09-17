# Convivium Web

Portal de gestão de condomínios. É o front da [`convivium-api`](https://github.com/CaiioRodrigues/convivium-api):
síndico e conselho acompanham caixa, rateio e inadimplência; o morador vê os
próprios boletos e paga por PIX.

**Next.js 16** (App Router) · React 19 · Tailwind 4 · Recharts.

---

## Como rodar

**Pré-requisitos:** [Node.js 22+](https://nodejs.org) e pnpm.

O pnpm não vem instalado com o Node, mas o Corepack — que vem — sabe buscar a
versão exata que este projeto fixa no `package.json`:

```bash
corepack enable
```

Se preferir instalar por fora, `npm install -g pnpm` também serve. No Windows,
`corepack enable` pode pedir um terminal de administrador.

A API precisa estar no ar primeiro:

```bash
# No repositório convivium-api
docker compose up -d                         # ou um Postgres proprio, veja o README de la
dotnet run --project src/Convivium.Api      # http://localhost:5080
```

Depois, aqui:

```bash
pnpm install
pnpm dev                                     # http://localhost:3000
```

### Configuração

| Variável | Para quê | Padrão |
|---|---|---|
| `API_BASE_URL` | Endereço do convivium-api | `http://localhost:5080` |

Sem prefixo `NEXT_PUBLIC` de propósito: quem fala com a API é sempre o
servidor do Next, então o endereço nunca vai para o pacote do navegador.

### Acessos de demonstração

Só existem depois de gerar o condomínio de demonstração, no hub em
`/condominios`. A tela de entrada não lista mais nenhum e-mail: num ambiente
de verdade isso era um cardápio de alvos para quem chegasse na página.

Senha para todos: `Convivium@123`

| E-mail | Papel | O que vê |
|---|---|---|
| `sindico@convivium.local` | Síndico | Tudo |
| `conselho@convivium.local` | Conselho | Leitura das contas, sem movimentar |
| `morador@convivium.local` | Morador | Só as próprias cobranças |

Num condomínio novo, quem mostra o caminho é o **roteiro de teste**
(`/roteiro`): ele lê o estado real da base e diz, na ordem, o que ainda falta
para o primeiro boleto sair.

### Comandos

```bash
pnpm dev         # desenvolvimento
pnpm build       # build de produção
pnpm typecheck   # gera os tipos de rota e roda o tsc
pnpm lint        # eslint
```

---

## Colocar no ar

O `Dockerfile` daqui constrói a imagem do portal em modo `standalone`: o build
separa o servidor e só as dependências que o código importa de verdade — 43 MB
em vez dos quase 500 MB do `node_modules`.

A pilha completa (banco, API, portal e proxy com HTTPS) vive no repositório da
API, em `convivium-api/deploy/`. Os dois repositórios precisam estar lado a
lado, porque o `docker compose` de lá constrói a imagem daqui.

## Telas

| Rota | Quem acessa | O que faz |
|---|---|---|
| `/painel` | Conselho ↑ | Saldo, resultado do mês, inadimplência e os gráficos |
| `/roteiro` | Síndico ↑ | Teste guiado do ciclo, do cadastro ao boleto enviado |
| `/caixa` | Conselho ↑ | Contas, saldos e extrato com filtros |
| `/despesas` | Conselho ↑ | Contas a pagar; baixa e estorno para quem pode movimentar |
| `/cobrancas` | Conselho ↑ | Prévia do rateio, ciclos e inadimplência |
| `/faturas` | Subsíndico ↑ | Upload do PDF da concessionária e conferência da leitura |
| `/notificacoes` | Subsíndico ↑ | Fila de e-mails enviados aos moradores |
| `/minhas-cobrancas` | Qualquer morador | Boletos das unidades da pessoa |
| `/boleto/[token]` | **Público** | Boleto aberto pelo link do e-mail, sem login |

---

## Como a sessão funciona

O token de acesso mora num **cookie httpOnly** e nunca no `localStorage`:
nenhum script da página consegue lê-lo, o que fecha a porta mais comum de
roubo de sessão. Toda chamada à API sai do servidor do Next.

A **renovação do token acontece no `proxy.ts`**. Ele é o único ponto que roda
antes da página e pode gravar cookie — um Server Component não consegue
escrever cookie durante o render.

O papel guardado no cookie decide **apenas o que aparece no menu**. Quem
autoriza é a API, que lê o papel de dentro do JWT assinado: adulterar o
cookie muda o menu e não muda permissão nenhuma.

O download de PDF passa por uma rota do Next (`/api/.../pdf`) em vez de ir
direto à API, porque o navegador não tem o token em mãos.

---

## Este Next.js não é o que você decorou

O Next 16 mantém um `AGENTS.md` no repositório avisando que a versão tem
mudanças que não estão no treino de assistentes de código, e aponta para os
guias em `node_modules/next/dist/docs/`. Três coisas mudaram e valem estar à
mão:

- **`middleware` virou `proxy`.** O arquivo é `src/proxy.ts`, a função
  exportada se chama `proxy`, e o runtime edge não é mais suportado ali.
- **`cookies()`, `params` e `searchParams` são assíncronos.** O acesso
  síncrono foi removido de vez.
- **`fetch` não é cacheado por padrão.** Conveniente aqui: saldo e
  inadimplência precisam refletir o estado de agora.

`pnpm typecheck` roda `next typegen` antes do `tsc` — é ele que gera os tipos
`PageProps<'/rota'>` e `LayoutProps<'/rota'>` usados nas páginas.

---

## Os gráficos

A paleta foi **validada por script**, não escolhida no olho. O verde da marca
(`#0f766e`) reprovou no piso de croma — como marca de dado ele lê como cinza —
e por isso ficou restrito à interface. Os gráficos usam `#0ea5a4` com
`#eb6834`, que passam nos seis testes (separação para daltonismo 15,4 contra
um alvo de 8; visão normal 27,8 contra um piso de 15).

O modo escuro tem passos próprios (`#109e8f` e `#df6b33`), revalidados contra
o fundo escuro. Não é a inversão automática do claro: a banda de luminosidade
do escuro é mais estreita e os tons do claro reprovam nela.

Decisões de forma que valem explicar:

- **Gasto por categoria é barra horizontal, não pizza.** O trabalho do leitor
  é comparar magnitudes, e comparar comprimento é mais preciso que comparar
  ângulo. Nomes longos como "Manutenção e Conservação" também cabem.
- **O saldo acumulado tem gráfico próprio**, separado das barras de receita e
  despesa. Juntar os três exigiria um segundo eixo Y, e duas escalas no mesmo
  desenho deixam qualquer relação entre as séries ser fabricada pela escolha
  das escalas.
- **O consumo não liga os pontos por cima de um mês sem fatura.** O buraco na
  linha é a informação.
- **Números de manchete são ladrilhos**, não gráficos de uma barra só.

Os tokens ficam em `src/app/globals.css`; os componentes, em
`src/components/charts/`.

---

## O que ainda não existe

- **Cadastros pela interface**: unidades, moradores e fornecedores ainda são
  criados pela API. A tela é o próximo passo natural.
- **Lançamento manual no caixa** e **cobrança avulsa**: a API já expõe, falta
  o formulário.
- **Reenvio de e-mail que falhou** a partir da tela de avisos.
- **Paginação** nas listas longas: hoje elas carregam as primeiras dezenas.
- **Testes**: a lógica financeira está coberta no lado da API; aqui não há
  suíte ainda.
