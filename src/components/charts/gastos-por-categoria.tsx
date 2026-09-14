'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { BalaoDeDica, EIXO, LinhaDeDica, MARCA, SemDados, VIZ } from '@/components/charts/base';
import { money, percent } from '@/lib/format';
import type { CategorySlice } from '@/lib/types';

/**
 * Gasto por categoria.
 *
 * Barras horizontais e não pizza: o trabalho do leitor aqui é comparar
 * magnitudes, e comparar comprimento é muito mais preciso que comparar ângulo.
 * Nomes longos como "Manutenção e Conservação" também cabem no eixo.
 *
 * Uma cor só, porque a identidade de cada barra vem do rótulo ao lado — cor
 * categórica aqui não carregaria informação nenhuma e só cansaria a vista.
 */
export function GastosPorCategoria({ dados }: { dados: CategorySlice[] }) {
  if (dados.length === 0) {
    return <SemDados>Nenhuma despesa lançada no período.</SemDados>;
  }

  const total = dados.reduce((soma, fatia) => soma + fatia.amount, 0);

  // Já vem ordenado da API, mas ordenar aqui deixa o componente independente.
  const fatias = [...dados].sort((a, b) => b.amount - a.amount);

  return (
    <div style={{ height: Math.max(200, fatias.length * 42 + 40) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={fatias}
          layout="vertical"
          // Margem à direita reservada para o rótulo na ponta da barra:
          // apertada, o maior valor quebra em duas linhas e encavala.
          margin={{ top: 4, right: 132, bottom: 4, left: 4 }}
          barCategoryGap={MARCA.vaoEntreBarras * 4}
        >
          <CartesianGrid horizontal={false} stroke={VIZ.grade} strokeWidth={1} />

          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={168}
            interval={0}
            {...EIXO}
            tick={{ ...EIXO.tick, fontSize: 12 }}
          />

          <Tooltip
            cursor={{ fill: VIZ.grade, fillOpacity: 0.4 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const fatia = payload[0].payload as CategorySlice;

              return (
                <BalaoDeDica titulo={`${fatia.code} · ${fatia.name}`}>
                  <LinhaDeDica cor={VIZ.serie1} rotulo="Gasto" valor={money(fatia.amount)} />
                  <LinhaDeDica rotulo="Do total" valor={percent(fatia.share)} />
                  <LinhaDeDica rotulo="Lançamentos" valor={fatia.entryCount} />
                </BalaoDeDica>
              );
            }}
          />

          <Bar
            dataKey="amount"
            fill={VIZ.serie1}
            // Ponta arredondada, base quadrada na linha de origem.
            radius={[0, 4, 4, 0]}
            maxBarSize={MARCA.espessuraMaximaDaBarra}
            isAnimationActive={false}
          >
            {fatias.map((fatia) => (
              <Cell key={fatia.code} />
            ))}

            {/* Rótulo na ponta da barra: evita o leitor ter que voltar ao eixo. */}
            <LabelList
              dataKey="amount"
              position="right"
              offset={8}
              className="tabular"
              fill="var(--color-ink-muted)"
              fontSize={11}
              formatter={(valor: unknown) => {
                // O Recharts 3 tipa o rótulo de forma ampla; estreitamos aqui.
                const numero = typeof valor === 'number' ? valor : Number(valor);
                if (!Number.isFinite(numero)) return '';

                return total > 0
                  ? `${money(numero)} · ${percent(numero / total, 0)}`
                  : money(numero);
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
