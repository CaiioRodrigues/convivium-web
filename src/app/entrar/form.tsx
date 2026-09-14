'use client';

import { useActionState } from 'react';

import { entrar, type LoginState } from '@/lib/actions/auth';
import { Alert, Button, Field, Input } from '@/components/ui';

const ESTADO_INICIAL: LoginState = {};

export function FormularioDeEntrada({ destino }: { destino: string }) {
  const [estado, acao, enviando] = useActionState(entrar, ESTADO_INICIAL);

  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="destino" value={destino} />

      <Field label="E-mail">
        <Input
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          placeholder="voce@exemplo.com"
        />
      </Field>

      <Field label="Senha">
        <Input name="senha" type="password" autoComplete="current-password" required />
      </Field>

      {estado.erro ? <Alert tone="negative">{estado.erro}</Alert> : null}

      <Button type="submit" disabled={enviando} className="w-full">
        {enviando ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}
