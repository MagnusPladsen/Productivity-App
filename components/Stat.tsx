type StatProps = {
  label: string;
  value: string;
};

export default function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
      <div className="text-lg font-semibold text-white">{value}</div>
      <div className="text-xs uppercase tracking-[0.2em] text-white/50">{label}</div>
    </div>
  );
}
