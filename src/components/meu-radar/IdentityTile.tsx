import { useState, type ComponentType } from "react";
import { Check, Lock, Pencil, X } from "lucide-react";

/**
 * One identity tile, with the same flip the Priva ID uses.
 *
 * Tapping opens the card in place instead of throwing a sheet over the screen:
 * the person stays where they are, and the home stays a surface you poke at
 * rather than a menu that launches dialogs.
 *
 * Back face, in order of what the person needs:
 *   has data  → show it; tap again to edit
 *   no data   → say what is missing and take it right there
 *   locked    → say which plan it belongs to, nothing more
 *
 * Front stays in normal flow and defines the box; the back is absolute over
 * it, so both faces are the same size whatever the grid does to the row.
 */
export type IdentityTileProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  /** Front line — what we found. */
  status: string;
  /** Dot colour on the front. */
  dot: string;
  /** Value to show on the back, empty when there is nothing on file. */
  value?: string;
  /** Shown on the back when there is no value. */
  emptyText?: string;
  placeholder?: string;
  onSave?: (v: string) => void;
  locked?: boolean;
  lockedText?: string;
  onLockedTap?: () => void;
};

export function IdentityTile({
  icon: Icon,
  label,
  status,
  dot,
  value = "",
  emptyText = "",
  placeholder = "",
  onSave,
  locked = false,
  lockedText = "",
  onLockedTap,
}: IdentityTileProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const close = () => {
    setOpen(false);
    setEditing(false);
  };

  const save = () => {
    onSave?.(draft.trim());
    setEditing(false);
  };

  // No value and not locked: the back opens straight into the field, since
  // asking someone to tap twice to fill an empty box is just friction.
  const showInput = !locked && (editing || (open && !value));

  return (
    <div style={{ perspective: "1200px" }}>
      <div
        className="relative transition-transform duration-500 ease-[cubic-bezier(0.4,0.15,0.2,1)]"
        style={{
          transformStyle: "preserve-3d",
          transform: open
            ? "rotateY(180deg) translateZ(0.01px)"
            : "rotateY(0deg) translateZ(0.01px)",
        }}
      >
        {/* FRONT */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
          className="cursor-pointer rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm transition-all duration-200 active:scale-[0.98]"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            opacity: open ? 0 : 1,
            transition: "opacity 0s linear 250ms",
          }}
          aria-hidden={open}
        >
          <div className="flex items-start justify-between">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary">
              <Icon className="h-4 w-4 text-foreground" />
            </span>
            {locked ? (
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dot }} />
            )}
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">{label}</p>
          <p
            className="mt-0.5 whitespace-pre-line text-[11px] leading-tight"
            style={{ color: locked ? "var(--color-navy)" : "var(--color-muted-foreground)" }}
          >
            {locked ? lockedText : status}
          </p>
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 flex flex-col rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            opacity: open ? 1 : 0,
            transition: "opacity 0s linear 250ms",
            pointerEvents: open ? undefined : "none",
          }}
          aria-hidden={!open}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <button
              onClick={close}
              aria-label="Fechar"
              className="-mr-1 -mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {locked ? (
            <button
              onClick={onLockedTap}
              className="mt-2 flex-1 text-left text-[12.5px] font-semibold leading-snug"
              style={{ color: "var(--color-navy)" }}
            >
              {lockedText}
            </button>
          ) : showInput ? (
            <div className="mt-2 flex flex-1 flex-col justify-center">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                placeholder={placeholder}
                className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-indigo-500"
              />
              <button
                onClick={save}
                className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[12.5px] font-bold text-white"
                style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
              >
                <Check className="h-3.5 w-3.5" /> Salvar
              </button>
            </div>
          ) : value ? (
            <button
              onClick={() => {
                setDraft(value);
                setEditing(true);
              }}
              className="mt-2 flex flex-1 flex-col justify-center text-left"
            >
              <span className="break-all text-[13.5px] font-semibold leading-snug text-foreground">
                {value}
              </span>
              <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Pencil className="h-3 w-3" /> Editar
              </span>
            </button>
          ) : (
            <p className="mt-2 flex-1 text-[12px] leading-snug text-muted-foreground">
              {emptyText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
