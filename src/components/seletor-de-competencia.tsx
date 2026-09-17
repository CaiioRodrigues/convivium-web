'use client';

import { useRouter } from 'next/navigation';

import { Input } from '@/components/ui';

/**
 * Troca a competência pela URL, para o endereço continuar valendo sozinho —
 * dá para mandar o link de um mês específico para o conselho.
 *
 * O campo é um `month` nativo porque competência é mês, e o teclado do celular
 * já abre no seletor certo.
 */
export function SeletorDeCompetencia({
  competencia,
  destino,
}: {
  /** No formato brasileiro, "08/2026". */
  competencia: string;
  /** Rota que recebe o parâmetro `competencia`. */
  destino: string;
}) {
  const router = useRouter();

  // "08/2026" <-> "2026-08": o input nativo quer ISO, a API quer o formato
  // brasileiro que aparece em todo o resto do sistema.
  const [mes, ano] = competencia.split('/');

  return (
    <Input
      type="month"
      aria-label="Competência"
      defaultValue={ano && mes ? `${ano}-${mes}` : ''}
      onChange={(evento) => {
        const [novoAno, novoMes] = evento.target.value.split('-');
        if (novoAno && novoMes) {
          router.push(`${destino}?competencia=${novoMes}%2F${novoAno}`);
        }
      }}
      className="w-44"
    />
  );
}
