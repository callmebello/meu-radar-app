# Priva — guia para quem for continuar o projeto

App brasileiro de proteção de identidade digital. Descobre onde os dados da
pessoa vazaram, dá o passo a passo pra resolver, e pede a remoção formal (LGPD)
nas empresas.

No ar em **www.privaapp.com.br** (Vercel).
Repo: `github.com/callmebello/meu-radar-app`

---

## 1. Rodar

```bash
npm install
npm run dev          # vite dev — porta padrão 3000
npm run build
npx tsc --noEmit -p tsconfig.json   # typecheck (sempre roda limpo)
npx eslint <arquivo>                # lint por arquivo, ver ressalva abaixo
```

**Node, não Bun.** O projeto usa npm.

**Ressalva de lint:** `npx eslint src` acusa ~313 erros, quase todos de formatação
Prettier em arquivos antigos que ninguém tocou. **Não rode `--fix` no repo
inteiro** — vira um diff de 300 arquivos que esconde o trabalho real. Lint só os
arquivos que você mexeu.

---

## 2. Branches — leia antes de commitar

| Branch | O que é |
|---|---|
| `main` | o que está na Vercel |
| `versao-quiz` | funil web: landing → quiz pré-scan → paywall Stripe. **Congelado**, é o que rodou os anúncios |
| `versao-app` | **onde o trabalho está acontecendo**. Onboarding de app, paywall duro, sem quiz |

`versao-app` é a branch ativa. O quiz (`src/components/quiz/`) ainda existe no
código mas **não é mais chamado** nessa branch — a intenção é virar app (App
Store / Play), onde questionário de venda antes do produto não passa na
revisão 4.2.

---

## 3. Stack

- **TanStack Start** (SSR) + **TanStack Router** com rotas por arquivo (`src/routes/`)
- **React 19**, **Tailwind v4**, **lucide-react**, shadcn/radix
- **Supabase** — auth + Postgres (`supabase/schema.sql`)
- **Stripe** (web) e **Mercado Pago** (BR) para pagamento
- `createServerFn` do TanStack para tudo que é servidor (`src/lib/api/*.functions.ts`)
- `@react-pdf/renderer` para o relatório e a carta LGPD

---

## 4. Chaves e variáveis de ambiente

**Os valores estão em `.env.local` na raiz (não versionado) e nas env vars da
Vercel.** Nunca commite valores. Abaixo só os nomes e pra que servem.

### Servidor (sem prefixo — nunca vazam pro cliente)

| Variável | Serve pra |
|---|---|
| `SUPABASE_SERVICE_KEY` | service role — escrita admin no Postgres |
| `SUPABASE_URL` | usada no servidor; hoje o código cai no `VITE_SUPABASE_URL` |
| `CPF_SALT` | sal do hash de CPF. **Se mudar, todo CPF hasheado no banco vira lixo** |
| `HIBP_API_KEY` | Have I Been Pwned — a busca de vazamentos |
| `SERPAPI_KEY` | busca de exposição pública. **Teto de 240 buscas/mês** (ver §8) |
| `GITHUB_TOKEN` | busca de credenciais expostas no GitHub |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | pagamento web |
| `STRIPE_PRICE_ESSENCIAL` / `STRIPE_PRICE_PROTECAO` | ids dos preços |
| `STRIPE_PAYMENT_LINK_PROTECAO` | link de pagamento direto |
| `MP_ACCESS_TOKEN` / `MP_ACCESS_TOKEN_TEST` | Mercado Pago |
| `BREVO_SMTP_HOST` / `_PORT` / `_LOGIN` / `_PASS` | envio de e-mail |

### Cliente (`VITE_` — vão pro bundle, só coisa pública)

`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`,
`VITE_MP_PUBLIC_KEY_TEST`, `VITE_MP_SANDBOX_MODE`, e os links de checkout
`VITE_MP_ESSENCIAL_URL`, `VITE_MP_PROTECAO_URL`, `VITE_MP_FAMILIA_URL`,
`VITE_MP_SCORE_URL` (+ variantes `_TEST`).

### ⚠️ Referenciadas no código mas ausentes do `.env.local`

Confira antes de mexer nesses caminhos — podem estar só na Vercel, ou faltando:

`BREVO_API_KEY`, `BREVO_LIST_ID`, `BREVO_SENDER`, `ADMIN_EMAIL`,
`MP_ACCESS_TOKEN` (só a versão `_TEST` está local), `SUPABASE_URL`.

### Analytics (hardcoded em `src/routes/__root.tsx`)

