/**
 * The app inside a phone frame, drawn in DOM.
 *
 * A screenshot would be one more asset to keep in sync every time the home
 * changes — and it would blur on a 3x screen. This renders the real layout in
 * miniature: the gauge, the next-step row, the four tiles. It scales crisply
 * and it stays honest, because it is the same shape the person is about to see.
 */
const BASE_W = 190;
const BASE_H = 300;

export function PhoneMock({ width = BASE_W }: { width?: number }) {
  const s = width / BASE_W; // everything below is authored at 190px wide
  return (
    <div
      className="overflow-hidden rounded-[26px] border-[5px] border-foreground/85 bg-background shadow-2xl"
      style={{ width, height: BASE_H * s }}
    >
      <div
        style={{
          transform: `scale(${s})`,
          transformOrigin: "top left",
          width: BASE_W,
          height: BASE_H,
        }}
      >
        <div className="bg-muted/40 px-2.5 pb-3 pt-2">
          {/* status strip */}
          <div className="mb-1.5 flex items-center justify-between px-1">
            <span className="text-[6px] font-semibold text-muted-foreground">9:41</span>
            <span className="h-1.5 w-8 rounded-full bg-foreground/70" />
            <span className="text-[6px] text-muted-foreground">▮▮▮</span>
          </div>

          <div className="rounded-xl border border-border/60 bg-card px-3 py-2.5 text-center">
            <p className="text-[5.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Identity Score
            </p>
            <svg viewBox="0 0 200 118" className="mx-auto mt-0.5 w-[74%]">
              <defs>
                <linearGradient id="mock-arc" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#C7D2FE" />
                  <stop offset="60%" stopColor="#818CF8" />
                  <stop offset="100%" stopColor="#4338CA" />
                </linearGradient>
              </defs>
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="currentColor"
                className="text-muted"
                strokeWidth="13"
                strokeLinecap="round"
              />
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#mock-arc)"
                strokeWidth="13"
                strokeLinecap="round"
                strokeDasharray={Math.PI * 80}
                strokeDashoffset={Math.PI * 80 * 0.32}
              />
            </svg>
            <p className="-mt-6 text-[19px] font-extrabold leading-none text-foreground">68</p>
            <span
              className="mt-1 inline-block rounded-full px-1.5 py-0.5 text-[5px] font-bold"
              style={{ backgroundColor: "rgba(99,102,241,0.14)", color: "#6366F1" }}
            >
              RISCO MÉDIO
            </span>
            <p className="mt-1 text-[5.5px] font-semibold" style={{ color: "#4F46E5" }}>
              Meu Priva ID ›
            </p>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-2 py-1.5">
            <span
              className="grid h-4 w-4 shrink-0 place-items-center rounded-md"
              style={{ backgroundColor: "rgba(79,70,229,0.10)" }}
            >
              <img src="/PRIVA_mark.png" alt="" className="h-2.5 w-2.5 object-contain" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[6px] font-bold leading-tight text-foreground">
                Melhore sua proteção
              </span>
              <span className="block text-[5px] leading-tight text-muted-foreground">
                3 ações disponíveis
              </span>
            </span>
            <span
              className="rounded-full px-1 py-0.5 text-[4.5px] font-bold"
              style={{ backgroundColor: "rgba(16,185,129,0.12)", color: "#10B981" }}
            >
              +15
            </span>
          </div>

          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            {[
              { l: "CPF", s: "Nenhuma exposição", dot: "#10B981" },
              { l: "E-mail", s: "1 vazamento", dot: "#EF4444" },
              { l: "Telefone", s: "Nenhuma exposição", dot: "#10B981" },
              { l: "Endereço", s: "Nenhuma exposição", dot: "#10B981" },
            ].map((c) => (
              <div key={c.l} className="rounded-lg border border-border/60 bg-card p-1.5">
                <div className="flex items-start justify-between">
                  <span className="h-3 w-3 rounded bg-secondary" />
                  <span className="h-1 w-1 rounded-full" style={{ backgroundColor: c.dot }} />
                </div>
                <p className="mt-1 text-[6px] font-bold leading-none text-foreground">{c.l}</p>
                <p className="text-[4.5px] leading-tight text-muted-foreground">{c.s}</p>
              </div>
            ))}
          </div>

          <div className="mt-1.5 flex items-center justify-around rounded-lg bg-card py-1">
            {["Início", "Proteção", "", "Atividade", "Perfil"].map((t, k) =>
              t ? (
                <span key={t} className="text-[4.5px] text-muted-foreground">
                  {t}
                </span>
              ) : (
                <span
                  key={k}
                  className="grid h-4 w-4 place-items-center rounded-full"
                  style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
                >
                  <img src="/PRIVA_mark.png" alt="" className="h-2 w-2 object-contain" />
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
