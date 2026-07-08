// Inline "Você quis dizer …?" hint shown under an e-mail field (Gmail-style).
// Purely a suggestion: clicking accepts the fix; ignoring keeps the original.
export function EmailTypoHint({ suggestion, onAccept }: { suggestion: string; onAccept: () => void }) {
  return (
    <p className="mt-1.5 text-xs text-gray-400">
      Você quis dizer{" "}
      <button
        type="button"
        onClick={onAccept}
        className="font-semibold text-indigo-500 underline underline-offset-2 hover:text-indigo-400"
      >
        {suggestion}
      </button>
      ?
    </p>
  );
}
