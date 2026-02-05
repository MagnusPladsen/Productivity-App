type StripItem = {
  label: string;
  value: string;
  emphasis?: boolean;
};

type HeroDataStripProps = {
  items: StripItem[];
  updatedAtLabel: string;
  repoFullName?: string;
};

export default function HeroDataStrip({ items, updatedAtLabel, repoFullName }: HeroDataStripProps) {
  return (
    <section className="section-card paper-panel grid-stamp p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="eyebrow">Snapshot</span>
          {repoFullName ? (
            <span className="text-xs uppercase tracking-[0.2em] text-ink/50">{repoFullName}</span>
          ) : null}
        </div>
        <div className="stamp bg-paper/80 shadow-lift">Last updated {updatedAtLabel}</div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => {
          const isAlt = index % 2 === 1;
          return (
            <div
              key={`${item.label}-${item.value}`}
              className={`rounded-2xl border px-4 py-3 ${
                isAlt
                  ? 'border-ink/15 bg-paper shadow-lift'
                  : 'border-ink/10 bg-paper/70'
              }`}
            >
              <div
                className={`text-lg font-semibold ${
                  item.emphasis ? 'text-ink' : 'text-ink/80'
                }`}
              >
                {item.value}
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-ink/55">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
