import { competenceLabel, count, date, money } from '@/lib/format';
import type {
  ApportionmentMethod,
  BillingCycle,
  Condominium,
  EmailMessage,
  ExpenseTotals,
  Person,
  PixKeyType,
} from '@/lib/types';

/**
 * Roteiro de teste: a sequencia minima para levar um condominio do zero ate o
 * boleto na mao do morador.
 *
 * A logica mora aqui, separada da tela, porque cada passo e uma pergunta sobre
 * os dados — "a soma das fracoes fecha em 1?" — e nao sobre a interface. Nada
 * aqui e marcado a mao: o que diz se o passo esta feito e o estado real da base.
 */

export type Situacao = 'feito' | 'atencao' | 'pendente';

export interface Passo {
  numero: number;
  titulo: string;
  /** A acao concreta, no imperativo. */
  oQueFazer: string;
  /** O que quebra se este passo for pulado. */
  porQue: string;
  situacao: Situacao;
  /** O numero de verdade que sustenta a situacao — nunca so "ok". */
  evidencia: string;
  href: string;
  acao: string;
}

export interface DadosDoRoteiro {
  condominio: Condominium;
  pessoas: Person[];
  /** Competencia mais recente, ou null se nenhuma foi aberta ainda. */
  ciclo: BillingCycle | null;
  despesas: ExpenseTotals;
  /** Avisos que carregam cobranca, ou seja, boleto enviado por e-mail. */
  avisosDeCobranca: EmailMessage[];
  competencia: string;
}

const ROTULO_DA_CHAVE: Record<PixKeyType, string> = {
  Cpf: 'CPF',
  Cnpj: 'CNPJ',
  Email: 'e-mail',
  Phone: 'telefone',
  Random: 'chave aleatória',
};

const ROTULO_DO_METODO: Record<ApportionmentMethod, string> = {
  IdealFraction: 'fração ideal',
  Equal: 'partes iguais',
  Area: 'área',
};

/** Fração ideal precisa das seis casas: é nelas que a soma deixa de fechar. */
const fracao = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 6,
  maximumFractionDigits: 6,
});

type Etapa = Omit<Passo, 'numero'>;

export function montarRoteiro(dados: DadosDoRoteiro): Passo[] {
  return [
    chavePix(dados.condominio),
    unidades(dados.condominio),
    responsaveis(dados.condominio, dados.pessoas),
    despesasDaCompetencia(dados.despesas, dados.competencia),
    abrirCompetencia(dados.ciclo, dados.competencia),
    fecharEPublicar(dados.ciclo),
    enviarBoletos(dados.avisosDeCobranca),
  ].map((etapa, indice) => ({ ...etapa, numero: indice + 1 }));
}

/** Quantos passos já estão resolvidos — "atenção" ainda não conta como feito. */
export function concluidos(passos: Passo[]): number {
  return passos.filter((passo) => passo.situacao === 'feito').length;
}

/** O passo em que a pessoa está: o primeiro que ainda não fechou. */
export function passoAtual(passos: Passo[]): number | null {
  return passos.find((passo) => passo.situacao !== 'feito')?.numero ?? null;
}

function chavePix(condominio: Condominium): Etapa {
  const chave = condominio.pixKey;

  return {
    titulo: 'Confira a chave PIX que vai receber',
    oQueFazer:
      'Abra o cadastro do condomínio e confirme a chave PIX, o nome e a cidade do recebedor.',
    porQue:
      'O QR Code de todo boleto é montado a partir dessa chave. Se ela estiver errada, o morador paga normalmente e o dinheiro cai em outra conta — o boleto não tem como avisar.',
    situacao: chave ? 'feito' : 'pendente',
    evidencia: chave
      ? `${ROTULO_DA_CHAVE[condominio.pixKeyType ?? 'Random']} ${chave}, em nome de ${condominio.pixReceiverName ?? 'ninguém informado'}`
      : 'nenhuma chave cadastrada — os boletos sairiam sem QR Code',
    href: '/cadastros/condominio',
    acao: 'Abrir cadastro do condomínio',
  };
}

function unidades(condominio: Condominium): Etapa {
  const ativas = condominio.activeUnitCount;
  const soma = condominio.idealFractionSum;

  // Meio milionesimo de folga: a soma vem de decimais somados um a um, entao
  // exigir igualdade exata reprovaria um cadastro correto.
  const fecha = Math.abs(soma - 1) < 0.0000005;

  return {
    titulo: 'Cadastre as unidades e feche as frações ideais',
    oQueFazer:
      'Cadastre cada apartamento com a área dele. Se não souber as frações de cabeça, use "Recalcular pela área" e o sistema fecha a soma em 1.',
    porQue:
      'A fração ideal é o peso da unidade no rateio. Se a soma não fecha em 1, o rateio distribui mais ou menos do que a despesa real, e a diferença vira sobra ou falta no caixa todo mês.',
    situacao: ativas === 0 ? 'pendente' : fecha ? 'feito' : 'atencao',
    evidencia:
      ativas === 0
        ? 'nenhuma unidade ativa'
        : `${count(ativas)} unidades ativas, frações somam ${fracao.format(soma)}${fecha ? '' : ' — deveria somar 1,000000'}`,
    href: '/cadastros/unidades',
    acao: 'Abrir unidades',
  };
}

