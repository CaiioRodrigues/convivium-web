'use client';

import { useActionState } from 'react';

import { salvarCondominio, type ResultadoDoCadastro } from '@/lib/actions/cadastros';
import { RetornoDaAcao } from '@/components/retorno-da-acao';
import { Button, Field, Input, Select } from '@/components/ui';
import { document as formatarDocumento } from '@/lib/format';
import type { Condominium } from '@/lib/types';

const VAZIO: ResultadoDoCadastro = {};

/** Fração (0.02) para o número que a pessoa digita ("2"). */
function paraPercentual(fracao: number): string {
  return (fracao * 100).toString().replace('.', ',');
}

export function FormularioDoCondominio({ condominio }: { condominio: Condominium }) {
  const [estado, acao, salvando] = useActionState(salvarCondominio, VAZIO);
  // Volta com o que foi digitado quando a gravação falha (ver ResultadoDoCadastro).
  const digitado = estado.valores ?? {};

  /*
   * O `key` nos campos de seleção não é decoração.
   *
   * Quando a action termina, o React limpa o formulário. Num `<input>` a
   * limpeza devolve o `defaultValue`, que já vem com o valor digitado. Num
   * `<select>` não: o React só marca a opção como padrão do formulário na
   * montagem, nunca quando o `defaultValue` muda depois. Sem remontar, a
   * limpeza voltaria para a primeira opção e o papel escolhido viraria
   * "Morador" caladamente — pior do que perder o formulário, porque quem
   * reenviasse gravaria a pessoa errada sem perceber.
   */
  return (
    <form action={acao} className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome">
          <Input name="nome" defaultValue={digitado.nome ?? condominio.name} required />
        </Field>

        <Field label="Razão social">
          <Input name="razaoSocial" defaultValue={digitado.razaoSocial ?? condominio.legalName ?? ''} />
        </Field>

        <Field label="CNPJ" hint="Conferido pelo dígito verificador">
          <Input
            name="cnpj"
            defaultValue={digitado.cnpj ?? condominio.cnpj ? formatarDocumento(condominio.cnpj) : ''}
            placeholder="00.000.000/0000-00"
          />
        </Field>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-ink">Endereço</h3>
        <div className="grid gap-4 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <Field label="Rua">
              <Input name="rua" defaultValue={digitado.rua ?? condominio.address.street} />
            </Field>
          </div>
          <Field label="Número">
            <Input name="numero" defaultValue={digitado.numero ?? condominio.address.number} />
          </Field>
          <Field label="Complemento">
            <Input name="complemento" defaultValue={digitado.complemento ?? condominio.address.complement ?? ''} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Bairro">
              <Input name="bairro" defaultValue={digitado.bairro ?? condominio.address.district} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Cidade">
              <Input name="cidade" defaultValue={digitado.cidade ?? condominio.address.city} />
            </Field>
          </div>
          <Field label="UF">
            <Input name="uf" defaultValue={digitado.uf ?? condominio.address.state} maxLength={2} />
          </Field>
          <Field label="CEP">
            <Input name="cep" defaultValue={digitado.cep ?? condominio.address.zipCode} placeholder="00000000" />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-ink">Cobrança</h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Dia de vencimento" hint="De 1 a 28">
            <Input
              name="diaVencimento"
              type="number"
              min={1}
              max={28}
              defaultValue={digitado.diaVencimento ?? condominio.billing.dueDay}
            />
          </Field>

          <Field label="Fundo de reserva (%)">
            <Input
              name="fundoReserva"
              inputMode="decimal"
              defaultValue={digitado.fundoReserva ?? paraPercentual(condominio.billing.reserveFundRate)}
            />
          </Field>

          <Field label="Multa por atraso (%)" hint="Máximo 2% por lei">
            <Input
              name="multa"
              inputMode="decimal"
              defaultValue={digitado.multa ?? paraPercentual(condominio.billing.lateFeeRate)}
            />
          </Field>

          <Field label="Juros ao mês (%)" hint="Usual: 1%">
            <Input
              name="juros"
              inputMode="decimal"
              defaultValue={digitado.juros ?? paraPercentual(condominio.billing.monthlyInterestRate)}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Método de rateio">
              <Select
                key={digitado.metodoRateio ?? condominio.billing.defaultApportionmentMethod}
                name="metodoRateio"
                defaultValue={
                  digitado.metodoRateio ?? condominio.billing.defaultApportionmentMethod
                }
              >
                <option value="IdealFraction">Pela fração ideal</option>
                <option value="Area">Pela área privativa</option>
                <option value="Equal">Em partes iguais</option>
              </Select>
            </Field>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-sm font-semibold text-ink">Recebimento por PIX</h3>
        <p className="mb-3 text-sm text-ink-muted">
          É desta chave que sai o QR Code de todo boleto. Deixe em branco para cobrar só por
          transferência.
        </p>

        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Tipo da chave">
            <Select
              key={digitado.tipoChavePix ?? condominio.pixKeyType ?? ''}
              name="tipoChavePix"
              defaultValue={digitado.tipoChavePix ?? condominio.pixKeyType ?? ''}
            >
              <option value="">Sem chave</option>
              <option value="Cnpj">CNPJ</option>
              <option value="Cpf">CPF</option>
              <option value="Email">E-mail</option>
              <option value="Phone">Telefone</option>
              <option value="Random">Aleatória</option>
            </Select>
          </Field>

          <div className="sm:col-span-3">
            <Field label="Chave">
              <Input name="chavePix" defaultValue={digitado.chavePix ?? condominio.pixKey ?? ''} />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Nome do beneficiário" hint="Até 25 caracteres no QR Code">
              <Input
                name="beneficiario"
                defaultValue={digitado.beneficiario ?? condominio.pixReceiverName ?? ''}
                maxLength={25}
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Cidade do beneficiário" hint="Até 15 caracteres">
              <Input
                name="cidadeBeneficiario"
                defaultValue={digitado.cidadeBeneficiario ?? condominio.pixReceiverCity ?? ''}
                maxLength={15}
              />
            </Field>
          </div>
        </div>
      </section>

      <div>
        <Button type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar alterações'}
        </Button>

        <RetornoDaAcao estado={estado} />
      </div>
    </form>
  );
}
