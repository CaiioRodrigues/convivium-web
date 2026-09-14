'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  BalaoDeDica,
  EIXO,
  Legenda,
  LinhaDeDica,
  MARCA,
  SemDados,
  VIZ,
} from '@/components/charts/base';
import { competenceLabel, money } from '@/lib/format';
import type { MonthlyPoint } from '@/lib/types';

/**
 * Receita e despesa mês a mês.
 *
 * Duas séries distintas, então aqui a cor é categórica de verdade — e a
 * legenda é obrigatória: quem não distingue as duas cores ainda precisa
 * conseguir ler o gráfico.
 *
 * O saldo acumulado NÃO entra aqui. Ele vive numa escala muito maior
 * (R$ 81 mil contra R$ 25 mil) e resolver isso com um segundo eixo Y seria
 * o erro clássico de gráfico: duas escalas no mesmo desenho deixam qualquer
 * relação entre as linhas ser fabricada pela escolha das escalas. O saldo
 * tem o gráfico dele, logo abaixo, compartilhando o mesmo eixo de tempo.
 */
export function ReceitaDespesa({ dados }: { dados: MonthlyPoint[] }) {
  if (dados.length === 0) {
    return <SemDados>Sem movimento no período.</SemDados>;
  }

  return (
    <div>
      <Legenda
        className="mb-3"
        itens={[
          { cor: VIZ.serie1, rotulo: 'Receita' },
          { cor: VIZ.serie2, rotulo: 'Despesa' },
        ]}
      />

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dados}
            margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
            // Vão de 2px na cor da superfície separando as barras vizinhas.
            barGap={MARCA.vaoEntreBarras}
          >
            <CartesianGrid vertical={false} stroke={VIZ.grade} strokeWidth={1} />

            <XAxis dataKey="competence" {...EIXO} />
            <YAxis
              {...EIXO}
              width={64}
              tickFormatter={(valor: number) =>
                valor >= 1000 ? `${Math.round(valor / 1000)} mil` : String(valor)
              }
            />

            <Tooltip
              cursor={{ fill: VIZ.grade, fillOpacity: 0.4 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const ponto = payload[0].payload as MonthlyPoint;
                const positivo = ponto.result >= 0;

                return (
                  <BalaoDeDica titulo={competenceLabel(String(label))}>
                    <LinhaDeDica cor={VIZ.serie1} rotulo="Receita" valor={money(ponto.revenue)} />
                    <LinhaDeDica cor={VIZ.serie2} rotulo="Despesa" valor={money(ponto.expense)} />
                    <LinhaDeDica
                      rotulo={positivo ? 'Sobrou' : 'Faltou'}
                      valor={money(Math.abs(ponto.result))}
                    />
                  </BalaoDeDica>
                );
              }}
            />

            <Bar
              dataKey="revenue"
              name="Receita"
              fill={VIZ.serie1}
              radius={[4, 4, 0, 0]}
              maxBarSize={MARCA.espessuraMaximaDaBarra}
              isAnimationActive={false}
            />
            <Bar
              dataKey="expense"
              name="Despesa"
              fill={VIZ.serie2}
              radius={[4, 4, 0, 0]}
              maxBarSize={MARCA.espessuraMaximaDaBarra}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