function responsaveis(condominio: Condominium, pessoas: Person[]): Etapa {
  // Uma unidade so recebe boleto se tiver um responsavel pela cobranca E se
  // esse responsavel tiver e-mail. Os dois juntos, por unidade.
  const cobertas = new Set(
    pessoas
      .filter((pessoa) => pessoa.email)
      .flatMap((pessoa) =>
        pessoa.units.filter((unidade) => unidade.isBillingResponsible).map((u) => u.unitId),
      ),
  ).size;

  const faltam = Math.max(condominio.activeUnitCount - cobertas, 0);

  return {
    titulo: 'Vincule os moradores às unidades',
    oQueFazer:
      'Cadastre o morador com e-mail, ligue-o à unidade e marque quem é o responsável pela cobrança daquele apartamento.',
    porQue:
      'O boleto é endereçado ao responsável pela cobrança da unidade. Sem ele, ou sem e-mail, a unidade continua entrando no rateio e devendo — só não recebe o aviso.',
    situacao: cobertas === 0 ? 'pendente' : faltam > 0 ? 'atencao' : 'feito',
    evidencia:
      cobertas === 0
        ? 'nenhuma unidade tem responsável com e-mail'
        : `${count(cobertas)} de ${count(condominio.activeUnitCount)} unidades com responsável e e-mail${faltam > 0 ? ` — ${count(faltam)} ficariam sem receber` : ''}`,
    href: '/cadastros/pessoas',
    acao: 'Abrir pessoas',
  };
}

function despesasDaCompetencia(totais: ExpenseTotals, competencia: string): Etapa {
  // Overdue e um recorte de Pending (pendente e vencida), entao entra na soma
  // uma vez so: Pending + Paid ja e o total lancado.
  const total = totais.pending + totais.paid;

  return {
    titulo: `Lance as despesas de ${competenceLabel(competencia)}`,
    oQueFazer:
      'Lance água, luz, salários, limpeza — tudo que o condomínio gastou no mês. As contas de CEMIG podem entrar direto pelo PDF, em Faturas.',
    porQue:
      'O rateio divide o que foi lançado, e nada além disso. Fechar a competência com despesa faltando gera boleto barato demais, e a conta reaparece no mês seguinte.',
    situacao: totais.count > 0 ? 'feito' : 'pendente',
    evidencia:
      totais.count > 0
        ? `${count(totais.count)} despesas somando ${money(total)}`
        : 'nenhuma despesa lançada nesta competência — o rateio sairia zerado',
    href: '/despesas',
    acao: 'Abrir despesas',
  };
}

function abrirCompetencia(ciclo: BillingCycle | null, competencia: string): Etapa {
  return {
    titulo: 'Abra a competência e confira a prévia',
    oQueFazer:
      'Em Cobranças, abra a competência e escolha o vencimento. Antes de fechar, olhe a prévia: ela mostra unidade por unidade quanto cada uma vai pagar.',
    porQue:
      'A prévia é a última chance de conferir sem consequência. Depois de fechar, os boletos já existem — corrigir significa cancelar e refazer.',
    situacao: ciclo ? 'feito' : 'pendente',
    evidencia: ciclo
      ? `${competenceLabel(ciclo.competence)} aberta, rateio por ${ROTULO_DO_METODO[ciclo.method]}, vencimento ${date(ciclo.dueDate)}`
      : `nenhuma competência aberta para ${competenceLabel(competencia)}`,
    href: '/cobrancas',
    acao: 'Abrir cobranças',
  };
}

function fecharEPublicar(ciclo: BillingCycle | null): Etapa {
  const situacao: Situacao =
    ciclo?.status === 'Published' ? 'feito' : ciclo?.status === 'Closed' ? 'atencao' : 'pendente';

  return {
    titulo: 'Feche e publique a competência',
    oQueFazer:
      'Fechar gera um boleto por unidade. Publicar é o passo separado que libera o link e o QR Code para o morador.',
    porQue:
      'São dois botões de propósito: entre fechar e publicar existe um intervalo para conferir os valores gerados sem que ninguém já tenha visto.',
    situacao,
    evidencia: evidenciaDoFechamento(ciclo),
    href: '/cobrancas',
    acao: 'Abrir cobranças',
  };
}

function evidenciaDoFechamento(ciclo: BillingCycle | null): string {
  if (!ciclo) {
    return 'depende do passo anterior';
  }

  switch (ciclo.status) {
    case 'Published':
      return `${count(ciclo.chargeCount)} boletos publicados, somando ${money(ciclo.chargedTotal)}`;
    case 'Closed':
      return `${count(ciclo.chargeCount)} boletos gerados, mas ainda não publicados — o morador não consegue abrir o link`;
    case 'Cancelled':
      return 'a competência foi cancelada; abra outra para seguir';
    default:
      return 'competência aberta em rascunho, ainda sem boletos gerados';
  }
}

function enviarBoletos(avisos: EmailMessage[]): Etapa {
  const enviados = avisos.filter((aviso) => aviso.status === 'Sent').length;
  const falharam = avisos.filter((aviso) => aviso.status === 'Failed').length;
  const naFila = avisos.filter(
    (aviso) => aviso.status === 'Pending' || aviso.status === 'Sending',
  ).length;

  return {
    titulo: 'Envie os boletos por e-mail',
    oQueFazer:
      'Na competência publicada, use "Enviar avisos". Cada morador recebe o valor da unidade dele, o vencimento e o link do boleto.',
    porQue:
      'O envio é enfileirado, não instantâneo: a API tenta, e tenta de novo se falhar. Um aviso parado em "pendente" para sempre normalmente significa SMTP não configurado na API.',
    situacao: avisos.length === 0 ? 'pendente' : falharam > 0 ? 'atencao' : 'feito',
    evidencia:
      avisos.length === 0
        ? 'nenhum aviso de cobrança enviado ainda'
        : `${count(enviados)} entregues · ${count(naFila)} na fila · ${count(falharam)} com falha`,
    href: '/notificacoes',
    acao: 'Abrir avisos',
  };
}
