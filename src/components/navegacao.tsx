import Link from 'next/link';

import { canManageFinance, canSeeAccounts } from '@/lib/roles';
import type { MembershipRole } from '@/lib/types';

export interface ItemDeMenu {
  href: string;
  rotulo: string;
  descricao: string;
}

/**
 * O menu e montado a partir do papel: um morador nao ve sequer o link do
 * caixa. E uma decisao de interface, nao de seguranca — quem barra o acesso
 * de verdade e a API, que le o papel de dentro do JWT assinado.
 */
export function menuPara(papel: MembershipRole | null): ItemDeMenu[] {
  const itens: ItemDeMenu[] = [];

  if (canSeeAccounts(papel)) {
    itens.push(
      { href: '/painel', rotulo: 'Painel', descricao: 'Visão geral do condomínio' },
      { href: '/caixa', rotulo: 'Caixa', descricao: 'Saldo, extrato e lançamentos' },
      { href: '/despesas', rotulo: 'Despesas', descricao: 'Contas a pagar' },
      { href: '/cobrancas', rotulo: 'Cobranças', descricao: 'Rateio e inadimplência' },
    );
  }

  if (canManageFinance(papel)) {
    itens.push(
      { href: '/faturas', rotulo: 'Faturas', descricao: 'Contas de concessionária em PDF' },
      { href: '/notificacoes', rotulo: 'Avisos', descricao: 'E-mails enviados aos moradores' },
    );
  }

  itens.push({
    href: '/minhas-cobrancas',
    rotulo: 'Minhas cobranças',
    descricao: 'Seus boletos',
  });

  return itens;
}

export function LinkDeMenu({
  item,
  ativo,
}: {
  item: ItemDeMenu;
  ativo: boolean;
}) {
  return (
    <Link
      href={item.href}
      aria-current={ativo ? 'page' : undefined}
      className={
        ativo
          ? 'block rounded-lg bg-brand-soft px-3 py-2 text-sm font-medium text-brand'
          : 'block rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink'
      }
    >
      {item.rotulo}
    </Link>
  );
}
