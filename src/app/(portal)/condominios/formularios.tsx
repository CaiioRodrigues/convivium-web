'use client';

import { useActionState } from 'react';

import {
  criarCondominio,
  gerarDemonstracao,
  type ResultadoDaPlataforma,
} from '@/lib/actions/plataforma';
import { Alert, Button, Field, Input } from '@/components/ui';

const VAZIO: ResultadoDaPlataforma = {};

export function FormularioDeCondominio() {
  const [estado, acao, salvando] = useActionState(criarCondominio, VAZIO);
  // Volta com o que foi digitado quando a gravação falha.
  const digitado = estado.valores ?? {};

  return (
    <form action={acao} className="grid gap-4 sm:grid-cols-6">
      <div className="sm:col-span-4">
        <Field label="Nome do condomínio">
          <Input name="nome" defaultValue={digitado.nome} required placeholder="Edifício Solar" />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="CNPJ" hint="Opcional; conferido pelo dígito verificador">
          <Input name="cnpj" defaultValue={digitado.cnpj} placeholder="00.000.000/0000-00" />
        </Field>
      </div>

      <div className="sm:col-span-4">
        <Field label="Cidade" hint="Entra no QR Code do PIX">
          <Input name="cidade" defaultValue={digitado.cidade} placeholder="Belo Horizonte" />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="UF">
          <Input name="uf" defaultValue={digitado.uf} maxLength={2} placeholder="MG" />
        </Field>
      </div>

      <div className="sm:col-span-3">
        <Field label="Nome do síndico">
          <Input name="sindico" defaultValue={digitado.sindico} required />
        </Field>
      </div>

      <div className="sm:col-span-3">
        <Field label="E-mail do síndico" hint="É por ele que sai o convite de acesso">
          <Input name="email" type="email" defaultValue={digitado.email} required />
        </Field>
      </div>

      <div className="sm:col-span-6">
        <Button type="submit" disabled={salvando}>
          {salvando ? 'Criando…' : 'Criar condomínio'}
        </Button>

        {estado.erro ? (
          <div className="mt-3">
            <Alert tone="negative">{estado.erro}</Alert>
          </div>
        ) : null}

        {estado.sucesso ? (
          <div className="mt-3 space-y-2">
            <Alert tone="positive">{estado.sucesso}</Alert>

            {estado.convite ? (
              <div className="rounded-lg border border-line bg-surface-muted p-3">
                <p className="mb-1 text-xs font-medium text-ink-muted">
                  Link de primeiro acesso — vale 7 dias e só pode ser usado uma vez
                </p>
                <code className="block break-all text-sm text-ink">{estado.convite}</code>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </form>
  );
}

/**
 * Gera o condomínio de demonstração.
 *
 * Fica aqui, e não no boot, para o sistema nascer limpo: quem quer ver as
 * telas com dados dentro pede, em vez de herdar um prédio fictício.
 */
export function BotaoDeDemonstracao() {
  const [estado, acao, gerando] = useActionState(
    async () => gerarDemonstracao(),
    VAZIO,
  );

  return (
    <form action={acao} className="flex flex-wrap items-center gap-3">
      <Button type="submit" variant="ghost" disabled={gerando}>
        {gerando ? 'Gerando…' : 'Gerar condomínio de demonstração'}
      </Button>

      {estado.erro ? (
        <span className="text-sm text-negative" role="alert">
          {estado.erro}
        </span>
      ) : null}

      {estado.sucesso ? (
        <span className="text-sm text-positive" role="status">
          {estado.sucesso}
        </span>
      ) : null}
    </form>
  );
}
