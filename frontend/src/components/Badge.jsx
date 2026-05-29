const styles = {
  todo: "bg-amber-100 text-amber-800",
  "in-progress": "bg-blue-100 text-blue-800",
  done: "bg-emerald-100 text-emerald-800",
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

export default function Badge({ value }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${styles[value] || "bg-slate-100 text-slate-700"}`}
    >
      {value}
    </span>
  );
}
