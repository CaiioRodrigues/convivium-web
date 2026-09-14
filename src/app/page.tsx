import { redirect } from 'next/navigation';

import { getSession } from '@/lib/dal';
import { canSeeAccounts } from '@/lib/roles';

/**
 * A raiz decide para onde a pessoa vai: síndico e conselho caem no painel,
 * morador cai direto nas próprias cobranças.
 */
export default async function Raiz() {
  const sessao = await getSession();

  if (!sessao) {
    redirect('/entrar');
  }

  redirect(canSeeAccounts(sessao.activeRole) ? '/painel' : '/minhas-cobrancas');
}
