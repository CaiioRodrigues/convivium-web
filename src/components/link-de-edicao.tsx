import Link from 'next/link';

/**
 * Abre o formulario do topo preenchido com o registro da linha.
 *
 * O formulario fica no topo, e nao dentro da linha, porque ele tem oito campos
 * e a tabela ja rola de lado no celular. A ancora leva a pessoa ate ele; o `?`
 * na URL faz o estado da edicao viver no endereco, entao voltar, recarregar ou
 * mandar o link para outra pessoa continua funcionando.
 */
export function LinkDeEdicao({ href, rotulo }: { href: string; rotulo: string }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-brand hover:underline"
      aria-label={rotulo}
    >
      Editar
    </Link>
  );
}

/** Sai da edicao voltando para a mesma tela sem o parametro. */
export function LinkDeCancelar({ href }: { href: string }) {
  return (
    <Link href={href} className="text-sm font-medium text-ink-muted hover:underline">
      Cancelar
    </Link>
  );
}
