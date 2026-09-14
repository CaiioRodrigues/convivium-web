'use client';

import { usePathname } from 'next/navigation';

import { LinkDeMenu, type ItemDeMenu } from '@/components/navegacao';

export function BarraLateral({ itens }: { itens: ItemDeMenu[] }) {
  const caminho = usePathname();

  return (
    <nav aria-label="Navegação principal" className="space-y-1">
      {itens.map((item) => (
        <LinkDeMenu
          key={item.href}
          item={item}
          // Marca ativo tambem nas subrotas: /cobrancas/abc destaca "Cobranças".
          ativo={caminho === item.href || caminho.startsWith(`${item.href}/`)}
        />
      ))}
    </nav>
  );
}
