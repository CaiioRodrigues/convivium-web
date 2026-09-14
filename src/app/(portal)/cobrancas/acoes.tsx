'use client';

import { useActionState } from 'react';

import {
  abrirCiclo,
  enviarAvisosDoCiclo,
  fecharCiclo,
  publicarCiclo,
  type ResultadoDaAcao,
} from '@/lib/actions/financeiro';
import { Alert, Button, Input } from '@/components/ui';

const VAZIO: ResultadoDaAcao = {};

function Mensagem({ estado }: { estado: ResultadoDaAcao }) {
  if (!estado.erro && !estado.sucesso) return null;

  return (
    <div className="mt-3">
      <Alert tone={estado.erro ? 'negative' : 'positive'}>{estado.erro ?? estado.sucesso}</Alert>
    </div>
  );
}

export function AbrirCiclo({ competenciaSugerida }: { competenciaSugerida: string }) {
  const [estado, acao, enviando] = useActionState(abrirCiclo, VAZIO);

  return (
    <div>
      <form action={acao} className="flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Competência</span>
          <Input
            name="competencia"
            defaultValue={competenciaSugerida}
            placeholder="MM/AAAA"
            pattern="\d{2}/\d{4}"
            required
            className="w-36"
          />
        </label>

        <Button type="submit" disabled={enviando}>
          {enviando ? 'Abrindo…' : 'Abrir rateio'}
        </Button>
      </form>

      <Mensagem estado={estado} />
    </div>
  );
}

/**
 * Botões do ciclo. Cada passo é uma ação separada de propósito: fechar
 * congela os valores, publicar libera o acesso do morador e notificar dispara
 * os e-mails. Juntar tudo num botão só tiraria do síndico a chance de
 * conferir o rateio entre um passo e outro.
 */
export function AcoesDoCiclo({
  cicloId,
  status,
}: {
  cicloId: string;
  status: 'Draft' | 'Closed' | 'Published' | 'Cancelled';
}) {
  const [estadoFechar, fechar, fechando] = useActionState(fecharCiclo, VAZIO);
  const [estadoPublicar, publicar, publicando] = useActionState(publicarCiclo, VAZIO);
  const [estadoAvisar, avisar, avisando] = useActionState(enviarAvisosDoCiclo, VAZIO);

  const estado = estadoFechar.erro || estadoFechar.sucesso
    ? estadoFechar
    : estadoPublicar.erro || estadoPublicar.sucesso
      ? estadoPublicar
      : estadoAvisar;

  return (
    <div>
      <div className="flex flex-wrap justify-end gap-2">
        {status === 'Draft' ? (
          <form action={fechar}>
            <input type="hidden" name="cicloId" value={cicloId} />
            <Button type="submit" disabled={fechando} className="py-1.5 text-xs">
              {fechando ? 'Fechando…' : 'Fechar rateio'}
            </Button>
          </form>
        ) : null}

        {status === 'Closed' ? (
          <form action={publicar}>
            <input type="hidden" name="cicloId" value={cicloId} />
            <Button type="submit" disabled={publicando} className="py-1.5 text-xs">
              {publicando ? 'Publicando…' : 'Publicar'}
            </Button>
          </form>
        ) : null}

        {status === 'Published' ? (
          <form action={avisar}>
            <input type="hidden" name="cicloId" value={cicloId} />
            <Button
              type="submit"
              variant="secondary"
              disabled={avisando}
              className="py-1.5 text-xs"
            >
              {avisando ? 'Enfileirando…' : 'Enviar avisos'}
            </Button>
          </form>
        ) : null}
      </div>

      <Mensagem estado={estado} />
    </div>
  );
}
