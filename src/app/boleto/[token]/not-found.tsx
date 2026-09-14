import { Alert, Card } from '@/components/ui';

export default function BoletoNaoEncontrado() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-16">
      <Card className="p-6 text-center">
        <h1 className="text-lg font-semibold text-ink">Boleto não encontrado</h1>

        <div className="mt-4 text-left">
          <Alert tone="warning">
            O link pode ter sido digitado errado, ou a cobrança foi cancelada. Procure o
            e-mail original ou fale com a administração do condomínio.
          </Alert>
        </div>
      </Card>
    </main>
  );
}
