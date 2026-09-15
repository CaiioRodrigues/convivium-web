'use client';

import { useRef, useState } from 'react';

interface Props {
  /** Rota que devolve o PNG do boleto. */
  urlDaImagem: string;
  /** Link wa.me com a mensagem pronta. É o que vale quando não há JavaScript. */
  linkDoWhatsApp: string;
  mensagem: string;
  nomeDoArquivo: string;
}

/**
 * Envio do boleto pelo WhatsApp, com a imagem junto.
 *
 * O elemento continua sendo um link para o `wa.me`: sem JavaScript, ou se
 * qualquer coisa aqui falhar, o clique leva à conversa com a mensagem de
 * texto, que é o comportamento que existia antes. O que o script acrescenta é
 * anexar a imagem, e ele só intercepta o clique quando consegue fazer isso.
 *
 * Dois caminhos, porque os sistemas são diferentes:
 *
 * - **Celular**: a bandeja nativa de compartilhamento aceita arquivo. A pessoa
 *   escolhe WhatsApp e a imagem vai anexada, com a mensagem de legenda.
 * - **Computador**: nenhum navegador deixa um site colocar arquivo no WhatsApp
 *   Web. Então baixa a imagem e abre a conversa — falta só arrastar.
 */
export function EnvioComImagem({ urlDaImagem, linkDoWhatsApp, mensagem, nomeDoArquivo }: Props) {
  const [estado, setEstado] = useState<'pronto' | 'preparando' | 'erro'>('pronto');

  /*
   * A imagem começa a ser buscada no apertar do botão, e não no soltar.
   *
   * O Safari do iPhone só aceita `navigator.share` enquanto o gesto da pessoa
   * ainda "vale", e um await no meio do caminho costuma gastar essa validade.
   * Adiantar o pedido faz o await terminar quase na hora, o que salva o caso
   * comum. Quando não salva, cai no mesmo recuo de sempre.
   */
  const imagem = useRef<Promise<Blob> | null>(null);

  function adiantar() {
    imagem.current ??= fetch(urlDaImagem).then(async (resposta) => {
      if (!resposta.ok) throw new Error(await resposta.text());
      return resposta.blob();
    });
  }

  async function aoClicar(evento: React.MouseEvent<HTMLAnchorElement>) {
    // Sem a API de compartilhamento nem suporte a download, deixa o link
    // seguir sozinho: é melhor mandar só o texto do que não mandar nada.
    if (typeof window === 'undefined') return;

    evento.preventDefault();
    setEstado('preparando');
    adiantar();

    try {
      const blob = await imagem.current!;
      const arquivo = new File([blob], nomeDoArquivo, { type: 'image/png' });

      if (navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], text: mensagem });
        setEstado('pronto');
        return;
      }

      baixar(blob, nomeDoArquivo);
      window.open(linkDoWhatsApp, '_blank', 'noopener');
      setEstado('pronto');
    } catch (erro) {
      // Fechar a bandeja de compartilhamento não é erro: é desistir.
      if (erro instanceof DOMException && erro.name === 'AbortError') {
        setEstado('pronto');
        return;
      }

      // Qualquer outra falha — inclusive o Safari recusando o gesto — vira o
      // caminho do computador. A pessoa fica com a imagem e com a conversa
      // aberta, que é o suficiente para terminar o envio na mão.
      try {
        const blob = await imagem.current!;
        baixar(blob, nomeDoArquivo);
        window.open(linkDoWhatsApp, '_blank', 'noopener');
        setEstado('pronto');
      } catch {
        // Nem a imagem saiu. Manda o texto, que é o que ainda funciona.
        window.open(linkDoWhatsApp, '_blank', 'noopener');
        setEstado('erro');
      }
    }
  }

  return (
    <a
      href={linkDoWhatsApp}
      target="_blank"
      rel="noreferrer"
      onPointerDown={adiantar}
      onClick={aoClicar}
      aria-busy={estado === 'preparando'}
      className="text-sm font-medium text-brand hover:underline aria-busy:opacity-60"
      title={
        estado === 'erro'
          ? 'A imagem não veio; a conversa abriu só com o texto'
          : 'Abre o WhatsApp com a imagem do boleto e a mensagem prontas'
      }
    >
      {estado === 'preparando' ? 'Preparando…' : estado === 'erro' ? 'WhatsApp (só texto)' : 'WhatsApp'}
    </a>
  );
}

function baixar(blob: Blob, nome: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = nome;
  link.click();

  // Liberar na hora cancelaria o download em alguns navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
