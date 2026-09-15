"use client";

import { useActionState } from "react";

import {
  alterarPapel,
  desativarPessoa,
  desvincularUnidade,
  enviarConvite,
  salvarPessoa,
  vincularUnidade,
  type ResultadoDoCadastro,
} from "@/lib/actions/cadastros";
import { RetornoDaAcao } from "@/components/retorno-da-acao";
import { Button, Field, Input, Select } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/roles";
import type { MembershipRole, Person, Unit } from "@/lib/types";

const VAZIO: ResultadoDoCadastro = {};

const PAPEIS: MembershipRole[] = [
  "Resident",
  "Caretaker",
  "CouncilMember",
  "AssistantManager",
  "Manager",
  "Administrator",
];

export function FormularioDePessoa({
  unidades,
  pessoa,
}: {
  unidades: Unit[];
  pessoa?: Person;
}) {
  const [estado, acao, salvando] = useActionState(salvarPessoa, VAZIO);
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
    <form action={acao} className="grid gap-4 sm:grid-cols-6">
      {pessoa ? (
        <input type="hidden" name="pessoaId" value={pessoa.id} />
      ) : null}

      <div className="sm:col-span-3">
        <Field label="Nome">
          <Input
            name="nome"
            defaultValue={digitado.nome ?? pessoa?.name ?? ""}
            required
          />
        </Field>
      </div>

      <div className="sm:col-span-3">
        <Field
          label="E-mail"
          hint="Necessário para enviar boleto e convite de acesso"
        >
          <Input
            name="email"
            defaultValue={digitado.email ?? pessoa?.email ?? ""}
            type="email"
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="CPF" hint="Conferido pelo dígito verificador">
          <Input
            name="cpf"
            defaultValue={digitado.cpf ?? pessoa?.cpf ?? ""}
            placeholder="000.000.000-00"
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Telefone">
          <Input
            name="telefone"
            defaultValue={digitado.telefone ?? pessoa?.phone ?? ""}
            placeholder="(31) 99999-8888"
          />
        </Field>
      </div>

      {/*
        Papel, unidade e relação só aparecem no cadastro. Editando, cada um tem
        o próprio controle na linha da pessoa — e a API os altera por rotas
        separadas, então mostrá-los aqui prometeria uma gravação que não
        aconteceria.
      */}
      {pessoa ? null : (
        <>
          <div className="sm:col-span-2">
            <Field label="Papel">
              <Select
                key={digitado.papel ?? "Resident"}
                name="papel"
                defaultValue={digitado.papel ?? "Resident"}
              >
                {PAPEIS.map((papel) => (
                  <option key={papel} value={papel}>
                    {ROLE_LABEL[papel]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Unidade" hint="Opcional; pode vincular depois">
              <Select
                key={digitado.unidadeId ?? ""}
                name="unidadeId"
                defaultValue={digitado.unidadeId ?? ""}
              >
                <option value="">Sem unidade</option>
                {unidades.map((unidade) => (
                  <option key={unidade.id} value={unidade.id}>
                    {unidade.fullIdentifier}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Relação com a unidade">
              <Select
                key={digitado.relacao ?? "Owner"}
                name="relacao"
                defaultValue={digitado.relacao ?? "Owner"}
              >
                <option value="Owner">Proprietário</option>
                <option value="Tenant">Inquilino</option>
                <option value="Occupant">Morador</option>
              </Select>
            </Field>
          </div>

          <div className="flex items-end sm:col-span-2">
            <label className="flex items-center gap-2 pb-2 text-sm text-ink">
              <input
                type="checkbox"
                name="responsavel"
                defaultChecked={
                  estado.valores ? digitado.responsavel !== undefined : true
                }
                className="size-4 accent-[var(--color-brand)]"
              />
              Recebe a cobrança
            </label>
          </div>
        </>
      )}

      <div className="sm:col-span-6">
        <Button type="submit" disabled={salvando}>
          {salvando
            ? "Salvando…"
            : pessoa
              ? "Salvar alterações"
              : "Cadastrar pessoa"}
        </Button>

        <RetornoDaAcao estado={estado} />
      </div>
    </form>
  );
}

export function SeletorDePapel({
  pessoaId,
  papel,
}: {
  pessoaId: string;
  papel: MembershipRole;
}) {
  const [estado, acao, enviando] = useActionState(alterarPapel, VAZIO);

  return (
    <form action={acao}>
      <input type="hidden" name="pessoaId" value={pessoaId} />

      <Select
        name="papel"
        defaultValue={papel}
        disabled={enviando}
        aria-label="Papel no condomínio"
        className="w-auto py-1 text-xs"
        onChange={(evento) => evento.currentTarget.form?.requestSubmit()}
      >
        {PAPEIS.map((valor) => (
          <option key={valor} value={valor}>
            {ROLE_LABEL[valor]}
          </option>
        ))}
      </Select>

      {estado.erro ? (
        <span
          className="mt-1 block max-w-xs text-xs text-negative"
          role="alert"
        >
          {estado.erro}
        </span>
      ) : null}
    </form>
  );
}

export function BotaoDeConvite({
  pessoaId,
  temAcesso,
  convitePendente,
}: {
  pessoaId: string;
  temAcesso: boolean;
  convitePendente: boolean;
}) {
  const [estado, acao, enviando] = useActionState(enviarConvite, VAZIO);

  const rotulo = enviando
    ? "Enviando…"
    : temAcesso
      ? "Reenviar acesso"
      : convitePendente
        ? "Reenviar convite"
        : "Enviar convite";

  return (
    <div>
      <form action={acao}>
        <input type="hidden" name="pessoaId" value={pessoaId} />
        <Button
          type="submit"
          variant="secondary"
          disabled={enviando}
          className="py-1 text-xs"
        >
          {rotulo}
        </Button>
      </form>

      <RetornoDaAcao estado={estado} />
    </div>
  );
}

export function FormularioDeVinculo({
  pessoaId,
  unidades,
}: {
  pessoaId: string;
  unidades: Unit[];
}) {
  const [estado, acao, enviando] = useActionState(vincularUnidade, VAZIO);

  return (
    <div>
      <form action={acao} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="pessoaId" value={pessoaId} />

        <Select
          name="unidadeId"
          aria-label="Unidade"
          className="w-auto py-1.5 text-xs"
        >
          {unidades.map((unidade) => (
            <option key={unidade.id} value={unidade.id}>
              {unidade.fullIdentifier}
            </option>
          ))}
        </Select>

        <Select
          name="relacao"
          aria-label="Relação"
          className="w-auto py-1.5 text-xs"
        >
          <option value="Owner">Proprietário</option>
          <option value="Tenant">Inquilino</option>
          <option value="Occupant">Morador</option>
        </Select>

        <label className="flex items-center gap-1.5 pb-1.5 text-xs text-ink">
          <input
            type="checkbox"
            name="responsavel"
            className="size-3.5 accent-[var(--color-brand)]"
          />
          Recebe a cobrança
        </label>

        <Button type="submit" disabled={enviando} className="py-1.5 text-xs">
          {enviando ? "…" : "Vincular"}
        </Button>
      </form>

      <RetornoDaAcao estado={estado} />
    </div>
  );
}

export function BotaoDesvincular({ vinculoId }: { vinculoId: string }) {
  const [estado, acao, enviando] = useActionState(desvincularUnidade, VAZIO);

  return (
    <form action={acao} className="inline">
      <input type="hidden" name="vinculoId" value={vinculoId} />

      <button
        type="submit"
        disabled={enviando}
        className="text-xs text-ink-subtle underline underline-offset-2 hover:text-negative"
      >
        {enviando ? "…" : "desvincular"}
      </button>

      {estado.erro ? (
        <span className="ml-1 text-xs text-negative">{estado.erro}</span>
      ) : null}
    </form>
  );
}

export function BotaoDesativarPessoa({ pessoaId }: { pessoaId: string }) {
  const [estado, acao, enviando] = useActionState(desativarPessoa, VAZIO);

  return (
    <form action={acao} className="flex items-center justify-end gap-2">
      <input type="hidden" name="pessoaId" value={pessoaId} />

      <Button
        type="submit"
        variant="ghost"
        disabled={enviando}
        className="py-1 text-xs"
      >
        {enviando ? "…" : "Desativar"}
      </Button>

      {estado.erro ? (
        <span className="max-w-xs text-xs text-negative" role="alert">
          {estado.erro}
        </span>
      ) : null}
    </form>
  );
}
