export default function Pagination({ skip, take, total, onPrev, onNext }) {
  const currentPage = Math.floor(skip / take) + 1;
  const totalPages = Math.max(Math.ceil(total / take), 1);

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onPrev}
        disabled={skip <= 0}
        className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-sm text-slate-600">
        Page {currentPage} of {totalPages} ({total} total)
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={skip + take >= total}
        className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
