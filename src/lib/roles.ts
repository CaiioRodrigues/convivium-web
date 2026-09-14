import type { MembershipRole } from '@/lib/types';

/**
 * Peso de cada papel, na mesma ordem do enum MembershipRole da API.
 * Comparar numeros deixa a hierarquia explicita: conselho e tudo acima
 * enxergam as contas, morador enxerga so o que e dele.
 */
const WEIGHT: Record<MembershipRole, number> = {
  Resident: 1,
  Caretaker: 2,
  CouncilMember: 3,
  AssistantManager: 4,
  Manager: 5,
  Administrator: 6,
};

export const ROLE_LABEL: Record<MembershipRole, string> = {
  Resident: 'Morador',
  Caretaker: 'Zelador',
  CouncilMember: 'Conselho fiscal',
  AssistantManager: 'Subsíndico',
  Manager: 'Síndico',
  Administrator: 'Administradora',
};

export function atLeast(role: MembershipRole | null, minimum: MembershipRole): boolean {
  return role !== null && WEIGHT[role] >= WEIGHT[minimum];
}

/** Conselho fiscal para cima: leitura completa da prestação de contas. */
export function canSeeAccounts(role: MembershipRole | null): boolean {
  return atLeast(role, 'CouncilMember');
}

/** Subsíndico para cima: pode lançar despesa e movimentar o caixa. */
export function canManageFinance(role: MembershipRole | null): boolean {
  return atLeast(role, 'AssistantManager');
}

/** Síndico ou administradora: fecha rateio e altera o condomínio. */
export function canManageCondominium(role: MembershipRole | null): boolean {
  return atLeast(role, 'Manager');
}