- Meta Pixel `2385387668935752`
- GA4 `G-HYJTLX88D3`
- Microsoft Clarity `xj1u52ffsg`

Os scripts só disparam em `privaapp.com.br` — dev não polui os dados.

---

## 5. Mapa do código

```
src/routes/
  index.tsx          o app inteiro (tabs, scan, paywall). Arquivo grande, é o centro
  relatorio.tsx      relatório de exposição — só diagnóstico, ver §7
  onboarding.tsx     onboarding do app (13 telas)
  inicio.tsx         landing pública
  verificar-link.tsx alvo de compartilhamento (?verificar=…)
  admin/removal.tsx  painel interno pra mover status das remoções
  termos / privacidade / auth.callback

src/components/meu-radar/    o app
  tabs/  RadarTab · ProtecaoTab · AtividadeTab · PerfilTab · FamiliaTab
         ProtecaoTab tem 4 pills: Senhas · Vazamentos · Exposição · Remoção
  PrivaIdCard · IdentityTile · IncidentMode · BottomNav · ScanningOverlay …

src/components/onboarding/   Onboarding.tsx + ui/PhoneMock/FadeOut/ScanMark

src/lib/
  riskScore.ts     ⭐ o score. Determinístico, nunca aleatório
  actions.ts       ⭐ razão de remediações (o que a pessoa marcou como feito)
  removal.ts       ⭐ dificuldade de remoção, levas, passo a passo
  breaches.ts      apresentação dos vazamentos do HIBP
  breachActions.ts o que fazer em cada vazamento
  scoreInputs.ts   fonte única do score (home e relatório não podem divergir)
  nextActions.ts   próximas ações, limitadas ao teto real de pontos
  attribution.ts   first-touch/last-touch (qual narrativa vendeu)
  identity.ts      CPF/e-mail em storage
  privaIdImage.ts  desenha o Priva ID em canvas (PNG e PDF saem daqui)
  security/        link.ts · pix.ts · message.ts · qr.ts · quota.ts
                   ⚠️ 100% no aparelho, zero chamada de rede
  api/*.functions.ts   tudo que é servidor
```

---

## 6. Banco (`supabase/schema.sql`)

`users` · `scans` · `subscriptions` · `api_usage` · `alerts` ·
`lgpd_authorizations` · `removal_requests` · `quiz_answers` · `rate_limits`
(+ função `bump_rate_limit`) · `api_cache`

### 🔴 SQL que talvez nunca foi aplicado em produção

Não confirmei que rodou. **Cheque antes de confiar nessas features:**

1. `rate_limits` + `bump_rate_limit()` + `api_cache` — proteção de custo das APIs
2. Colunas `first_*` / `last_*` de atribuição em `users`
3. `ALTER` em `quiz_answers`

Sem (1), o rate limit **falha aberto** (por design — ver `rate-limit.server.ts`),
ou seja: HIBP e SerpAPI ficam sem teto por IP.

---

## 7. Decisões de produto — não desfaça sem entender

Estas foram discutidas e custaram trabalho. Cada uma tem o porquê no comentário
do arquivo.

**O score é determinístico.** Vinha de `Math.random()` dentro de uma faixa;
duas pessoas com os mesmos achados tinham números diferentes. Hoje sai só de
evidência (`riskScore.ts`). Ele fica logo acima do preço — é o número que
ninguém pode nos pegar inventando.

**Ações creditam o score, e a recuperação tem teto (70%).** Um vazamento que
aconteceu não desacontece. Ordem dos créditos: senha +5, 2FA +6, **apagar conta
+8**, **pedir remoção +10**. Apagar valia 4 (menos que trocar senha), o que
dizia à pessoa que a opção mais fraca era a melhor.

**Remoção tem 4 níveis de dificuldade** (`removal.ts`), ditos **antes da venda**:

| Nível | Exemplo | Prazo | Plano |
|---|---|---|---|
| Direta | LinkedIn, Adobe, Canva | 15 dias úteis | incluído |
| Insistência | empresa sem canal pronto | 30–60 dias | incluído |
| Difícil | broker (Escavador, consulta-CPF) | 60–180 d, sem garantia | **à parte** |
| Sem remoção | combolist, stealer log, Naz.API | — | não existe |

Pedidos saem em **levas de 3, mais fácil primeiro**. A próxima leva só abre
quando a atual responde. Motivo: a operação é manual (8 prazos no mesmo dia =
reembolso), a leva dá notícia na semana 2 e 5 (retenção), e ver 3 pedidos serem
atendidos é o que faz alguém pagar pra escalar o quarto.

