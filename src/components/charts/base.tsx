'use client';

import type { ReactNode } from 'react';

import { cx } from '@/components/ui';

/**
 * Peças comuns aos gráficos.
 *
 * As cores vêm de variáveis CSS (`var(--viz-series-1)`), que o SVG resolve
 * direto: o modo escuro troca sozinho, sem o componente saber que existe tema.
 */

export const VIZ = {
  serie1: 'var(--viz-series-1)',
  serie2: 'var(--viz-series-2)',
  grade: 'var(--viz-grid)',
  eixo: 'var(--viz-axis)',
  superficie: 'var(--viz-surface)',
} as const;

/** Specs fixas do método: linha 2px, marcador ≥8px, barra ≤24px. */
export const MARCA = {
  larguraDaLinha: 2,
  raioDoMarcador: 4,
  anelDaSuperficie: 2,
  espessuraMaximaDaBarra: 24,
  /** Separação entre barras vizinhas é feita por vão na cor da superfície. */
  vaoEntreBarras: 2,
  opacidadeDaArea: 0.1,
} as const;

export const EIXO = {
  tick: { fill: VIZ.eixo, fontSize: 11 },
  axisLine: false,
  tickLine: false,
} as const;

/** Linha de item dentro do balão de dica. */
export function LinhaDeDica({
  cor,
  rotulo,
  valor,
}: {
  cor?: string;
  rotulo: string;
  valor: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <span className="flex items-center gap-1.5 text-ink-muted">
        {cor ? (
          // A identidade vem do marcador colorido ao lado do texto; o texto
          // em si nunca veste a cor da série.
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: cor }}
          />
        ) : null}
        {rotulo}
      </span>
      <span className="tabular font-medium text-ink">{valor}</span>
    </div>
  );
}

export function BalaoDeDica({
  titulo,
  children,
}: {
  titulo?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg">
      {titulo ? <p className="mb-1 font-semibold text-ink">{titulo}</p> : null}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

/**
 * Legenda. Obrigatória a partir de duas séries — a identidade nunca pode
 * depender só da cor. Com uma série só, o título do cartão já diz o que é.
 */
export function Legenda({
  itens,
  className,
}: {
  itens: Array<{ cor: string; rotulo: string }>;
  className?: string;
}) {
  if (itens.length < 2) return null;

  return (
    <ul className={cx('flex flex-wrap items-center gap-x-4 gap-y-1', className)}>
      {itens.map((item) => (
        <li key={item.rotulo} className="flex items-center gap-1.5 text-xs text-ink-muted">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: item.cor }}
          />
          {item.rotulo}
        </li>
      ))}
    </ul>
  );
}

export function SemDados({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-40 items-center justify-center px-4">
      {/* O texto precisa vir dentro de um bloco: solto no flex, cada trecho e
          cada <strong> viram itens separados e a frase quebra em pedaços. */}
      <p className="max-w-xs text-center text-sm text-balance text-ink-muted">{children}</p>
    </div>
  );
}
