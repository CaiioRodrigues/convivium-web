'use client';

import { usePathname } from 'next/navigation';

import { LinkDeMenu, type SecaoDeMenu } from '@/components/navegacao';

export function BarraLateral({ secoes }: { secoes: SecaoDeMenu[] }) {
  const caminho = usePathname();

  return (
    <nav aria-label="Navegação principal" className="space-y-5">
      {secoes.map((secao, indice) => (
        <div key={secao.titulo ?? `secao-${indice}`} className="space-y-1">
          {secao.titulo ? (
            <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-ink-subtle uppercase">
              {secao.titulo}
            </p>
          ) : null}

          {secao.itens.map((item) => (
            <LinkDeMenu
              key={item.href}
              item={item}
              // Marca ativo também nas subrotas: /faturas/x/texto destaca "Faturas".
              ativo={caminho === item.href || caminho.startsWith(`${item.href}/`)}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}