Garantimos **o pedido formal, o prazo acompanhado e a prova documentada** —
nunca o resultado. Está escrito no card antes do preço. É a prevenção de
reembolso mais barata que existe.

**O relatório é só diagnóstico.** O que vazou, onde, quando, e o score. As ações
e os pontos moram em **Proteção › Vazamentos**. Já tentamos pôr o plano dentro
do relatório e reverti: é um documento que a pessoa baixa e encaminha, checkbox
de pontuação transforma em lista de tarefas.

**Ordenação em Vazamentos = o que dá pra resolver.** Marcas com canal de
privacidade primeiro, dumps de malware por último. Uma lista que abre com quatro
"Registros de malware" ensina que a tela não tem nada pra pessoa.

**A cota das ferramentas grátis é soft limit, não segurança** (`security/quota.ts`,
está escrito lá). A proteção de custo real é `rate-limit.server.ts`.

**As ferramentas de Atividade (link/Pix/mensagem) não fazem nenhuma chamada de
rede.** Rodam no aparelho. Não introduza uma sem decidir o custo.

**O verificador de senha** usa k-anonymity do HIBP, mas a UI **não diz isso** —
diz "sua senha não sai do aparelho". Jargão técnico não gera confiança em
usuário comum.

---

## 8. 🔴 Bloqueadores e pendências reais

**SerpAPI: 240 buscas/mês no plano atual.** Cada scan gasta 1–2. Isso é
~120–240 scans no mês **inteiro, somando todos os usuários**. Um dia de anúncio
estoura. Decida antes de rodar mídia paga: subir de plano, ou restringir a busca
pública a quem assina. Por isso o onboarding roda **só HIBP** antes do paywall.

**Pagamento não está ligado no `versao-app`.** O botão do paywall só conclui o
onboarding. Falta StoreKit (app) / Stripe (web).

**App Store**, quando for empacotar:
- assinatura digital exige IAP (15–30%)
- guideline 4.2 (minimum functionality) — o quiz de venda antes do produto é risco
- 4.5.4 — permissão de push promocional precisa de consentimento próprio; não dá
  pra pedir "avisos de vazamento" e usar pra marketing
- CDC art. 49 — 7 dias de arrependimento. Reembolso na App Store é da Apple, não
  nosso: **não prometa "sem reembolso"**

**Privacidade / LGPD:**
- `removal_requests` guarda **CPF em texto puro** — único lugar do sistema. A
  política de privacidade não menciona isso
- BigDataCorp entrou em contato pra cruzamento de dados — se integrar, a política
  precisa ser atualizada junto
- `/inicio` não dispara nenhum evento custom; não existe banner de consentimento
- Confirme o modo de masking do Clarity no painel — a pessoa digita CPF no app

**Faltando:**
- `public/mockup-priva-id.png` não existe; o pré-paywall cai no mockup da home
- `TESTIMONIALS` (tela de prova social do onboarding) está **array vazio** —
  esperando depoimentos reais. Não invente nomes/cidades/fotos
- O PDF do relatório (`src/lib/pdf/relatorioTemplate.tsx`) ainda é o modelo
  antigo — não recebeu níveis de remoção nem o plano
- Pills de Proteção **cortam "Remoção" em 390px** com a fonte real do sistema
- A lista `EASY_DOMAINS` / `HARD_DOMAINS` em `removal.ts` foi montada por
  estimativa. Precisa de revisão humana, principalmente os domínios brasileiros

**Arquivos órfãos (zero referências)** — apagar quando der:
`ScoreTab.tsx`, `DarkWebScanTab.tsx`, `UpsellBanner.tsx`, `InviteBlock.tsx`,
`Mascot.tsx`, `ScanNudge.tsx`, e `components/quiz/PreScanQuiz.tsx` (esse só
nesta branch — o `versao-quiz` usa).

---

## 9. Regras de honestidade — inegociáveis

O produto vende segurança. Uma mentira aqui não é bug de UX, é a coisa toda.
Isto foi decidido e reafirmado várias vezes:

- **Nunca inventar vazamento.** Se a API não achou nada, a resposta é "nada
  encontrado". Dizer "encontramos 12" pra quem não tem nenhum, na tela
  imediatamente antes de pedir o cartão, é mentir sobre a segurança da pessoa
