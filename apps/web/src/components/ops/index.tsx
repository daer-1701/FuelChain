'use client';

/**
 * FuelChain ops patterns — reusable control-room language.
 * Designed for ANH first; reuse on Estación / Chofer / Auditor / Ciudadano.
 *
 * - StatusPill / tones: estado nunca solo por color
 * - MetricRail: franja de indicadores (no card grid SaaS)
 * - OpsBoard + OpsSignalRow + ContextPanel: lista señales + detalle
 * - TraceTimeline / JourneyStepper: trazabilidad del camino
 * - FillGauge / DataPair: cantidad y pares densos
 */
import type { ReactNode } from 'react';

export type StatusTone = 'ok' | 'warn' | 'danger' | 'mute' | 'info';

const TONE: Record<
  StatusTone,
  { text: string; border: string; bg: string; dot: string }
> = {
  ok: {
    text: 'text-[var(--seal)]',
    border: 'border-[var(--seal)]',
    bg: 'bg-[var(--seal-soft)]',
    dot: 'bg-[var(--seal)]',
  },
  warn: {
    text: 'text-[var(--diesel)]',
    border: 'border-[var(--diesel)]',
    bg: 'bg-[var(--diesel-soft)]',
    dot: 'bg-[var(--diesel)]',
  },
  danger: {
    text: 'text-[var(--alarm)]',
    border: 'border-[var(--alarm)]',
    bg: 'bg-[var(--alarm-soft)]',
    dot: 'bg-[var(--alarm)]',
  },
  mute: {
    text: 'text-[var(--mute)]',
    border: 'border-[var(--rail)]',
    bg: 'bg-transparent',
    dot: 'bg-[var(--mute)]',
  },
  info: {
    text: 'text-[var(--ink)]',
    border: 'border-[var(--ink)]',
    bg: 'bg-[var(--paper)]',
    dot: 'bg-[var(--ink)]',
  },
};

/** Status = label + color (+ optional mark). Never color alone. */
export function StatusPill({
  label,
  tone = 'mute',
  pulse = false,
  className = '',
}: {
  label: string;
  tone?: StatusTone;
  pulse?: boolean;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-display text-[0.65rem] font-bold uppercase tracking-wide ${t.text} ${t.border} ${t.bg} ${className}`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 shrink-0 ${t.dot} ${pulse ? 'fc-ops-pulse' : ''}`}
      />
      {label}
    </span>
  );
}

export function qualityToneFrom(
  tone: 'OK' | 'ALERTA' | 'RECHAZADO' | 'SIN_DATO' | string,
): StatusTone {
  if (tone === 'OK') return 'ok';
  if (tone === 'ALERTA') return 'warn';
  if (tone === 'RECHAZADO') return 'danger';
  return 'mute';
}

export function anchorToneFrom(status: string): StatusTone {
  if (status === 'CONFIRMED') return 'ok';
  if (status === 'FAILED') return 'danger';
  if (status === 'PENDING') return 'warn';
  return 'mute';
}

