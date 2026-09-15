'use client';

import { useActionState, useState } from 'react';

import { salvarLeituras } from '@/lib/actions/medicoes';
import type { ResultadoDoCadastro } from '@/lib/actions/cadastros';
import { RetornoDaAcao } from '@/components/retorno-da-acao';
import { Badge, Button, Field, Input, Table, Td, Th } from '@/components/ui';
import type { MeterReadingSheet } from '@/lib/types';

const VAZIO: ResultadoDoCadastro = {};

const decimal = (valor: number, casas = 3) =>
  valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

const reais = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * A folha de leitura do mes, preenchida de cima a baixo.
 *
 * O consumo e o valor aparecem enquanto se digita porque e assim que a conta e
 * conferida na pratica: o sindico olha o numero do medidor, digita, e confere
 * se o consumo faz sentido para aquele apartamento. Descobrir um 6 no lugar de
 * um 5 depois de fechar o rateio custa refazer tudo.
 */
export function FolhaDeLeitura({ folha }: { folha: MeterReadingSheet }) {
  const [estado, acao, salvando] = useActionState(salvarLeituras, VAZIO);

  const [preco, setPreco] = useState(folha.unitPrice > 0 ? folha.unitPrice : 0);

  const [leituras, setLeituras] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      folha.lines.map((l) => [
        l.unitId,
        l.currentReading === null ? '' : decimal(l.currentReading).replace(/\./g, ''),
      ]),
    ),
  );

  /*
   * A leitura anterior também é controlada, e não só `defaultValue`.
   *
   * Enquanto ela era apenas o valor do servidor, o consumo na tela saía de
   * "atual menos o que já estava salvo" — e no primeiro mês, quando as duas
   * colunas são digitadas na hora, o que estava salvo era zero. O APT 101
   * aparecia consumindo 465,644 m³ em vez de 0,001. O valor gravado saía
   * certo, porque a action lê o formulário, mas a tela mentia justamente no
   * momento em que ela serve para conferir.
   */
  const [anteriores, setAnteriores] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      folha.lines.map((l) => [l.unitId, decimal(l.previousReading).replace(/\./g, '')]),
    ),
  );

  const paraNumero = (texto: string | undefined) => {
    const bruto = (texto ?? '').trim().replace(/\./g, '').replace(',', '.');
    if (bruto === '') return null;

    const valor = Number(bruto);
    return Number.isFinite(valor) ? valor : null;
  };

  const consumo = (linha: MeterReadingSheet['lines'][number]) => {
    const atual = paraNumero(leituras[linha.unitId]);
    if (atual === null) return null;

    return Math.max(atual - (paraNumero(anteriores[linha.unitId]) ?? 0), 0);
  };

  const totalConsumo = folha.lines.reduce((soma, l) => soma + (consumo(l) ?? 0), 0);
  const totalValor = folha.lines.reduce(
    (soma, l) => soma + Math.round((consumo(l) ?? 0) * preco * 100) / 100,
    0,
  );

  return (
    <form action={acao}>
      <input type="hidden" name="competencia" value={folha.competence} />

      <div className="grid gap-4 border-b border-line px-5 py-4 sm:grid-cols-3">
        <ConversorDeCilindro aoCalcular={setPreco} />

        <Field label="Preço do m³" hint="Sai do cilindro, ou digite direto">
          <Input
            name="preco"
            inputMode="decimal"
            value={preco === 0 ? '' : String(preco).replace('.', ',')}
            onChange={(evento) => {
              const bruto = evento.target.value.replace(',', '.');
              setPreco(Number.isFinite(Number(bruto)) ? Number(bruto) : 0);
            }}
            required
          />
        </Field>

        <Field label="Data da leitura">
          <Input type="date" name="lidoEm" defaultValue={folha.readOn ?? ''} />
        </Field>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Apartamento</Th>
            <Th numeric>Leitura anterior</Th>
            <Th numeric>Leitura atual</Th>
            <Th numeric>Consumo (m³)</Th>
            <Th numeric>Valor</Th>
          </tr>
        </thead>
        <tbody>
          {folha.lines.map((linha) => {
            const m3 = consumo(linha);

            return (
              <tr key={linha.unitId}>
                <Td className="font-medium">
                  {linha.unitIdentifier}
                  {linha.previousFromLastCompetence ? (
                    <Badge tone="neutral" className="ml-2">
                      anterior herdada
                    </Badge>
                  ) : null}
                </Td>

                <Td numeric>
                  <Input
                    name={`anterior-${linha.unitId}`}
                    inputMode="decimal"
                    value={anteriores[linha.unitId] ?? ''}
                    onChange={(evento) =>
                      setAnteriores((antes) => ({
                        ...antes,
                        [linha.unitId]: evento.target.value,
                      }))
                    }
                    className="w-32 text-right"
                    aria-label={`Leitura anterior da unidade ${linha.unitIdentifier}`}
                  />
                </Td>

                <Td numeric>
                  <Input
                    name={`leitura-${linha.unitId}`}
                    inputMode="decimal"
                    value={leituras[linha.unitId] ?? ''}
                    onChange={(evento) =>
                      setLeituras((antes) => ({ ...antes, [linha.unitId]: evento.target.value }))
                    }
                    className="w-32 text-right"
                    aria-label={`Leitura atual da unidade ${linha.unitIdentifier}`}
                  />
                </Td>

                <Td numeric className={m3 === null ? 'text-ink-subtle' : 'text-ink-muted'}>
                  {m3 === null ? 'sem leitura' : decimal(m3)}
                </Td>

                <Td numeric className="font-medium">
                  {m3 === null ? '—' : reais(Math.round(m3 * preco * 100) / 100)}
                </Td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-surface-muted">
            <Td className="font-semibold">Total</Td>
            <Td />
            <Td />
            <Td numeric className="font-semibold">
              {decimal(totalConsumo)}
            </Td>
            <Td numeric className="font-semibold">
              {reais(totalValor)}
            </Td>
          </tr>
        </tfoot>
      </Table>

      <div className="px-5 py-4">
        <Button type="submit" disabled={salvando || !folha.isEditable}>
          {salvando ? 'Salvando…' : 'Salvar leituras'}
        </Button>

        <RetornoDaAcao estado={estado} />
      </div>
    </form>
  );
}

/**
 * O preco do metro cubico sai da compra: um cilindro de 45 kg rende cerca de
 * 20 m3. A conta e sempre a mesma e ninguem lembra dela na hora.
 */
function ConversorDeCilindro({ aoCalcular }: { aoCalcular: (preco: number) => void }) {
  const [custo, setCusto] = useState('');
  const [metros, setMetros] = useState('20');

  /*
   * Converte assim que os dois campos fazem sentido, sem botão para clicar.
   * Preencher "420,00" e "20" e mesmo assim ficar com o preço em branco é a
   * forma mais fácil de fechar o mês inteiro com o valor errado.
   */
  const converter = (novoCusto: string, novosMetros: string) => {
    const valor = Number(novoCusto.replace(/\./g, '').replace(',', '.'));
    const volume = Number(novosMetros.replace(',', '.'));

    if (novoCusto.trim() !== '' && Number.isFinite(valor) && volume > 0) {
      aoCalcular(Math.round((valor / volume) * 10000) / 10000);
    }
  };

  return (
    <Field label="Preço do cilindro" hint="45 kg rendem cerca de 20 m³ — o preço do m³ sai daqui">
      <div className="flex gap-2">
        <Input
          inputMode="decimal"
          placeholder="420,00"
          value={custo}
          onChange={(evento) => {
            setCusto(evento.target.value);
            converter(evento.target.value, metros);
          }}
          aria-label="Quanto custou o cilindro"
        />
        <Input
          inputMode="decimal"
          value={metros}
          onChange={(evento) => {
            setMetros(evento.target.value);
            converter(custo, evento.target.value);
          }}
          className="w-24"
          aria-label="Quantos metros cúbicos o cilindro rende"
        />
      </div>
    </Field>
  );
}
