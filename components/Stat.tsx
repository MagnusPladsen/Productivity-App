type StatProps = {
  label: string;
  value: string;
};

export default function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-2xl bg-white/70 border border-black/5 px-4 py-3">
      <div className="text-lg font-semibold text-black">{value}</div>
      <div className="text-xs uppercase tracking-[0.2em] text-black/50">{label}</div>
    </div>
  );
}
