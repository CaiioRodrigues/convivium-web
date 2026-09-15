import type { Metadata } from 'next';

import { api } from '@/lib/api';
import { requireCondominiumManagement } from '@/lib/dal';
import { competenceLabel, currentCompetence, money } from '@/lib/format';
import { CabecalhoDePagina } from '@/components/cabecalho-de-pagina';
import { Alert, Card, CardHeader, EmptyState, Stat } from '@/components/ui';
import { FolhaDeLeitura } from '@/app/(portal)/medicoes/formulario';
import { SeletorDeCompetencia } from '@/app/(portal)/medicoes/seletor';

export const metadata: Metadata = { title: 'Medições' };

/**
 * A folha de leitura dos medidores de gas.
 *
 * Existe como tela propria, fora de Cobrancas, porque a leitura acontece em
 * outro momento: alguem desce com a planilha, anota o numero de cada medidor,
 * e so depois — as vezes dias depois — o rateio e fechado. Amarrar as duas
 * coisas obrigaria a abrir a competencia antes de poder medir.
 */
export default async function PaginaDeMedicoes({ searchParams }: PageProps<'/medicoes'>) {
  await requireCondominiumManagement();

  const filtros = await searchParams;
  const competencia =
    typeof filtros.competencia === 'string' ? filtros.competencia : currentCompetence();

  const folha = await api.metering.sheet(competencia);

  return (
    <>
      <CabecalhoDePagina
        titulo="Medições de gás"
        descricao={`Consumo individual de ${competenceLabel(folha.competence)} — cobrado por fora do rateio, de quem gastou`}
        acao={<SeletorDeCompetencia competencia={competencia} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Consumo do mês"
          value={`${folha.totalConsumption.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} m³`}
        />
        <Stat label="A cobrar" value={money(folha.totalAmount)} tone="brand" />
        <Stat
          label="Sem leitura"
          value={folha.pendingCount}
          tone={folha.pendingCount > 0 ? 'warning' : 'positive'}
          hint={
            folha.pendingCount > 0
              ? 'Ficam de fora do boleto até serem lidas'
              : 'Todas as unidades foram lidas'
          }
        />
      </div>

      {!folha.isEditable ? (
        <div className="mb-6">
          <Alert tone="warning" title="Competência já fechada">
            As leituras de {competenceLabel(folha.competence)} já foram para os boletos. Mudá-las
            agora não mudaria o que foi cobrado — se o número estiver errado, cancele o ciclo e
            refaça.
          </Alert>
        </div>
      ) : null}

      <Card>
        <CardHeader
          title="Folha de leitura"
          description="O consumo e o valor aparecem enquanto você digita, para conferir antes de salvar"
        />

        {folha.lines.length === 0 ? (
          <EmptyState
            title="Nenhuma unidade ativa"
            description="Cadastre as unidades antes de lançar as leituras."
          />
        ) : (
          <FolhaDeLeitura key={folha.competence} folha={folha} />
        )}
      </Card>
    </>
  );
}
