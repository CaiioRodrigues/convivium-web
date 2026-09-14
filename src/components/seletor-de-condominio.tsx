'use client';

import { useTransition } from 'react';

import { trocarCondominio } from '@/lib/actions/auth';
import { Select } from '@/components/ui';
import type { CondominiumAccess } from '@/lib/types';

/**
 * Trocar de condominio emite um token novo no servidor. O cliente nao escolhe
 * o que enxerga: se o vinculo nao existir, a API recusa.
 */
export function SeletorDeCondominio({
  condominios,
  ativo,
}: {
  condominios: CondominiumAccess[];
  ativo: string | null;
}) {
  const [trocando, iniciarTroca] = useTransition();

  if (condominios.length <= 1) {
    return (
      <p className="truncate text-sm font-medium text-ink" title={condominios[0]?.name}>
        {condominios[0]?.name ?? 'Sem condomínio'}
      </p>
    );
  }

  return (
    <Select
      aria-label="Condomínio ativo"
      value={ativo ?? ''}
      disabled={trocando}
      onChange={(evento) => {
        const escolhido = evento.target.value;
        iniciarTroca(() => {
          void trocarCondominio(escolhido);
        });
      }}
    >
      {condominios.map((condominio) => (
        <option key={condominio.id} value={condominio.id}>
          {condominio.name}
        </option>
      ))}
    </Select>
  );
}
