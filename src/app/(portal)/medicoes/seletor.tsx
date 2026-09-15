'use client';

import { useRouter } from 'next/navigation';

import { Input } from '@/components/ui';

/**
 * Troca a competencia pela URL, para o endereco continuar valendo sozinho.
 *
 * O campo e um "month" nativo porque competencia e mes, e o teclado do celular
 * ja abre no seletor certo.
 */
export function SeletorDeCompetencia({ competencia }: { competencia: string }) {
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
          router.push(`/medicoes?competencia=${novoMes}%2F${novoAno}`);
        }
      }}
      className="w-44"
    />
  );
}
