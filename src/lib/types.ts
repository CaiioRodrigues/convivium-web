/**
 * Tipos espelhando os DTOs do convivium-api.
 *
 * A API serializa enums como texto (JsonStringEnumConverter), entao aqui eles
 * sao unioes de string literal: um valor novo no meio do enum do C# nao quebra
 * o cliente, e o TypeScript ainda verifica os casos.
 */

// --- Autenticacao ---

export type MembershipRole =
  | 'Resident'
  | 'Caretaker'
  | 'CouncilMember'
  | 'AssistantManager'
  | 'Manager'
  | 'Administrator';

export interface CondominiumAccess {
  id: string;
  name: string;
  role: MembershipRole;
}

export interface AuthenticatedPerson {
  id: string;
  name: string;
  email: string | null;
  isSuperAdmin: boolean;
}

export interface AuthResult {
  accessToken: string;
  expiresAt: string;
  refreshToken: string;
  person: AuthenticatedPerson;
  condominiums: CondominiumAccess[];
  activeCondominiumId: string | null;
  activeRole: MembershipRole | null;
}

// --- Paginacao ---

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
}

// --- Painel ---

export interface DashboardSummary {
  competence: string;
  totalBalance: number;
  operatingBalance: number;
  reserveFundBalance: number;
  monthRevenue: number;
  monthExpense: number;
  monthResult: number;
  pendingExpenses: number;
  overdueExpenses: number;
  pendingExpenseCount: number;
  openReceivables: number;
  overdueReceivables: number;
  overdueLateCharges: number;
  delinquentUnits: number;
  activeUnits: number;
  delinquencyRate: number;
  pendingEmails: number;
  failedEmails: number;
  billsAwaitingReview: number;
}

export interface CategorySlice {
  code: string;
  name: string;
  amount: number;
  share: number;
  entryCount: number;
}

export interface MonthlyPoint {
  competence: string;
  year: number;
  month: number;
  revenue: number;
  expense: number;
  result: number;
  closingBalance: number;
}

export interface SupplierSpending {
  supplierId: string | null;
  name: string;
  amount: number;
  expenseCount: number;
  share: number;
}

export type UtilityProvider = 'Cemig' | 'Copasa' | 'Gasmig' | 'Unknown';

export interface ConsumptionPoint {
  competence: string;
  consumption: number | null;
  unit: string;
  amount: number | null;
  unitPrice: number | null;
}

export interface ConsumptionSeries {
  provider: UtilityProvider;
  unit: string;
  points: ConsumptionPoint[];
  averageConsumption: number | null;
  averageAmount: number | null;
}

// --- Caixa ---

export type BankAccountKind = 'Checking' | 'Savings' | 'Investment' | 'Cash';
export type EntryDirection = 'In' | 'Out';
export type AccountNature = 'Revenue' | 'Expense';

export interface BankAccountSummary {
  id: string;
  name: string;
  kind: BankAccountKind;
  bankCode: string | null;
  agency: string | null;
  accountNumber: string | null;
  isReserveFund: boolean;
  isActive: boolean;
  openingBalance: number;
  currentBalance: number;
}

export interface CashPosition {
  totalBalance: number;
  operatingBalance: number;
  reserveFundBalance: number;
  accounts: BankAccountSummary[];
}

export interface LedgerAccountNode {
  id: string;
  code: string;
  name: string;
  nature: AccountNature;
  isGroup: boolean;
  isApportionable: boolean;
  isActive: boolean;
  children: LedgerAccountNode[];
}

export interface LedgerEntry {
  id: string;
  date: string;
  competence: string;
  description: string;
  direction: EntryDirection;
  amount: number;
  signedAmount: number;
  bankAccountId: string;
  bankAccountName: string;
  ledgerAccountId: string;
  ledgerAccountCode: string;
  ledgerAccountName: string;
  documentNumber: string | null;
  isReconciled: boolean;
  expenseId: string | null;
  paymentId: string | null;
}

export interface CashStatement {
  from: string;
  to: string;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  closingBalance: number;
  entries: LedgerEntry[];
}

// --- Despesas ---

export type ExpenseStatus = 'Pending' | 'Paid' | 'Cancelled';

export interface Expense {
  id: string;
  description: string;
  competence: string;
  dueDate: string;
  amount: number;
  status: ExpenseStatus;
  isApportionable: boolean;
  isOverdue: boolean;
  paidOn: string | null;
  ledgerAccountId: string;
  ledgerAccountCode: string;
  ledgerAccountName: string;
  supplierId: string | null;
  supplierName: string | null;
  documentNumber: string | null;
  notes: string | null;
  utilityBillId: string | null;
}

export interface ExpenseTotals {
  pending: number;
  paid: number;
  overdue: number;
  count: number;
}

export interface Supplier {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  expenseCount: number;
  notes: string | null;
}

// --- Cobrancas ---

