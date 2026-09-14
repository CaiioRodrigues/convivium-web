'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { BalaoDeDica, EIXO, LinhaDeDica, MARCA, SemDados, VIZ } from '@/components/charts/base';
import { amount, competenceLabel, count, money } from '@/lib/format';
import type { ConsumptionSeries } from '@/lib/types';

/**
 * Consumo da concessionária, montado das faturas lidas em PDF.
 *
 * `connectNulls` fica desligado de propósito: mês sem fatura importada vira
 * buraco na linha, e não um segmento reto ligando dois meses distantes. Um
 * gráfico que inventa o mês que falta esconde justamente o que interessa aqui.
 */
export function Consumo({ serie }: { serie: ConsumptionSeries }) {
  const pontosComLeitura = serie.points.filter((ponto) => ponto.consumption !== null);

  if (pontosComLeitura.length === 0) {
    return (
      <SemDados>
        Nenhuma fatura importada ainda. Envie o PDF em <strong>Faturas</strong> para o consumo
        aparecer aqui.
      </SemDados>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={serie.points} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
          <CartesianGrid vertical={false} stroke={VIZ.grade} strokeWidth={1} />

          <XAxis dataKey="competence" {...EIXO} />
          <YAxis {...EIXO} width={56} tickFormatter={(valor: number) => count(valor)} />

          <Tooltip
            cursor={{ stroke: VIZ.eixo, strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const ponto = payload[0].payload as ConsumptionSeries['points'][number];

              if (ponto.consumption === null) {
                return (
                  <BalaoDeDica titulo={competenceLabel(String(label))}>
                    <LinhaDeDica rotulo="Fatura" valor="não importada" />
                  </BalaoDeDica>
                );
              }

              return (
                <BalaoDeDica titulo={competenceLabel(String(label))}>
                  <LinhaDeDica
                    cor={VIZ.serie1}
                    rotulo="Consumo"
                    valor={`${count(ponto.consumption)} ${ponto.unit}`}
                  />
                  {ponto.amount !== null ? (
                    <LinhaDeDica rotulo="Valor da conta" valor={money(ponto.amount)} />
                  ) : null}
                  {ponto.unitPrice !== null ? (
                    <LinhaDeDica
                      rotulo={`Preço por ${ponto.unit}`}
                      valor={`R$ ${amount(ponto.unitPrice)}`}
                    />
                  ) : null}
                </BalaoDeDica>
              );
            }}
          />

          <Line
            type="monotone"
            dataKey="consumption"
            stroke={VIZ.serie1}
            strokeWidth={MARCA.larguraDaLinha}
            strokeLinecap="round"
            strokeLinejoin="round"
            connectNulls={false}
            isAnimationActive={false}
            dot={{
              r: MARCA.raioDoMarcador,
              fill: VIZ.serie1,
              stroke: VIZ.superficie,
              strokeWidth: MARCA.anelDaSuperficie,
            }}
            activeDot={{
              r: MARCA.raioDoMarcador + 1,
              fill: VIZ.serie1,
              stroke: VIZ.superficie,
              strokeWidth: MARCA.anelDaSuperficie,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
