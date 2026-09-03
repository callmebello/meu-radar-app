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
export type Pose = "welcome" | "scan" | "thinking" | "done" | "idle";

const LAYERS = {
  body: "/mascote/corpo.png",
  armLeft: "/mascote/braco-esquerdo.png",
  armRight: "/mascote/braco-direito.png",
  legs: "/mascote/pernas.png",
};

function useLayered() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.onload = () => alive && setOk(true);
    img.onerror = () => alive && setOk(false);
    img.src = LAYERS.body;
    return () => {
      alive = false;
    };
  }, []);
  return ok;
}

export function Mascot({ pose = "idle", size = 190 }: { pose?: Pose; size?: number }) {
  const layered = useLayered();

  return (
    <div
      className="relative mx-auto grid place-items-center"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Halo — the only thing that changes colour with the pose, so the
          mascot itself never has to be re-rendered per screen. */}
      <span
        className="absolute inset-0 rounded-full blur-2xl"
        style={{
          background:
            pose === "done"
              ? "radial-gradient(circle, rgba(16,185,129,0.30) 0%, rgba(16,185,129,0) 68%)"
              : "radial-gradient(circle, rgba(99,102,241,0.30) 0%, rgba(99,102,241,0) 68%)",
          animation: "mascot-halo 3.6s ease-in-out infinite",
        }}
      />

      {/* Scanning ring, only while the analysis runs. */}
      {pose === "scan" && (
        <>
          <span
            className="absolute rounded-full"
            style={{
              inset: -6,
              border: "1.5px solid rgba(79,70,229,0.30)",
              animation: "mascot-ring 2.4s ease-out infinite",
            }}
          />
          <span
            className="absolute rounded-full"
            style={{
              inset: -6,
              border: "1.5px solid rgba(79,70,229,0.30)",
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
              pose === "thinking"
                ? "mascot-tilt 4s ease-in-out infinite"
                : "mascot-float 4s ease-in-out infinite",
          }}
        >
          {layered ? (
            <div className="relative h-full w-full">
              <img
                src={LAYERS.legs}
                alt=""
                className="absolute inset-0 h-full w-full object-contain"
              />
              <img
                src={LAYERS.armRight}
                alt=""
                className="absolute inset-0 h-full w-full object-contain"
              />
              <img
                src={LAYERS.body}
                alt=""
                className="absolute inset-0 h-full w-full object-contain"
              />
              {/* The waving arm: hinged at the shoulder, not the image centre. */}
              <img
                src={LAYERS.armLeft}
                alt=""
                className="absolute inset-0 h-full w-full object-contain"
                style={{
                  transformOrigin: "62% 38%",
                  animation:
                    pose === "welcome"
                      ? "mascot-wave 1.6s ease-in-out infinite"
                      : pose === "done"
                        ? "mascot-cheer 2s ease-in-out infinite"
                        : "none",
                }}
              />
            </div>
          ) : (
            <img
              src="/mascote.png"
              alt=""
              className="h-full w-full object-contain"
              style={{
                animation:
                  pose === "welcome"
                    ? "mascot-greet 1.8s ease-in-out infinite"
                    : pose === "done"
                      ? "mascot-pop 1.6s ease-in-out infinite"
                      : "none",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