export type BillingCycleStatus = 'Draft' | 'Closed' | 'Published' | 'Cancelled';
export type ApportionmentMethod = 'IdealFraction' | 'Equal' | 'Area';
export type ChargeStatus = 'Open' | 'PartiallyPaid' | 'Paid' | 'Overdue' | 'Cancelled';

export type ChargeItemKind =
  | 'CondoFee'
  | 'ReserveFund'
  | 'Metered'
  | 'Extraordinary'
  | 'LateFee'
  | 'Interest'
  | 'Penalty'
  | 'Extra'
  | 'Adjustment';

export interface BillingCycle {
  id: string;
  competence: string;
  dueDate: string;
  status: BillingCycleStatus;
  method: ApportionmentMethod;
  apportionableTotal: number;
  reserveFundRate: number;
  reserveFundTotal: number;
  chargedTotal: number;
  receivedTotal: number;
  chargeCount: number;
  paidCount: number;
  notes: string | null;
  closedAt: string | null;
  publishedAt: string | null;
}

export interface ChargeItem {
  id: string;
  kind: ChargeItemKind;
  description: string;
  amount: number;
}

export interface Charge {
  id: string;
  unitId: string;
  unitIdentifier: string;
  competence: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: ChargeStatus;
  paidOn: string | null;
  payerPersonId: string | null;
  payerName: string | null;
  payerEmail: string | null;
  payerPhone: string | null;
  pixPayload: string | null;
  publicToken: string;
  daysLate: number;
  lateFee: number;
  interest: number;
  totalWithLateCharges: number;
  items: ChargeItem[];
}

export interface ExpenseBreakdownLine {
  ledgerAccountCode: string;
  ledgerAccountName: string;
  amount: number;
  count: number;
}

export interface ApportionmentPreviewLine {
  unitId: string;
  unitIdentifier: string;
  idealFraction: number;
  condoFee: number;
  reserveFund: number;
  total: number;
  payerPersonId: string | null;
  payerName: string | null;
  payerEmail: string | null;
  /** Consumo medido da unidade, em reais. Não passa pelo rateio. */
  metered: number;
  /** O mesmo consumo em metros cúbicos. */
  meteredConsumption: number;
}

export interface ApportionmentPreview {
  competence: string;
  method: ApportionmentMethod;
  apportionableTotal: number;
  reserveFundRate: number;
  reserveFundTotal: number;
  chargedTotal: number;
  unitCount: number;
  expenseCount: number;
  expenses: ExpenseBreakdownLine[];
  units: ApportionmentPreviewLine[];
  warnings: string[];
  /** Soma do consumo individual, que entra nos boletos fora do rateio. */
  meteredTotal: number;
}

export interface DelinquentUnit {
  unitId: string;
  unitIdentifier: string;
  payerName: string | null;
  payerEmail: string | null;
  openCharges: number;
  outstandingAmount: number;
  lateCharges: number;
  oldestDueDate: string;
  maxDaysLate: number;
}

// --- Faturas de concessionaria ---

export type UtilityBillStatus = 'Parsed' | 'NeedsReview' | 'Converted' | 'Failed';

export interface UtilityBill {
  id: string;
  provider: UtilityProvider;
  sourceFileName: string;
  status: UtilityBillStatus;
  amount: number | null;
  dueDate: string | null;
  referenceMonth: string | null;
  installationCode: string | null;
  customerName: string | null;
  consumptionKwh: number | null;
  consumptionCubicMeters: number | null;
  barcodeLine: string | null;
  warnings: string[];
  expenseId: string | null;
  importedAt: string;
}

// --- Notificacoes ---

export type EmailStatus = 'Pending' | 'Sending' | 'Sent' | 'Failed' | 'Cancelled';

export type EmailKind =
  | 'ChargeIssued'
  | 'ChargeReminder'
  | 'ChargeOverdue'
  | 'PaymentReceipt'
  | 'Welcome'
  | 'PasswordReset'
  | 'Announcement';

export interface EmailMessage {
  id: string;
  kind: EmailKind;
  toAddress: string;
  toName: string | null;
  subject: string;
  status: EmailStatus;
  attempts: number;
  lastError: string | null;
  scheduledFor: string;
  sentAt: string | null;
  chargeId: string | null;
}

export interface EmailQueueResult {
  queued: number;
  skippedWithoutEmail: number;
  skipped: string[];
  hasSkipped: boolean;
}

/** Resposta de erro da API, no formato ProblemDetails (RFC 9457). */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  traceId?: string;
}

// --- Cadastro: condomínio ---

export type PixKeyType = 'Cpf' | 'Cnpj' | 'Email' | 'Phone' | 'Random';

