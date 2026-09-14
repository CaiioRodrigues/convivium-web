import type {
  BillingCycleStatus,
  ChargeItemKind,
  ChargeStatus,
  EmailKind,
  EmailStatus,
  ExpenseStatus,
  UtilityBillStatus,
  UtilityProvider,
} from '@/lib/types';
import type { Tone } from '@/components/ui';

/** Textos em português para os enums que a API devolve em inglês. */

export const STATUS_DA_COBRANCA: Record<ChargeStatus, { texto: string; tom: Tone }> = {
  Open: { texto: 'Em aberto', tom: 'info' },
  PartiallyPaid: { texto: 'Paga em parte', tom: 'warning' },
  Paid: { texto: 'Paga', tom: 'positive' },
  Overdue: { texto: 'Vencida', tom: 'negative' },
  Cancelled: { texto: 'Cancelada', tom: 'neutral' },
};

export const STATUS_DA_DESPESA: Record<ExpenseStatus, { texto: string; tom: Tone }> = {
  Pending: { texto: 'A pagar', tom: 'warning' },
  Paid: { texto: 'Paga', tom: 'positive' },
  Cancelled: { texto: 'Cancelada', tom: 'neutral' },
};

export const STATUS_DO_CICLO: Record<BillingCycleStatus, { texto: string; tom: Tone }> = {
  Draft: { texto: 'Rascunho', tom: 'neutral' },
  Closed: { texto: 'Fechado', tom: 'info' },
  Published: { texto: 'Publicado', tom: 'positive' },
  Cancelled: { texto: 'Cancelado', tom: 'neutral' },
};

export const STATUS_DA_FATURA: Record<UtilityBillStatus, { texto: string; tom: Tone }> = {
  Parsed: { texto: 'Lida', tom: 'info' },
  NeedsReview: { texto: 'Conferir', tom: 'warning' },
  Converted: { texto: 'Virou despesa', tom: 'positive' },
  Failed: { texto: 'Falhou', tom: 'negative' },
};

export const STATUS_DO_EMAIL: Record<EmailStatus, { texto: string; tom: Tone }> = {
  Pending: { texto: 'Na fila', tom: 'neutral' },
  Sending: { texto: 'Enviando', tom: 'info' },
  Sent: { texto: 'Enviado', tom: 'positive' },
  Failed: { texto: 'Falhou', tom: 'negative' },
  Cancelled: { texto: 'Cancelado', tom: 'neutral' },
};

export const TIPO_DE_EMAIL: Record<EmailKind, string> = {
  ChargeIssued: 'Cobrança disponível',
  ChargeReminder: 'Lembrete de vencimento',
  ChargeOverdue: 'Aviso de atraso',
  PaymentReceipt: 'Comprovante de pagamento',
  Welcome: 'Boas-vindas',
  PasswordReset: 'Recuperação de senha',
  Announcement: 'Comunicado',
};

export const ITEM_DA_COBRANCA: Record<ChargeItemKind, string> = {
  CondoFee: 'Taxa condominial',
  ReserveFund: 'Fundo de reserva',
  Metered: 'Consumo medido',
  Extraordinary: 'Despesa extraordinária',
  LateFee: 'Multa por atraso',
  Interest: 'Juros de mora',
  Penalty: 'Multa por infração',
  Extra: 'Cobrança avulsa',
  Adjustment: 'Ajuste',
};

export const CONCESSIONARIA: Record<UtilityProvider, string> = {
  Cemig: 'CEMIG',
  Copasa: 'COPASA',
  Gasmig: 'GASMIG',
  Unknown: 'Não identificada',
};
