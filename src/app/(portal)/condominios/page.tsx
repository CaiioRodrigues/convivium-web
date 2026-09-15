import type { Metadata } from 'next';

import { api } from '@/lib/api';
import { requirePlatformAccess } from '@/lib/dal';
import { count, document as formatarDocumento } from '@/lib/format';
import { CabecalhoDePagina } from '@/components/cabecalho-de-pagina';
import { Badge, Card, CardHeader, EmptyState, Table, Td, Th } from '@/components/ui';
import {
  BotaoDeDemonstracao,
  FormularioDeCondominio,
} from '@/app/(portal)/condominios/formularios';

export const metadata: Metadata = { title: 'Condomínios' };

/**
 * Hub de quem administra a plataforma.
 *
 * É a única tela acima do condomínio: aqui os prédios são criados e cada um
 * ganha seu síndico, que a partir daí cuida das unidades e das pessoas dele.
 */
export default async function PaginaDeCondominios() {
  await requirePlatformAccess();

  const condominios = await api.platform.list();
  const semSindico = condominios.filter((c) => c.managerPending).length;

  return (
    <>
      <CabecalhoDePagina
        titulo="Condomínios"
        descricao="Cada condomínio tem seu próprio caixa, suas unidades e seu síndico"
      />

      <Card className="mb-6">
        <CardHeader
          title="Novo condomínio"
          description="O síndico é nomeado junto e recebe um convite para escolher a senha"
        />
        <div className="p-4">
          <FormularioDeCondominio />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Cadastrados"
          description={
            semSindico > 0
              ? `${count(semSindico)} com convite de síndico ainda pendente`
              : undefined
          }
        />

        {condominios.length === 0 ? (
          <EmptyState
            title="Nenhum condomínio ainda"
            description="Crie o primeiro acima. Para só conhecer as telas, gere o de demonstração."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Condomínio</Th>
                <Th>Síndico</Th>
                <Th numeric>Unidades</Th>
                <Th numeric>Pessoas</Th>
              </tr>
            </thead>
            <tbody>
              {condominios.map((condominio) => (
                <tr key={condominio.id}>
                  <Td>
                    <span className="font-medium">{condominio.name}</span>
                    <span className="block text-xs text-ink-subtle">
                      {[
                        condominio.city || null,
                        condominio.cnpj ? formatarDocumento(condominio.cnpj) : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'sem endereço nem CNPJ'}
                    </span>
                  </Td>
                  <Td>
                    {condominio.managerName ? (
                      <>
                        <span>{condominio.managerName}</span>
                        {condominio.managerPending ? (
                          <Badge tone="info" className="ml-2">
                            convite pendente
                          </Badge>
                        ) : null}
                        <span className="block text-xs text-ink-subtle">
                          {condominio.managerEmail}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-warning">sem síndico</span>
                    )}
                  </Td>
                  <Td numeric className="text-ink-muted">
                    {condominio.unitCount}
                  </Td>
                  <Td numeric className="text-ink-muted">
                    {condominio.personCount}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <div className="mt-6">
        <BotaoDeDemonstracao />
        <p className="mt-2 text-xs text-ink-subtle">
          Cria o Residencial Convivium com 24 unidades e seis meses de histórico, para ver as
          telas com conteúdo sem mexer nos dados de verdade. Chamar de novo não duplica.
        </p>
      </div>
    </>
  );
}
