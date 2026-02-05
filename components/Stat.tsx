type StatProps = {
  label: string;
  value: string;
};

export default function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-2xl bg-paper border border-ink/10 px-4 py-3 shadow-lift">
      <div className="text-lg font-semibold text-ink">{value}</div>
      <div className="text-xs uppercase tracking-[0.2em] text-ink/50">{label}</div>
    </div>
  );
}
