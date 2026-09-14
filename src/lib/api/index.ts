import 'server-only';

import { apiFetch, apiFetchBlob } from '@/lib/api/core';
import type {
  ApportionmentMethod,
  ApportionmentPreview,
  AuthResult,
  BillingCycle,
  CashPosition,
  CashStatement,
  CategorySlice,
  Charge,
  ConsumptionSeries,
  DashboardSummary,
  DelinquentUnit,
  EmailMessage,
  EmailQueueResult,
  EmailStatus,
  Expense,
  ExpenseStatus,
  ExpenseTotals,
  LedgerAccountNode,
  LedgerEntry,
  MonthlyPoint,
  PagedResult,
  Supplier,
  SupplierSpending,
  UtilityBill,
  UtilityBillStatus,
  UtilityProvider,
} from '@/lib/types';

export { ApiError } from '@/lib/api/core';

/**
 * Superficie tipada do convivium-api.
 *
 * Os caminhos ficam concentrados aqui: quando a API mudar uma rota, muda um
 * lugar so, e o TypeScript aponta todos os pontos de uso.
 */
export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch<AuthResult>('/api/auth/login', {
        method: 'POST',
        json: { email, password },
        auth: false,
      }),

    refresh: (refreshToken: string) =>
      apiFetch<AuthResult>('/api/auth/refresh', {
        method: 'POST',
        json: { refreshToken },
        auth: false,
      }),

    logout: (refreshToken: string) =>
      apiFetch<void>('/api/auth/logout', {
        method: 'POST',
        json: { refreshToken },
        auth: false,
      }),

    switchCondominium: (condominiumId: string) =>
      apiFetch<AuthResult>(`/api/auth/switch/${condominiumId}`, { method: 'POST' }),
  },

  dashboard: {
    summary: () => apiFetch<DashboardSummary>('/api/painel'),

    expensesByCategory: (params: { competence?: string; months?: number; detailed?: boolean } = {}) =>
      apiFetch<CategorySlice[]>('/api/painel/gastos-por-categoria', { query: params }),

    monthlySeries: (months = 12) =>
      apiFetch<MonthlyPoint[]>('/api/painel/evolucao-mensal', { query: { months } }),

    topSuppliers: (months = 6, take = 10) =>
      apiFetch<SupplierSpending[]>('/api/painel/fornecedores', { query: { months, take } }),

    consumption: (provider: UtilityProvider, months = 12) =>
      apiFetch<ConsumptionSeries>(`/api/painel/consumo/${provider}`, { query: { months } }),
  },

  cash: {
    position: () => apiFetch<CashPosition>('/api/caixa/posicao'),

    entries: (params: {
      BankAccountId?: string;
      LedgerAccountId?: string;
      From?: string;
      To?: string;
      Direction?: 'In' | 'Out';
      Search?: string;
      Page?: number;
      PageSize?: number;
    } = {}) => apiFetch<PagedResult<LedgerEntry>>('/api/caixa/lancamentos', { query: params }),

    statement: (bankAccountId: string, from: string, to: string) =>
      apiFetch<CashStatement>(`/api/caixa/contas/${bankAccountId}/extrato`, {
        query: { from, to },
      }),

    chartOfAccounts: (includeInactive = false) =>
      apiFetch<LedgerAccountNode[]>('/api/caixa/plano-de-contas', { query: { includeInactive } }),

    createEntry: (body: {
      bankAccountId: string;
      ledgerAccountId: string;
      direction: 'In' | 'Out';
      amount: number;
      date: string;
      description: string;
      competence?: string;
      documentNumber?: string;
    }) => apiFetch<LedgerEntry>('/api/caixa/lancamentos', { method: 'POST', json: body }),
  },

  expenses: {
    list: (params: {
      Competence?: string;
      Status?: ExpenseStatus;
      LedgerAccountId?: string;
      SupplierId?: string;
      OnlyOverdue?: boolean;
      Search?: string;
      Page?: number;
      PageSize?: number;
    } = {}) => apiFetch<PagedResult<Expense>>('/api/despesas', { query: params }),

    totals: (params: { Competence?: string; Status?: ExpenseStatus } = {}) =>
      apiFetch<ExpenseTotals>('/api/despesas/totais', { query: params }),

    get: (id: string) => apiFetch<Expense>(`/api/despesas/${id}`),

    create: (body: {
      description: string;
      ledgerAccountId: string;
      amount: number;
      dueDate: string;
      competence?: string;
      supplierId?: string | null;
      isApportionable?: boolean;
      documentNumber?: string;
      notes?: string;
    }) => apiFetch<Expense>('/api/despesas', { method: 'POST', json: body }),

    pay: (id: string, body: { bankAccountId: string; paidOn?: string; amount?: number }) =>
      apiFetch<Expense>(`/api/despesas/${id}/pagar`, { method: 'POST', json: body }),

    reverse: (id: string) =>
      apiFetch<Expense>(`/api/despesas/${id}/estornar`, { method: 'POST' }),

    cancel: (id: string) => apiFetch<Expense>(`/api/despesas/${id}`, { method: 'DELETE' }),
  },

  suppliers: {
    list: (search?: string) => apiFetch<Supplier[]>('/api/fornecedores', { query: { search } }),
  },

  billing: {
    preview: (competence: string, method?: ApportionmentMethod) =>
      apiFetch<ApportionmentPreview>('/api/cobrancas/previa', { query: { competence, method } }),

    cycles: () => apiFetch<BillingCycle[]>('/api/cobrancas/ciclos'),

    cycle: (id: string) => apiFetch<BillingCycle>(`/api/cobrancas/ciclos/${id}`),

    openCycle: (body: { competence: string; dueDate?: string; method?: ApportionmentMethod; notes?: string }) =>
      apiFetch<BillingCycle>('/api/cobrancas/ciclos', { method: 'POST', json: body }),

    closeCycle: (id: string) =>
      apiFetch<BillingCycle>(`/api/cobrancas/ciclos/${id}/fechar`, { method: 'POST' }),

    publishCycle: (id: string) =>
      apiFetch<BillingCycle>(`/api/cobrancas/ciclos/${id}/publicar`, { method: 'POST' }),

    charges: (params: {
      Competence?: string;
      UnitId?: string;
      BillingCycleId?: string;
      Status?: string;
      OnlyOverdue?: boolean;
      Page?: number;
      PageSize?: number;
    } = {}) => apiFetch<PagedResult<Charge>>('/api/cobrancas', { query: params }),

    charge: (id: string) => apiFetch<Charge>(`/api/cobrancas/${id}`),

    delinquency: () => apiFetch<DelinquentUnit[]>('/api/cobrancas/inadimplencia'),

    registerPayment: (
      id: string,
      body: { amount: number; bankAccountId: string; paidOn?: string; method?: string; notes?: string },
    ) => apiFetch<Charge>(`/api/cobrancas/${id}/receber`, { method: 'POST', json: body }),

    myCharges: () => apiFetch<Charge[]>('/api/minhas-cobrancas'),

    /** Boleto acessado pelo link publico do e-mail, sem login. */
    byPublicToken: (token: string) =>
      apiFetch<Charge>(`/api/boleto/${token}`, { auth: false }),

    pdf: (id: string) => apiFetchBlob(`/api/cobrancas/${id}/pdf`),

    publicPdf: (token: string) => apiFetchBlob(`/api/boleto/${token}/pdf`, { auth: false }),
  },

  utilityBills: {
    list: (params: { Provider?: UtilityProvider; Status?: UtilityBillStatus; Page?: number; PageSize?: number } = {}) =>
      apiFetch<PagedResult<UtilityBill>>('/api/faturas', { query: params }),

    get: (id: string) => apiFetch<UtilityBill>(`/api/faturas/${id}`),

    rawText: (id: string) => apiFetch<string>(`/api/faturas/${id}/texto`),

    import: (file: File, provider?: UtilityProvider) => {
      const form = new FormData();
      form.set('file', file);

      return apiFetch<UtilityBill>('/api/faturas/importar', {
        method: 'POST',
        formData: form,
        query: { provider },
      });
    },

    review: (
      id: string,
      body: {
        amount?: number;
        dueDate?: string;
        referenceMonth?: string;
        installationCode?: string;
        consumptionKwh?: number;
        consumptionCubicMeters?: number;
      },
    ) => apiFetch<UtilityBill>(`/api/faturas/${id}`, { method: 'PUT', json: body }),

    convertToExpense: (
      id: string,
      body: { ledgerAccountId?: string; supplierId?: string; description?: string; isApportionable?: boolean } = {},
    ) => apiFetch<Expense>(`/api/faturas/${id}/gerar-despesa`, { method: 'POST', json: body }),
  },

  notifications: {
    list: (params: { status?: EmailStatus; Page?: number; PageSize?: number } = {}) =>
      apiFetch<PagedResult<EmailMessage>>('/api/notificacoes', { query: params }),

    sendCycleNotices: (billingCycleId: string, kind?: string) =>
      apiFetch<EmailQueueResult>(`/api/notificacoes/ciclos/${billingCycleId}/enviar`, {
        method: 'POST',
        query: { kind },
      }),

    sendReminders: (daysBefore = 3) =>
      apiFetch<EmailQueueResult>('/api/notificacoes/lembretes', {
        method: 'POST',
        query: { daysBefore },
      }),

    sendOverdueNotices: (minimumDaysLate = 1) =>
      apiFetch<EmailQueueResult>('/api/notificacoes/inadimplentes', {
        method: 'POST',
        query: { minimumDaysLate },
      }),
  },
};
