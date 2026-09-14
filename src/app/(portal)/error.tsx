'use client';

import { useEffect } from 'react';

import { Alert, Button, Card } from '@/components/ui';

/**
 * Rede de segurança do portal. O caso mais comum é a API fora do ar — dizer
 * isso é muito mais útil que uma tela branca.
 */
export default function ErroDoPortal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="mx-auto mt-10 max-w-lg p-6">
      <h1 className="text-lg font-semibold text-ink">Não foi possível carregar esta página</h1>

      <div className="mt-3">
        <Alert tone="negative">{error.message}</Alert>
      </div>

      <p className="mt-3 text-sm text-ink-muted">
        Se a mensagem fala em conexão recusada, confira se a API está no ar em{' '}
        <code className="font-mono">http://localhost:5080</code>.
      </p>

      <div className="mt-4">
        <Button onClick={reset}>Tentar de novo</Button>
      </div>
    </Card>
  );
}
