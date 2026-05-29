export default function Toast({ message, type = "success" }) {
  if (!message) {
    return null;
  }

  const colors =
    type === "error"
      ? "bg-red-600"
      : "bg-emerald-600";

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 min-w-60 max-w-md rounded-xl px-4 py-3 text-white shadow-xl ${colors}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