export function MetricRail({
  items,
  className = '',
}: {
  items: Array<{
    label: string;
    value: string;
    tone?: StatusTone;
    hint?: string;
  }>;
  className?: string;
}) {
  return (
    <div
      className={`fc-ops-rail grid gap-px overflow-hidden border-2 border-[var(--ink)] bg-[var(--ink)] sm:grid-cols-2 lg:grid-cols-4 ${className}`}
      role="group"
      aria-label="Indicadores de red"
    >
      {items.map((item) => {
        const warn = item.tone === 'warn' || item.tone === 'danger';
        return (
          <div
            key={item.label}
            className="bg-[var(--paper)] px-4 py-3.5 fc-ops-rise"
          >
            <p className="fc-meta uppercase tracking-wide">{item.label}</p>
            <p
              className={`mt-1 font-display text-3xl font-black tabular-nums leading-none ${
                warn
                  ? item.tone === 'danger'
                    ? 'text-[var(--alarm)]'
                    : 'text-[var(--diesel)]'
                  : 'text-[var(--ink)]'
              }`}
            >
              {item.value}
            </p>
            {item.hint ? (
              <p className="mt-1.5 text-[0.7rem] text-[var(--mute)]">{item.hint}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function FillGauge({
  percent,
  label,
  className = '',
}: {
  percent: number;
  label?: string;
  className?: string;
}) {
  const p = Math.min(100, Math.max(0, percent));
  return (
    <div className={className}>
      {label ? (
        <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
          <span className="text-[var(--mute)]">{label}</span>
          <span className="font-semibold tabular-nums">{Math.round(p)}%</span>
        </div>
      ) : null}
      <div
        className="h-2.5 w-full border border-[var(--ink)] bg-[var(--haze)]"
        role="progressbar"
        aria-valuenow={Math.round(p)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? `Nivel ${Math.round(p)}%`}
      >
        <div
          className="h-full bg-[var(--diesel)] transition-[width] duration-700 ease-out"
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  );
}

export type TraceStep = {
  id: string;
  title: string;
  meta?: string;
  detail?: string;
  at?: string;
  alert?: boolean;
  done?: boolean;
};

export function TraceTimeline({
  steps,
  className = '',
}: {
  steps: TraceStep[];
  className?: string;
}) {
  if (!steps.length) {
    return (
      <p className={`text-sm text-[var(--mute)] ${className}`}>
        Sin tramos registrados todavía.
      </p>
    );
  }
  return (
    <ol className={`relative space-y-0 border-l-2 border-[var(--ink)] pl-5 ${className}`}>
      {steps.map((s, i) => (
        <li
          key={s.id}
          className="relative pb-5 last:pb-0 fc-ops-rise"
          style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
        >
          <span
            aria-hidden
            className={`absolute -left-[1.55rem] top-1.5 h-3 w-3 border-2 border-[var(--ink)] ${
              s.alert
                ? 'bg-[var(--alarm)]'
                : s.done === false
                  ? 'bg-[var(--paper)]'
                  : 'bg-[var(--diesel)]'
            }`}
          />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-display text-sm font-bold leading-snug">
              {s.title}
            </p>
            {s.at ? (
              <time className="text-[0.7rem] text-[var(--mute)]">{s.at}</time>
            ) : null}
          </div>
          {s.meta ? (
            <p className="mt-0.5 text-sm tabular-nums text-[var(--ink)]">{s.meta}</p>
          ) : null}
          {s.detail ? (
            <p className="mt-0.5 text-xs text-[var(--mute)]">{s.detail}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function JourneyStepper({
  steps,
  className = '',
}: {
  steps: Array<{ id: string; label: string; done: boolean }>;
  className?: string;
}) {
  return (
    <ol
      className={`grid gap-2 ${className}`}
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      aria-label="Progreso del viaje"
    >
      {steps.map((k, i) => (
        <li key={k.id} className="relative text-center">
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className={`absolute left-[calc(50%+14px)] right-[-50%] top-3 h-0.5 ${
                k.done ? 'bg-[var(--diesel)]' : 'bg-[var(--rail)]/50'
              }`}
            />
          )}
          <span
            className={`relative z-[1] mx-auto flex h-6 w-6 items-center justify-center border-2 text-xs font-bold ${
              k.done
                ? 'border-[var(--diesel)] bg-[var(--diesel)] text-[var(--paper)]'
                : 'border-[var(--rail)] bg-[var(--paper)] text-[var(--mute)]'
            }`}
          >
            {i + 1}
          </span>
          <p
            className={`mt-2 text-xs font-semibold ${
              k.done ? 'text-[var(--ink)]' : 'text-[var(--mute)]'
            }`}
          >
            {k.label}
          </p>
        </li>
      ))}
    </ol>
  );
}

/** Control-room split: signal list + contextual detail. */
export function OpsBoard({
  rail,
  detail,
  className = '',
}: {
  rail: ReactNode;
  detail: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grid gap-0 overflow-hidden border-2 border-[var(--ink)] lg:grid-cols-[minmax(0,17rem)_1fr] ${className}`}
    >
      <aside className="border-b-2 border-[var(--ink)] bg-[color-mix(in_srgb,var(--paper)_85%,var(--haze))] lg:border-b-0 lg:border-r-2 lg:border-[var(--ink)]">
        {rail}
      </aside>
      <div className="min-w-0 bg-[color-mix(in_srgb,var(--paper)_96%,white)]">
        {detail}
      </div>
    </div>
  );
}

export function OpsSignalRow({
  active,
  title,
  subtitle,
  onClick,
  trailing,
}: {
  active: boolean;
  title: string;
  subtitle: ReactNode;
  onClick: () => void;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-current={active ? 'true' : undefined}
      className={`flex w-full items-start gap-2 border-b border-[var(--rail)]/35 px-3 py-3 text-left transition-colors ${
        active
          ? 'bg-[var(--diesel-soft)]'
          : 'hover:bg-[var(--paper)]'
      }`}
    >
      <span
        aria-hidden
        className={`mt-1.5 h-2 w-2 shrink-0 ${
          active ? 'bg-[var(--diesel)] fc-ops-pulse' : 'bg-[var(--rail)]'
        }`}
      />
      <span className="min-w-0 flex-1">
        <span className="block font-display text-sm font-bold leading-tight">
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-[var(--mute)]">{subtitle}</span>
      </span>
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </button>
  );
}

export function ContextPanel({
  code,
  title,
  subtitle,
  children,
  actions,
}: {
  code?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <article className="fc-ops-rise space-y-6 p-5 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--rail)]/40 pb-4">
        <div className="min-w-0">
          {code ? (
            <p className="fc-stamp text-[var(--mute)]">{code}</p>
          ) : null}
          <h2 className="mt-1 font-display text-2xl font-black leading-tight tracking-tight">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-[var(--mute)]">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </header>
      {children}
    </article>
  );
}

export function DataPair({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-t border-[var(--rail)]/40 pt-3 first:border-t-0 first:pt-0 ${className}`}
    >
      <p className="fc-meta uppercase tracking-wide">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function severityToneFrom(severity: string): StatusTone {
  const s = severity.toUpperCase();
  if (s === 'HIGH' || s === 'CRITICAL' || s === 'ALTA') return 'danger';
  if (s === 'MEDIUM' || s === 'MEDIO' || s === 'WARN') return 'warn';
  if (s === 'LOW' || s === 'BAJA') return 'ok';
  return 'mute';
}

export function riskToneFrom(risk: string): StatusTone {
  const s = risk.toUpperCase();
  if (s === 'HIGH' || s === 'ALTO') return 'danger';
  if (s === 'MEDIUM' || s === 'MEDIO') return 'warn';
  if (s === 'LOW' || s === 'BAJO') return 'ok';
  return 'mute';
}

export function OpsPageHeader({
  stamp,
  title,
  lede,
  actions,
  className = '',
}: {
  stamp?: string;
  title: string;
  lede?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={`flex flex-wrap items-end justify-between gap-4 border-b-2 border-[var(--ink)] pb-5 ${className}`}
    >
      <div className="fc-page-header !max-w-2xl !border-0 !pb-0">
        {stamp ? (
          <p className="fc-stamp text-[var(--mute)]">{stamp}</p>
        ) : null}
        <h1 className="fc-title fc-title-lg mt-2">{title}</h1>
        {lede ? <div className="fc-lede">{lede}</div> : null}
      </div>
      {actions ? (
        <nav className="flex flex-wrap gap-2" aria-label="Acciones de vista">
          {actions}
        </nav>
      ) : null}
    </header>
  );
}

/** Dense key/value grid — replaces ad-hoc dl cards. */
export function SpecGrid({
  items,
  className = '',
}: {
  items: Array<{ label: string; value: ReactNode }>;
  className?: string;
}) {
  return (
    <dl
      className={`grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3 ${className}`}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0 border-t border-[var(--rail)]/35 pt-2">
          <dt className="fc-meta uppercase tracking-wide">{item.label}</dt>
          <dd className="mt-1 break-words font-medium text-[var(--ink)]">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
