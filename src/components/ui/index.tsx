import type { ComponentProps, ReactNode } from 'react';

/** Junta classes ignorando valores falsos, sem precisar de dependencia. */
export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

// --- Superficies ---

export function Card({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      {...props}
      className={cx(
        'rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]',
        className,
      )}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

// --- Botoes ---

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-ink-inverse hover:bg-brand-strong',
  secondary: 'border border-line-strong bg-surface text-ink hover:bg-surface-muted',
  ghost: 'text-ink-muted hover:bg-surface-muted hover:text-ink',
  danger: 'bg-negative text-white hover:opacity-90',
};

export function Button({
  variant = 'primary',
  className,
  ...props
}: ComponentProps<'button'> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
        'transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        BUTTON_VARIANTS[variant],
        className,
      )}
    />
  );
}

// --- Formulario ---

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-sm text-negative">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-sm text-ink-subtle">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      {...props}
      className={cx(
        'w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink',
        'placeholder:text-ink-subtle focus:border-brand focus:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      {...props}
      className={cx(
        'w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink',
        'focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    />
  );
}

// --- Sinalizacao ---

export type Tone = 'neutral' | 'brand' | 'positive' | 'negative' | 'warning' | 'info';

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-muted text-ink-muted',
  brand: 'bg-brand-soft text-brand',
  positive: 'bg-positive-soft text-positive',
  negative: 'bg-negative-soft text-negative',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
};

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: ComponentProps<'span'> & { tone?: Tone }) {
  return (
    <span
      {...props}
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
    />
  );
}

export function Alert({
  tone = 'info',
  title,
  children,
}: {
  tone?: Tone;
  title?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={cx('rounded-lg px-4 py-3 text-sm', TONES[tone])}
      /*
       * Erro e anunciado na hora; o resto espera o leitor de tela ficar ocioso.
       * "Senha nao confere" ou "CNPJ invalido" chegando depois, quando a pessoa
       * ja seguiu para o proximo campo, nao serve para nada.
       */
      role={tone === 'negative' ? 'alert' : 'status'}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? 'mt-0.5' : undefined}>{children}</div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

// --- Tabela ---

export function Table({ className, ...props }: ComponentProps<'table'>) {
  return (
    <div className="w-full overflow-x-auto">
      {/*
        No celular a tabela mantém a largura do conteúdo e rola de lado: espremer
        cinco colunas em 390px deixaria tudo ilegível. Da largura de tablet para
        cima ela passa a caber na tela — sem isso, a coluna de ações de cada linha
        ficava fora do campo de visão num monitor, com espaço de sobra ao lado.
      */}
      <table {...props} className={cx('w-full min-w-max text-sm md:min-w-full', className)} />
    </div>
  );
}

export function Th({ className, numeric, ...props }: ComponentProps<'th'> & { numeric?: boolean }) {
  return (
    <th
      {...props}
      className={cx(
        'border-b border-line px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-subtle uppercase',
        numeric ? 'text-right' : 'text-left',
        className,
      )}
    />
  );
}

export function Td({ className, numeric, ...props }: ComponentProps<'td'> & { numeric?: boolean }) {
  return (
    <td
      {...props}
      className={cx(
        'border-b border-line px-4 py-2.5 text-ink',
        numeric ? 'tabular text-right whitespace-nowrap' : '',
        className,
      )}
    />
  );
}

// --- Indicadores ---

export function Stat({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
}) {
  const valueColor: Record<Tone, string> = {
    neutral: 'text-ink',
    brand: 'text-brand',
    positive: 'text-positive',
    negative: 'text-negative',
    warning: 'text-warning',
    info: 'text-info',
  };

  return (
    <div className="rounded-xl border border-line bg-surface px-5 py-4">
      <p className="text-xs font-medium tracking-wide text-ink-subtle uppercase">{label}</p>
      <p className={cx('tabular mt-1.5 text-2xl font-semibold', valueColor[tone])}>{value}</p>
      {hint ? <p className="mt-1 text-sm text-ink-muted">{hint}</p> : null}
    </div>
  );
}
