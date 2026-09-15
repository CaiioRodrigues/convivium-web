import 'server-only';

import { apiFetch, apiFetchBlob } from '@/lib/api/core';
import type {
  ApportionmentMethod,
  Address,
  BankAccountKind,
  BankAccountSummary,
  BillingSettings,
  Block,
  Condominium,
  InviteResult,
  MembershipRole,
  MeteredUtility,
  MeterReadingSheet,
  OccupancyRelation,
  Person,
  PixKeyType,
  RedistributeResult,
  Unit,
  UnitKind,
  UnitList,
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

    /**
     * Cadastra uma conta. O `openingBalance` e o saldo que a conta ja tinha
     * quando entrou no sistema — nao e lancamento, entao nao entra na receita
     * do mes; so reposiciona o ponto de partida do saldo.
     */
    createBankAccount: (body: {
      name: string;
      kind: BankAccountKind;
      bankCode?: string | null;
      agency?: string | null;
      accountNumber?: string | null;
      openingBalance: number;
      openingDate?: string | null;
      isReserveFund: boolean;
    }) => apiFetch<BankAccountSummary>('/api/caixa/contas', { method: 'POST', json: body }),

    updateBankAccount: (
      id: string,
      body: {
        name: string;
        kind: BankAccountKind;
        bankCode?: string | null;
        agency?: string | null;
        accountNumber?: string | null;
        openingBalance: number;
        openingDate?: string | null;
        isReserveFund: boolean;
        isActive: boolean;
      },
    ) => apiFetch<BankAccountSummary>(`/api/caixa/contas/${id}`, { method: 'PUT', json: body }),

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
      // Anulaveis como no update: limpar o campo apaga o que estava la, e
      // `undefined` sumiria do JSON deixando o valor antigo de pe.
      documentNumber?: string | null;
      notes?: string | null;
    }) => apiFetch<Expense>('/api/despesas', { method: 'POST', json: body }),

    update: (
      id: string,
      body: {
        description: string;
        ledgerAccountId: string;
        amount: number;
        dueDate: string;
        competence?: string;
        supplierId?: string | null;
        isApportionable?: boolean;
        documentNumber?: string | null;
        notes?: string | null;
      },
    ) => apiFetch<Expense>(`/api/despesas/${id}`, { method: 'PUT', json: body }),

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

  condominium: {
    get: () => apiFetch<Condominium>('/api/condominio'),

    update: (body: {
      name: string;
      legalName?: string | null;
      cnpj?: string | null;
      address: Address;
      billing: BillingSettings;
      pixKey?: string | null;
      pixKeyType?: PixKeyType | null;
      pixReceiverName?: string | null;
      pixReceiverCity?: string | null;
    }) => apiFetch<Condominium>('/api/condominio', { method: 'PUT', json: body }),
  },

  units: {
    list: (includeInactive = true) =>
      apiFetch<UnitList>('/api/unidades', { query: { includeInactive } }),

    get: (id: string) => apiFetch<Unit>(`/api/unidades/${id}`),

    create: (body: {
      identifier: string;
      blockId?: string | null;
      newBlockName?: string | null;
      floor?: number | null;
      kind?: UnitKind;
      areaM2?: number | null;
      idealFraction?: number | null;
      isActive?: boolean;
    }) => apiFetch<Unit>('/api/unidades', { method: 'POST', json: body }),

    update: (
      id: string,
      body: {
        identifier: string;
        blockId?: string | null;
        newBlockName?: string | null;
        floor?: number | null;
        kind?: UnitKind;
        areaM2?: number | null;
        idealFraction?: number | null;
        isActive?: boolean;
      },
    ) => apiFetch<Unit>(`/api/unidades/${id}`, { method: 'PUT', json: body }),

    deactivate: (id: string) =>
      apiFetch<Unit>(`/api/unidades/${id}/desativar`, { method: 'POST' }),

    remove: (id: string) => apiFetch<void>(`/api/unidades/${id}`, { method: 'DELETE' }),

    /** Recalcula todas as frações pela área, fazendo a soma fechar em 1. */
    redistributeByArea: () =>
      apiFetch<RedistributeResult>('/api/unidades/recalcular-fracoes', { method: 'POST' }),

    /**
     * Escala as frações já cadastradas para somarem exatamente 1, mantendo a
     * proporção entre elas. Não inventa proporção nenhuma: quem manda continua
     * sendo a convenção.
     */
    normalizeFractions: () =>
      apiFetch<RedistributeResult>('/api/unidades/ajustar-fracoes', { method: 'POST' }),

    createBlock: (name: string) =>
      apiFetch<Block>('/api/unidades/blocos', { method: 'POST', json: { name } }),

    removeBlock: (id: string) =>
      apiFetch<void>(`/api/unidades/blocos/${id}`, { method: 'DELETE' }),
  },

  people: {
    list: (params: { Search?: string; Role?: MembershipRole; IncludeInactive?: boolean } = {}) =>
      apiFetch<Person[]>('/api/pessoas', { query: params }),

    get: (id: string) => apiFetch<Person>(`/api/pessoas/${id}`),

    create: (body: {
      name: string;
      email?: string | null;
      cpf?: string | null;
      phone?: string | null;
      role?: MembershipRole;
      unitId?: string | null;
      relation?: OccupancyRelation;
      isBillingResponsible?: boolean;
    }) => apiFetch<Person>('/api/pessoas', { method: 'POST', json: body }),

    update: (
      id: string,
      body: { name: string; email?: string | null; cpf?: string | null; phone?: string | null },
    ) => apiFetch<Person>(`/api/pessoas/${id}`, { method: 'PUT', json: body }),

    changeRole: (id: string, role: MembershipRole) =>
      apiFetch<Person>(`/api/pessoas/${id}/papel`, { method: 'PUT', json: { role } }),

    linkUnit: (
      id: string,
      body: { unitId: string; relation?: OccupancyRelation; isBillingResponsible?: boolean },
    ) => apiFetch<Person>(`/api/pessoas/${id}/unidades`, { method: 'POST', json: body }),

    setBillingResponsible: (occupancyId: string) =>
      apiFetch<Person>(`/api/pessoas/vinculos/${occupancyId}/responsavel`, { method: 'POST' }),

    unlinkUnit: (occupancyId: string) =>
      apiFetch<Person>(`/api/pessoas/vinculos/${occupancyId}`, { method: 'DELETE' }),

    /** Dispara o convite de primeiro acesso por e-mail. */
    invite: (id: string) =>
      apiFetch<InviteResult>(`/api/pessoas/${id}/convite`, { method: 'POST' }),

    deactivate: (id: string) =>
      apiFetch<Person>(`/api/pessoas/${id}/desativar`, { method: 'POST' }),

    /** Rota pública: quem abre o link do convite ainda não tem sessão. */
    setPassword: (token: string, password: string) =>
      apiFetch<void>('/api/auth/definir-senha', {
        method: 'POST',
        json: { token, password },
        auth: false,
      }),
  },

  platform: {
    list: () =>
      apiFetch<import('@/lib/types').CondominiumSummary[]>('/api/condominios'),

    create: (body: {
      name: string;
      city?: string | null;
      state?: string | null;
      cnpj?: string | null;
      managerName: string;
      managerEmail: string;
    }) =>
      apiFetch<import('@/lib/types').CreateCondominiumResult>('/api/condominios', {
        method: 'POST',
        json: body,
      }),

    /** Gera o condomínio de demonstração. Chamar duas vezes não duplica. */
    seedDemo: () =>
      apiFetch<void>('/api/condominios/demonstracao', { method: 'POST' }),
  },

  suppliersAdmin: {
    create: (body: { name: string; document?: string | null; email?: string | null; phone?: string | null; notes?: string | null }) =>
      apiFetch<import('@/lib/types').Supplier>('/api/fornecedores', { method: 'POST', json: body }),

    update: (
      id: string,
      body: { name: string; document?: string | null; email?: string | null; phone?: string | null; notes?: string | null },
    ) => apiFetch<import('@/lib/types').Supplier>(`/api/fornecedores/${id}`, { method: 'PUT', json: body }),

    deactivate: (id: string) => apiFetch<void>(`/api/fornecedores/${id}`, { method: 'DELETE' }),
  },

  metering: {
    /** A folha da competência, com a leitura anterior já preenchida. */
    sheet: (competence: string, utility: MeteredUtility = 'Gas') =>
      apiFetch<MeterReadingSheet>('/api/medicoes', { query: { competence, utility } }),

    /** Grava a folha inteira, do jeito que ela é preenchida. */
    save: (body: {
      competence: string;
      utility: MeteredUtility;
      unitPrice: number;
      readOn?: string | null;
      readings: Array<{ unitId: string; previousReading?: number | null; currentReading?: number | null }>;
    }) => apiFetch<MeterReadingSheet>('/api/medicoes', { method: 'PUT', json: body }),
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
