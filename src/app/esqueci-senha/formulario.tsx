'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { esqueciSenha, type EsqueciSenhaState } from '@/lib/actions/auth';
import { Alert, Button, Field, Input } from '@/components/ui';

const ESTADO_INICIAL: EsqueciSenhaState = {};

export function FormularioDeEsqueciSenha() {
  const [estado, acao, enviando] = useActionState(esqueciSenha, ESTADO_INICIAL);

  if (estado.enviado) {
    return (
      <div className="space-y-4">
        <Alert tone="positive" title="Confira seu e-mail">
          Se {estado.email} estiver cadastrado, o link de redefinição já está a caminho. Ele vale
          por 1 hora e só pode ser usado uma vez.
        </Alert>

        <p className="text-xs text-ink-subtle">
          Não chegou? Veja a caixa de spam. Se o e-mail não for o do seu cadastro, nada é enviado —
          nesse caso, peça ao síndico.
        </p>

        <Link
          href="/entrar"
          className="block text-center text-sm font-medium text-brand hover:underline"
        >
          Voltar para a entrada
        </Link>
      </div>
    );
  }

  return (
    <form action={acao} className="space-y-4">
      <Field label="E-mail" hint="O mesmo que você usa para entrar">
        <Input
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          placeholder="voce@exemplo.com"
          defaultValue={estado.email}
        />
      </Field>

      {estado.erro ? <Alert tone="negative">{estado.erro}</Alert> : null}

      <Button type="submit" disabled={enviando} className="w-full">
        {enviando ? 'Enviando…' : 'Enviar link de redefinição'}
      </Button>

      <Link
        href="/entrar"
        className="block text-center text-sm text-ink-muted hover:text-ink hover:underline"
      >
        Lembrei a senha, voltar
      </Link>
    </form>
  );
}