- **Nunca inventar depoimento, número de usuários ou "monitoramos 15 mil bases"**
- **Verificado ≠ informado.** O Priva ID marca os dois diferente. Só o e-mail
  pode dizer "verificado" hoje (Supabase confirma). CPF válido prova o **formato**,
  nunca a titularidade
- **Ações são auto-declaradas.** Não temos como conferir se a senha foi trocada
  no site do outro. A copy diz "você marcou", nunca "verificamos" — e tudo é
  reversível
- **Não prometer resultado de remoção.** Prometemos o pedido, o prazo e a prova
- Passos de scan não podem citar trabalho que não fazemos (já teve
  "Verificando CPF na Receita Federal" na tela — removido)

---

## 10. Chaves de storage no cliente

`priva_user_id` · `priva_scan_result` · `priva_exposure` · `priva_profile` ·
`priva_actions` · `priva_checks` · `priva_is_paid` · `priva_has_account` ·
`priva_signed_in` · `priva_plan` · `priva_last_scan_at` · `priva_cpf` ·
`priva_email` · `priva_case_id` · `priva_case_status` · `priva_lgpd_authorized` ·
`priva_open_pill` (handoff do relatório pra um pill de Proteção) · `priva_admin`

O ledger de ações é **local** (`priva_actions`). Espelhar no Supabase é o que
faria o score seguir a pessoa entre aparelhos — ainda não feito.

---

## 11. Preços

`src/lib/checkout.ts` → Essencial **R$ 9,90/mês**, Proteção Total **R$ 24,90/mês**.

O paywall do onboarding usa outros valores (definidos pelo dono do produto):
**Anual R$ 49,90/ano (R$ 4,16/mês), 3 dias grátis** · **Mensal R$ 19,90/mês**.
Se for unificar, alinhe os dois lugares.

---

## 12. Imagens, logos e ícones

### 🔴 Antes de tudo: 3 assets NÃO estão versionados

Um `git clone` deste repo **não traz** estes arquivos. Se a máquina onde eles
estão sumir, eles somem junto.

| Arquivo | Situação |
|---|---|
| `PRIVA COLOR INDIGO PANEL.png` (raiz, 630 KB) | 🔴 **Fonte do logo do PDF.** O base64 em `src/lib/pdf/privaLogo.ts` foi gerado dele. Sem ele não dá pra regerar o logo dos PDFs |
| `Girl Hero LP Priva.png` (raiz, 1,6 MB) | 🔴 arte de hero, sem cópia em `public/` |
| `Hero LP Institucional.png` (raiz, 1,5 MB) | 🔴 arte de hero, sem cópia em `public/` |
| `PRIVA LOGO NO BG.png` (raiz, 1,3 MB) | 🔴 logo sem fundo, sem cópia em `public/` |
| `public/mascot/priva-welcome.png` (1,2 MB) | 🔴 usado por `Welcome.tsx`, que também está fora do git |

Outros 4 PNGs na raiz são **duplicatas exatas** (md5 confere) do que já está em
`public/`, esses podem ser apagados sem perda:
`Dark Theme Logo.png` = `PRIVA_logo_dark_theme.png` ·
`Logo Light Theme.png` = `PRIVA_logo_light_theme.png` ·
`Icone Priva Dark Theme.png` = `PRIVA_icon_dark_theme.png` ·
`Icone Priva Light Theme.png` = `PRIVA_icon_light_theme.png`

**Ação:** commitar os 5 de cima (ou guardar fora do git em lugar seguro) antes
de passar o projeto adiante.

### Marca — `public/`

| Arquivo | Onde aparece |
|---|---|
| `PRIVA_mark.png` | **o mais usado (12 lugares)** — símbolo "P". Botão central da tab bar, `ScanMark`, `NextActionsCard`, sheets, telas da `/inicio` |
| `PRIVA_mark_red.png` | só em `IncidentMark.tsx` — o "P" vermelho do modo emergência |
| `PRIVA_logo_light_theme.png` | wordmark tema claro: `Header`, `DesktopSidebar`, `PrivaIdCard`, `relatorio`, e o canvas do Priva ID (`privaIdImage.ts`) |
| `PRIVA_logo_dark_theme.png` | wordmark tema escuro: os mesmos + `PaymentReturn` + **e-mails transacionais** (`removal.functions.ts`, via URL absoluta `privaapp.com.br`) |
| `PRIVA_wordmark_indigo.png` | só `inicio/ui.tsx` |
| `PRIVA_letter_only_logo.png` | `CPFEntry` e `WelcomeGate` |
| `PRIVA_BLACK_WEB.png` | só `PrivaLogo.tsx` |
| `PRIVA_icon_light_theme.png` · `PRIVA_icon_dark_theme.png` | ⚠️ **zero referências** (641 KB parados) |

