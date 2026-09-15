'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';

import { definirSenha, type ResultadoDoCadastro } from '@/lib/actions/cadastros';
import { Alert, Button, Field, Input } from '@/components/ui';

const VAZIO: ResultadoDoCadastro = {};
const MINIMO_DE_CARACTERES = 8;

export function FormularioDeSenha({ token }: { token: string }) {
  const [estado, acao, enviando] = useActionState(definirSenha, VAZIO);

  /*
   * Campos controlados de propósito. O React limpa os campos de um formulário
   * não controlado assim que a action termina, então quem errasse a confirmação
   * perderia as duas senhas digitadas e teria de recomeçar — justamente no
   * primeiro acesso, quando a pessoa ainda não tem outra forma de entrar.
   */
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');

  const curta = senha !== '' && senha.length < MINIMO_DE_CARACTERES;
  const divergem = confirmacao !== '' && senha !== confirmacao;

  if (estado.sucesso) {
    return (
      <div className="space-y-4">
        <Alert tone="positive">{estado.sucesso}</Alert>

        <Link
          href="/entrar"
          className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-ink-inverse hover:bg-brand-strong"
        >
          Ir para a tela de entrada
        </Link>
      </div>
    );
  }

  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <Field
        label="Nova senha"
        hint="Pelo menos 8 caracteres"
        error={curta ? 'Ainda faltam caracteres.' : undefined}
      >
        <Input
          name="senha"
          type="password"
          autoComplete="new-password"
          required
          minLength={MINIMO_DE_CARACTERES}
          autoFocus
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
        />
      </Field>

      <Field label="Repita a senha" error={divergem ? 'As duas senhas não são iguais.' : undefined}>
        <Input
          name="confirmacao"
          type="password"
          autoComplete="new-password"
          required
          value={confirmacao}
          onChange={(evento) => setConfirmacao(evento.target.value)}
        />
      </Field>

      {estado.erro ? <Alert tone="negative">{estado.erro}</Alert> : null}

      <Button type="submit" disabled={enviando} className="w-full">
        {enviando ? 'Salvando…' : 'Definir senha'}
      </Button>
    </form>
  );
}
