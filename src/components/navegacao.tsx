import Link from 'next/link';

import { canManageCondominium, canManageFinance, canSeeAccounts } from '@/lib/roles';
import type { MembershipRole } from '@/lib/types';

export interface ItemDeMenu {
  href: string;
  rotulo: string;
}

export interface SecaoDeMenu {
  titulo: string | null;
  itens: ItemDeMenu[];
}

/**
 * O menu é montado a partir do papel: um morador não vê sequer o link do
 * caixa. É uma decisão de interface, não de segurança — quem barra o acesso
 * de verdade é a API, que lê o papel de dentro do JWT assinado.
 */
export function menuPara(
  papel: MembershipRole | null,
  superAdmin = false,
): SecaoDeMenu[] {
  const secoes: SecaoDeMenu[] = [];

  if (superAdmin) {
    secoes.push({
      titulo: 'Plataforma',
      itens: [{ href: '/condominios', rotulo: 'Condomínios' }],
    });
  }

  if (canSeeAccounts(papel)) {
    secoes.push({
      titulo: null,
      itens: [
        { href: '/painel', rotulo: 'Painel' },
        // Logo abaixo do painel de proposito: e o primeiro lugar para onde
        // olhar num condominio recem-criado, e some do caminho de quem nao
        // responde pelo predio.
        ...(canManageCondominium(papel)
          ? [{ href: '/roteiro', rotulo: 'Roteiro de teste' }]
          : []),
        { href: '/caixa', rotulo: 'Caixa' },
        { href: '/despesas', rotulo: 'Despesas' },
        { href: '/cobrancas', rotulo: 'Cobranças' },
        // Antes de Cobrancas na leitura, depois na ordem: mede-se durante o
        // mes, fecha-se o rateio no fim.
        ...(canManageCondominium(papel) ? [{ href: '/medicoes', rotulo: 'Medições' }] : []),
        // Fica nesta secao, e nao em Documentos, porque Documentos comeca no
        // subsindico e a prestacao de contas e do conselho fiscal para cima —
        // pedir o balancete a quem se esta auditando nao seria auditoria.
        { href: '/prestacao-de-contas', rotulo: 'Prestação de contas' },
      ],
    });
  }

  if (canManageFinance(papel)) {
    secoes.push({
      titulo: 'Documentos',
      itens: [
        { href: '/faturas', rotulo: 'Faturas' },
        { href: '/notificacoes', rotulo: 'Avisos' },
      ],
    });
  }

  if (canSeeAccounts(papel)) {
    secoes.push({
      titulo: 'Cadastros',
      itens: [
        { href: '/cadastros/unidades', rotulo: 'Unidades' },
        { href: '/cadastros/pessoas', rotulo: 'Pessoas' },
        { href: '/cadastros/fornecedores', rotulo: 'Fornecedores' },
        { href: '/cadastros/condominio', rotulo: 'Condomínio' },
      ],
    });
  }

  secoes.push({
    titulo: secoes.length > 0 ? 'Meu acesso' : null,
    itens: [{ href: '/minhas-cobrancas', rotulo: 'Minhas cobranças' }],
  });

  return secoes;
}

export function LinkDeMenu({ item, ativo }: { item: ItemDeMenu; ativo: boolean }) {
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