### Ícones de app / PWA — `public/`

`favicon.ico` · `favicon-16x16.png` · `favicon-32x32.png` · `favicon-48x48.png`
· `apple-touch-icon.png` (180×180) · `icon-192.png` · `icon-512.png`

Declarados em `src/routes/__root.tsx` (com `?v=2` pra furar cache) e em
`public/site.webmanifest`. O manifest usa `icon-512.png` como `any` **e** como
`maskable` — vale gerar um maskable de verdade, com safe zone, quando for pra
loja. `theme_color` do manifest: `#4F46E5`.

### Fotos e mockups — `public/`

| Arquivo | Onde |
|---|---|
| `hero-inicio.jpg` (120 KB) | hero da landing `/inicio` |
| `paywall-hero.jpg` (58 KB) | foto do topo do paywall do onboarding |
| `mockup-light.png` (333 KB) | `PhoneMock` — fallback padrão |
| `mockup-dark.png` (350 KB) | `PhoneMock` no tema escuro |
| `mockup-priva-id.png` | 🔴 **NÃO EXISTE.** O pré-paywall pede e cai no mockup da home |

### Mascote — `public/mascote/` e `public/mascot/`

Duas pastas, dois momentos diferentes:

- **`public/mascote/`** (versionada) — 5 poses: `acenando` · `analisando` ·
  `confiante` · `pensando` · `sucesso`. Usadas por
  `src/components/onboarding/Mascot.tsx`, que hoje tem **zero referências** — o
  mascote foi tirado do onboarding a pedido. ⚠️ O `Mascot.tsx` ainda pede
  `braco-direito.png` e `pernas.png`, que **não existem** na pasta
- **`public/mascot/`** (não versionada) — `priva-welcome.png`, usada por
  `Welcome.tsx`, que também está fora do git. Trabalho novo, fora do que este
  guia cobre — mas note a colisão de nomes: `mascot/` e `mascote/` são pastas
  diferentes e é fácil errar o caminho

### Ícones de interface

**Não há SVG próprio no projeto.** Toda iconografia vem do
**`lucide-react`** (v0.575), importada por componente.

Dois lugares fogem disso e você precisa saber:

1. **`src/lib/privaIdImage.ts`** — o Priva ID é desenhado em `<canvas>`, então
   os paths do lucide foram **copiados na mão** pro objeto `ICON`:
   `fingerprint` (marca d'água) · `badgeCheck` (Verificado) · `circleCheck`
   (Informado) · `circleDashed` (Vazio) · `sparkles` (selo PRO).
   ⚠️ **Se atualizar o lucide e os paths mudarem, o cartão exportado passa a
   divergir do da tela.** Não há teste pegando isso
2. **`src/lib/pdf/privaLogo.ts`** — logo em base64 embutido, pra o PDF renderizar
   sem tocar em rede nem disco. Regerar com
   `sips -Z 420 "PRIVA COLOR INDIGO PANEL.png"` + `base64`

### Logos de terceiros (remotos, não versionados)

Os logos das empresas nas listas de vazamento vêm do **HIBP**, via o campo
`LogoPath` (`https://logos.haveibeenpwned.com/…`). Lidos em
`logoOf()` (`src/lib/breaches.ts`). Não guardamos nada disso — se o HIBP sair
do ar, os componentes caem na inicial da empresa dentro de um quadrado indigo
(`Initial` em `VazamentosTab`, `Logo` com `onError`).

### Cores da marca

| Uso | Hex |
|---|---|
| Indigo Priva (principal) | `#4F46E5` |
| Indigo claro (gradiente) | `#6366F1` |
| Verde sucesso | `#0FA968` |
| Âmbar atenção | `#F59E0B` |
| Vermelho perigo | `#DC2626` |
| Cinza neutro | `#64748B` |
| Tinta (texto) | `#12121C` |

O gradiente padrão de CTA é `linear-gradient(135deg,#4F46E5,#6366F1)` — repetido
à mão em vários arquivos, nunca virou token.

### Peso total

`public/` tem ~8 MB, quase tudo PNG de logo em resolução alta.
`PRIVA_letter_only_logo.png` sozinho é **1,1 MB** e aparece em duas telas;
`PRIVA_BLACK_WEB.png` é **714 KB** pra um uso só. Converter os logos pra SVG (ou
ao menos WebP) é a otimização mais óbvia que sobrou.
