import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { C } from "./theme";
import { A_Hook } from "./scenes/A_Hook";
import { B_Product } from "./scenes/B_Product";
import { C_Demo } from "./scenes/C_Demo";
import { D_Moat } from "./scenes/D_Moat";
import { E_Speed } from "./scenes/E_Speed";
import { F_Economics } from "./scenes/F_Economics";
import { G_Resilience } from "./scenes/G_Resilience";
import { H_Close } from "./scenes/H_Close";

/** 30 fps. Durations are in frames; 30 = 1 second. */
const SCENES = [
  { C: A_Hook, d: 440 }, //  0:00  hook / problem
  { C: B_Product, d: 470 }, //  0:14  what it is
  { C: C_Demo, d: 690 }, //  0:29  live demo
  { C: D_Moat, d: 530 }, //  0:52  differentiator
  { C: E_Speed, d: 622 }, //  1:09  measured performance
  { C: F_Economics, d: 652 }, //  1:29  unit economics
  { C: G_Resilience, d: 622 }, //  1:50  failover
  { C: H_Close, d: 600 }, //  2:10  privacy + close
];

const XFADE = 18;

export const TOTAL_FRAMES = SCENES.reduce((a, s) => a + s.d, 0) - XFADE * (SCENES.length - 1);

/** Cross-fades the scene in and out at its own edges. */
const Fade: React.FC<{ d: number; children: React.ReactNode }> = ({ d, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, XFADE, d - XFADE, d],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const Pitch: React.FC = () => {
  let at = 0;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {SCENES.map(({ C: Scene, d }, i) => {
        const from = at;
        at += d - XFADE;
        return (
          <Sequence key={i} from={from} durationInFrames={d}>
            <Fade d={d}>
              <Scene />
            </Fade>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
