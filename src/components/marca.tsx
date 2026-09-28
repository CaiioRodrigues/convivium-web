/**
 * A marca da Logement.
 *
 * Fica num componente só para o nome aparecer escrito uma vez no projeto
 * inteiro. Trocar de marca de novo — ou assinar uma tela com o nome de um
 * cliente — vira uma edição, não uma caçada por string solta.
 *
 * O símbolo é o mesmo arquivo do favicon (`src/app/icon.svg`), redesenhado
 * aqui em JSX para herdar tamanho e não custar uma requisição.
 */

/** O verde da marca. Igual ao de `src/app/icon.svg`, que é o favicon. */
const VERDE = '#0f766e';

const TAMANHOS = {
  sm: { simbolo: 22, nome: 'text-lg', descritor: 'text-[9px]' },
  md: { simbolo: 28, nome: 'text-xl', descritor: 'text-[10px]' },
  lg: { simbolo: 34, nome: 'text-2xl', descritor: 'text-[11px]' },
} as const;

/** Só o desenho, sem o nome. Serve de ícone onde o espaço é apertado. */
export function Simbolo({ tamanho = 28 }: { tamanho?: number }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Verde fixo, e não o token --color-brand: no modo escuro o token vira
          verde-claro, e as janelas brancas sobre ele perderiam contraste.
          Marca boa não muda de cor com o tema da página. */}
      <rect width="32" height="32" rx="7.5" fill={VERDE} />
      {/* Silhueta em degrau: dois blocos de alturas diferentes, que é o que
          uma administradora enxerga da rua — vários prédios, não um só. */}
      <path
        fill="#fff"
        d="M6.5 25.5V15.25c0-.55.45-1 1-1h5.25V9.5c0-.55.45-1 1-1h11.75c.55 0 1 .45 1 1v16H6.5Z"
      />
      {/* Cinco janelas, e não dez: a 16px de favicon, mais que isso vira
          textura cinza e o prédio deixa de ser prédio. */}
      <g fill={VERDE}>
        <rect x="9" y="18.5" width="2.5" height="2.5" rx=".6" />
        <rect x="15.75" y="12" width="2.5" height="2.5" rx=".6" />
        <rect x="20.25" y="12" width="2.5" height="2.5" rx=".6" />
        <rect x="15.75" y="18.5" width="2.5" height="2.5" rx=".6" />
        <rect x="20.25" y="18.5" width="2.5" height="2.5" rx=".6" />
      </g>
    </svg>
  );
}

export function Marca({
  tamanho = 'md',
  descritor = false,
  className = '',
}: {
  tamanho?: keyof typeof TAMANHOS;
  /** Acrescenta "Administradora" embaixo do nome. */
  descritor?: boolean;
  className?: string;
}) {
  const t = TAMANHOS[tamanho];

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Simbolo tamanho={t.simbolo} />

      <span className="leading-none">
        <span className={`block font-semibold tracking-tight text-brand ${t.nome}`}>
          Logement
        </span>

        {descritor ? (
          <span
            className={`mt-1 block tracking-[0.14em] text-ink-subtle uppercase ${t.descritor}`}
          >
            Administradora
          </span>
        ) : null}
      </span>
    </span>
  );
}
