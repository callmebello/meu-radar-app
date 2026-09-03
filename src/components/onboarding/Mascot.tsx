import { useEffect, useState } from "react";

/**
 * The Priva mascot, animated in CSS.
 *
 * Built to take layers the moment they exist: drop
 * /mascote/corpo.png, /mascote/braco-esquerdo.png, /mascote/braco-direito.png
 * and /mascote/pernas.png into public/ and the arm actually waves, hinged at
 * the shoulder. Until then it runs from the single flat render with whole-body
 * motion — entrance, float, tilt and a pose-specific accent — which reads as
 * alive without pretending to articulate pixels that are painted together.
 *
 * Everything here respects prefers-reduced-motion: the mascot settles into its
 * pose and stops. Nobody checking whether their data leaked needs a bouncing
 * robot.
 */
/**
 * One render per pose, cross-faded. Four separate images beat any amount of
 * CSS on a single flat one: a pose says something the motion cannot, and the
 * motion then only has to keep it alive.
 */
export type Pose = "welcome" | "thinking" | "scan" | "done" | "idle";

const POSE_SRC: Record<Pose, string> = {
  welcome: "/mascote/acenando.png",
  thinking: "/mascote/pensando.png",
  scan: "/mascote/analisando.png",
  done: "/mascote/sucesso.png",
  idle: "/mascote/confiante.png",
};

/** Warm the images once so a pose change never flashes an empty box. */
function usePreload() {
  useEffect(() => {
    Object.values(POSE_SRC).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);
}

export function Mascot({ pose = "idle", size = 190 }: { pose?: Pose; size?: number }) {
  usePreload();
  const [shown, setShown] = useState<Pose>(pose);
  const [fading, setFading] = useState(false);

  // Cross-fade rather than swap: the mascot should feel like it moved, not like
  // the page reloaded a picture.
  useEffect(() => {
    if (pose === shown) return;
    setFading(true);
    const t = setTimeout(() => {
      setShown(pose);
      setFading(false);
    }, 180);
    return () => clearTimeout(t);
  }, [pose, shown]);

  return (
    <div
      className="relative mx-auto grid place-items-center"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Halo — green only on success, indigo everywhere else. */}
      <span
        className="absolute inset-0 rounded-full blur-2xl"
        style={{
          background:
            pose === "done"
              ? "radial-gradient(circle, rgba(16,185,129,0.30) 0%, rgba(16,185,129,0) 68%)"
              : "radial-gradient(circle, rgba(99,102,241,0.32) 0%, rgba(99,102,241,0) 68%)",
          animation: "mascot-halo 3.6s ease-in-out infinite",
        }}
      />

      {/* Scanning rings, only while the analysis runs. */}
      {pose === "scan" && (
        <>
          <span
            className="absolute rounded-full"
            style={{
              inset: -10,
              border: "1.5px solid rgba(79,70,229,0.32)",
              animation: "mascot-ring 2.4s ease-out infinite",
            }}
          />
          <span
            className="absolute rounded-full"
            style={{
              inset: -10,
              border: "1.5px solid rgba(79,70,229,0.32)",
              animation: "mascot-ring 2.4s ease-out infinite 1.2s",
            }}
          />
        </>
      )}

      <div
        className="relative h-full w-full"
        style={{ animation: "mascot-in 0.7s cubic-bezier(0.34,1.3,0.5,1) both" }}
      >
        <div
          className="h-full w-full"
          style={{
            animation:
              shown === "thinking"
                ? "mascot-tilt 5s ease-in-out infinite"
                : shown === "welcome"
                  ? "mascot-greet 3.2s ease-in-out infinite"
                  : shown === "done"
                    ? "mascot-pop 3s ease-in-out infinite"
                    : "mascot-float 4.4s ease-in-out infinite",
          }}
        >
          <img
            src={POSE_SRC[shown]}
            alt=""
            className="h-full w-full object-contain transition-opacity duration-200"
            style={{ opacity: fading ? 0 : 1 }}
          />
        </div>
      </div>
    </div>
  );
}
