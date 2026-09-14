'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { BalaoDeDica, EIXO, LinhaDeDica, MARCA, SemDados, VIZ } from '@/components/charts/base';
import { competenceLabel, money } from '@/lib/format';
import type { MonthlyPoint } from '@/lib/types';

/**
 * Saldo de caixa ao final de cada mês.
 *
 * Série única: sem caixa de legenda, porque só existe uma cor e o título do
 * cartão já diz o que está plotado.
 */
export function SaldoMensal({ dados }: { dados: MonthlyPoint[] }) {
  if (dados.length === 0) {
    return <SemDados>Sem movimento no período.</SemDados>;
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dados} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
          <defs>
            <linearGradient id="gradiente-saldo" x1="0" y1="0" x2="0" y2="1">
              {/* Lavagem leve, nunca um bloco saturado. */}
              <stop offset="0%" stopColor={VIZ.serie1} stopOpacity={MARCA.opacidadeDaArea * 2} />
              <stop offset="100%" stopColor={VIZ.serie1} stopOpacity={0} />
            </linearGradient>
          </defs>

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
            cursor={{ stroke: VIZ.eixo, strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const ponto = payload[0].payload as MonthlyPoint;

              return (
                <BalaoDeDica titulo={competenceLabel(String(label))}>
                  <LinhaDeDica
                    cor={VIZ.serie1}
                    rotulo="Saldo no fim do mês"
                    valor={money(ponto.closingBalance)}
                  />
                  <LinhaDeDica
                    rotulo="Resultado do mês"
                    valor={`${ponto.result >= 0 ? '+' : '−'} ${money(Math.abs(ponto.result))}`}
                  />
                </BalaoDeDica>
              );
            }}
          />

          <Area
            type="monotone"
            dataKey="closingBalance"
            stroke={VIZ.serie1}
            strokeWidth={MARCA.larguraDaLinha}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#gradiente-saldo)"
            isAnimationActive={false}
            // Anel na cor da superfície mantém o ponto legível onde cruza a linha.
            activeDot={{
              r: MARCA.raioDoMarcador,
              fill: VIZ.serie1,
              stroke: VIZ.superficie,
              strokeWidth: MARCA.anelDaSuperficie,
            }}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