export interface Address {
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface BillingSettings {
  dueDay: number;
  reserveFundRate: number;
  lateFeeRate: number;
  monthlyInterestRate: number;
  defaultApportionmentMethod: ApportionmentMethod;
}

export interface Condominium {
  id: string;
  name: string;
  legalName: string | null;
  cnpj: string | null;
  address: Address;
  billing: BillingSettings;
  pixKey: string | null;
  pixKeyType: PixKeyType | null;
  pixReceiverName: string | null;
  pixReceiverCity: string | null;
  isActive: boolean;
  unitCount: number;
  activeUnitCount: number;
  idealFractionSum: number;
}

// --- Cadastro: unidades ---

export type UnitKind = 'Apartment' | 'House' | 'Store' | 'Room' | 'ParkingSpot' | 'Storage';
export type OccupancyRelation = 'Owner' | 'Tenant' | 'Occupant';

export interface Block {
  id: string;
  name: string;
  unitCount: number;
}

export interface UnitOccupant {
  occupancyId: string;
  personId: string;
  name: string;
  email: string | null;
  relation: OccupancyRelation;
  isBillingResponsible: boolean;
}

export interface Unit {
  id: string;
  blockId: string | null;
  blockName: string | null;
  identifier: string;
  fullIdentifier: string;
  floor: number | null;
  kind: UnitKind;
  areaM2: number | null;
  idealFraction: number;
  isActive: boolean;
  occupants: UnitOccupant[];
  openChargeCount: number;
  outstandingAmount: number;
}

export interface UnitList {
  units: Unit[];
  blocks: Block[];
  idealFractionSum: number;
  idealFractionIsBalanced: boolean;
  warnings: string[];
}

export interface RedistributeResult {
  unitsAffected: number;
  idealFractionSum: number;
  units: Unit[];
}

// --- Cadastro: pessoas ---

export interface PersonUnit {
  occupancyId: string;
  unitId: string;
  unitIdentifier: string;
  relation: OccupancyRelation;
  isBillingResponsible: boolean;
}

export interface Person {
  id: string;
  name: string;
  email: string | null;
  cpf: string | null;
  phone: string | null;
  role: MembershipRole;
  isActive: boolean;
  canSignIn: boolean;
  hasPendingInvite: boolean;
  lastLoginAt: string | null;
  units: PersonUnit[];
}

export interface InviteResult {
  personId: string;
  email: string;
  expiresAt: string;
  inviteUrl: string;
}

// --- Plataforma: os condomínios em si ---

export interface CondominiumSummary {
  id: string;
  name: string;
  cnpj: string | null;
  city: string;
  isActive: boolean;
  unitCount: number;
  personCount: number;
  managerName: string | null;
  managerEmail: string | null;
  /** Verdadeiro enquanto o síndico não escolheu a senha. */
  managerPending: boolean;
}

export interface CreateCondominiumResult {
  condominiumId: string;
  name: string;
  managerId: string;
  managerEmail: string;
  /** Vazio quando o síndico já tinha acesso de outro condomínio. */
  inviteUrl: string;
  inviteExpiresAt: string;
}

// --- Medição individual ---

export type MeteredUtility = 'Gas' | 'Water';

export interface MeterReadingLine {
  unitId: string;
  unitIdentifier: string;
  previousReading: number;
  currentReading: number | null;
  consumption: number;
  amount: number;
  /** A leitura anterior veio do fechamento passado, não foi digitada aqui. */
  previousFromLastCompetence: boolean;
}

export interface MeterReadingSheet {
  competence: string;
  utility: MeteredUtility;
  unitPrice: number;
  readOn: string | null;
  lines: MeterReadingLine[];
  totalConsumption: number;
  totalAmount: number;
  pendingCount: number;
  /** Falso depois que o ciclo fecha: os valores já foram para os boletos. */
  isEditable: boolean;
}

// --- Prestação de contas ---

/** Quanto entrou ou saiu por conta do plano de contas. */
export interface StatementLine {
  code: string;
  name: string;
  amount: number;
  count: number;
  /** Fatia do total de receitas ou de despesas, de 0 a 1. */
  share: number;
}

export interface StatementAccountBalance {
  name: string;
  isReserveFund: boolean;
  opening: number;
  in: number;
  out: number;
  closing: number;
}

export interface StatementEntry {
  date: string;
  description: string;
  accountCode: string;
  accountName: string;
  bankAccountName: string;
  documentNumber: string | null;
  isIncome: boolean;
  amount: number;
  reconciled: boolean;
}

export interface DelinquencySummary {
  units: number;
  outstanding: number;
  lateCharges: number;
}

/**
 * Balancete de um mês, em regime de caixa.
 *
 * Pela data em que o dinheiro se moveu, e não pela competência contábil do
 * lançamento: é o que faz a conta fechar contra o extrato bancário.
 */
export interface MonthlyStatement {
  competence: string;
  from: string;
  to: string;
  condominiumName: string;
  cnpj: string | null;
  address: string;
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  result: number;
  closingBalance: number;
  income: StatementLine[];
  expenses: StatementLine[];
  accounts: StatementAccountBalance[];
  entries: StatementEntry[];
  delinquency: DelinquencySummary;
  warnings: string[];
}
