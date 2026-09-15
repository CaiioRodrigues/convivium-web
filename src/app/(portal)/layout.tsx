import { requireCondominium } from '@/lib/dal';
import { menuPara } from '@/components/navegacao';
import { BarraLateral } from '@/components/barra-lateral';
import { SeletorDeCondominio } from '@/components/seletor-de-condominio';
import { ROLE_LABEL } from '@/lib/roles';
import { sair } from '@/lib/actions/auth';
import { Button } from '@/components/ui';

export default async function LayoutDoPortal({ children }: LayoutProps<'/'>) {
  const sessao = await requireCondominium();
  const secoes = menuPara(sessao.activeRole, sessao.person.isSuperAdmin);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="border-b border-line bg-surface lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex h-full flex-col gap-6 px-4 py-5">
          <div>
            <p className="px-3 text-lg font-semibold tracking-tight text-brand">Convivium</p>
            <div className="mt-3 px-3">
              <SeletorDeCondominio
                condominios={sessao.condominiums}
                ativo={sessao.activeCondominiumId}
              />
            </div>
          </div>

          <div className="flex-1">
            <BarraLateral secoes={secoes} />
          </div>

          <div className="border-t border-line pt-4">
            <p className="truncate px-3 text-sm font-medium text-ink" title={sessao.person.name}>
              {sessao.person.name}
            </p>
            <p className="px-3 text-xs text-ink-subtle">
              {sessao.activeRole ? ROLE_LABEL[sessao.activeRole] : 'Sem papel'}
            </p>

            <form action={sair} className="mt-2">
              <Button type="submit" variant="ghost" className="w-full justify-start px-3">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
