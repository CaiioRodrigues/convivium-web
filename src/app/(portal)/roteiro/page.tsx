import type { Metadata } from 'next';
import Link from 'next/link';

import { api } from '@/lib/api';
import { requireCondominiumManagement } from '@/lib/dal';
import { competenceLabel, count, currentCompetence } from '@/lib/format';
import { CabecalhoDePagina } from '@/components/cabecalho-de-pagina';
import { Alert, Badge, Card, CardHeader, cx, type Tone } from '@/components/ui';
import {
  concluidos,
  montarRoteiro,
  passoAtual,
  type Passo,
  type Situacao,
} from '@/app/(portal)/roteiro/passos';

export const metadata: Metadata = { title: 'Roteiro de teste' };

const APARENCIA: Record<Situacao, { tone: Tone; rotulo: string; marcador: string }> = {
  feito: { tone: 'positive', rotulo: 'feito', marcador: 'bg-positive-soft text-positive' },
  atencao: { tone: 'warning', rotulo: 'confira', marcador: 'bg-warning-soft text-warning' },
  pendente: { tone: 'neutral', rotulo: 'falta fazer', marcador: 'bg-surface-muted text-ink-subtle' },
};

/**
 * Teste guiado do ciclo completo, do cadastro ao boleto enviado.
 *
 * Existe porque a ordem importa e nao e obvia: dificilmente alguem adivinha que
 * a chave PIX precisa estar certa antes de publicar, ou que unidade sem
 * responsavel com e-mail e cobrada mas nao avisada. Cada passo le o estado real
 * da base, entao a tela nunca diz "feito" para algo que nao esta.
 */
export default async function PaginaDoRoteiro() {
  await requireCondominiumManagement();

  const [condominio, pessoas, ciclos, avisos] = await Promise.all([
    api.condominium.get(),
    api.people.list({}),
    api.billing.cycles(),
    // Uma pagina generosa: no comeco a fila e curta, e o que interessa aqui e
    // se o envio ja aconteceu alguma vez, nao a contagem historica exata.
    api.notifications.list({ PageSize: 200 }),
  ]);

  const ciclo = ciclos[0] ?? null;
  const competencia = ciclo?.competence ?? currentCompetence();

  const despesas = await api.expenses.totals({ Competence: competencia });

  const passos = montarRoteiro({
    condominio,
    pessoas,
    ciclo,
    despesas,
    avisosDeCobranca: avisos.items.filter((aviso) => aviso.chargeId !== null),
    competencia,
  });

  const prontos = concluidos(passos);
  const atual = passoAtual(passos);
  const terminou = atual === null;

  return (
    <>
      <CabecalhoDePagina
        titulo="Roteiro de teste"
        descricao={`Do cadastro ao boleto na mão do morador, na ordem — acompanhando ${competenceLabel(competencia)}`}
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">
              {terminou
                ? 'Os sete passos estão fechados'
                : `Passo ${atual} de ${passos.length}: ${passos[atual - 1].titulo}`}
            </p>
            <p className="mt-0.5 text-sm text-ink-muted">
              {terminou
                ? 'Falta a única conferência que o sistema não faz sozinho, no fim da página.'
                : `${count(prontos)} de ${count(passos.length)} concluídos em ${condominio.name}.`}
            </p>
          </div>

          <div
            className="flex shrink-0 gap-1"
            role="img"
            aria-label={`${prontos} de ${passos.length} passos concluídos`}
          >
            {passos.map((passo) => (
              <span
                key={passo.numero}
                className={cx(
                  'h-1.5 w-8 rounded-full',
                  passo.situacao === 'feito'
                    ? 'bg-positive'
                    : passo.situacao === 'atencao'
                      ? 'bg-warning'
                      : 'bg-line',
                )}
              />
            ))}
          </div>
        </div>
      </Card>

      <ol className="space-y-3">
        {passos.map((passo) => (
          <li key={passo.numero}>
            <CartaoDoPasso passo={passo} atual={passo.numero === atual} />
          </li>
        ))}
      </ol>

      <Card className="mt-6">
        <CardHeader
          title="Por último, confira você mesmo"
          description="A única checagem que o sistema não tem como fazer no seu lugar"
        />
        <div className="space-y-3 px-5 pb-5 text-sm text-ink-muted">
          <p>
            Abra o boleto de uma unidade em{' '}
            <Link href="/cobrancas" className="text-brand underline underline-offset-2">
              Cobranças
            </Link>{' '}
            e escaneie o QR Code com o aplicativo do seu banco. <strong>Não pague.</strong> Olhe
            só o que a tela do banco mostra: o nome do recebedor e o valor.
          </p>
          <Alert tone="info">
            Se o nome do recebedor for o do condomínio e o valor bater com o do boleto, o caminho
            do dinheiro está certo. Se vier outro nome, a chave PIX do passo 1 está errada — e
            esse é exatamente o erro que ninguém percebe até o dinheiro sumir.
          </Alert>
        </div>
      </Card>
    </>
  );
}

function CartaoDoPasso({ passo, atual }: { passo: Passo; atual: boolean }) {
  const aparencia = APARENCIA[passo.situacao];

  return (
    <Card className={cx('p-5', atual && 'ring-2 ring-brand')}>
      <div className="flex gap-4">
        <span
          aria-hidden
          className={cx(
            'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
            aparencia.marcador,
          )}
        >
          {passo.situacao === 'feito' ? '✓' : passo.numero}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-ink">{passo.titulo}</h2>
            <Badge tone={aparencia.tone}>{aparencia.rotulo}</Badge>
            {atual ? <Badge tone="brand">você está aqui</Badge> : null}
          </div>

          <p className="mt-2 text-sm text-ink-muted">{passo.oQueFazer}</p>

          <p className="mt-2 text-sm text-ink">
            <span className="text-ink-subtle">Hoje: </span>
            {passo.evidencia}
          </p>

          <p className="mt-2 text-xs text-ink-subtle">{passo.porQue}</p>

          <Link
            href={passo.href}
            className="mt-3 inline-block text-sm font-medium text-brand underline underline-offset-2"
          >
            {passo.acao}
          </Link>
        </div>
      </div>
    </Card>
  );
}
