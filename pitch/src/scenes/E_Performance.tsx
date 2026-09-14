import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, MONO } from "../theme";
import { Backdrop, Count, Frame, H1, Kicker, Rise } from "../ui";

/** Measured against the deployed Space. */
const REMOTE = 3.96;
const LOCAL = 40.26;
const MAX = 44;

export const E_Performance: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Backdrop>
      <Frame>
        <Rise>
          <Kicker>Measured, not estimated</Kicker>
        </Rise>
        <Rise delay={8}>
          <H1 size={70}>Two backends. One product.</H1>
        </Rise>

        <div style={{ marginTop: 60, display: "flex", gap: 56 }}>
          <div style={{ flex: 1.35 }}>
            <Bar
              frame={frame}
              fps={fps}
              delay={26}
              label="Remote — GLM-5.3-Flash"
              sub="hosted API"
              value={REMOTE}
              color={C.green}
            />
            <Bar
              frame={frame}
              fps={fps}
              delay={50}
              label="Local — Qwen3-VL-8B"
              sub="on Space GPU"
              value={LOCAL}
              color={C.amber}
            />
            <Rise delay={80}>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 25,
                  color: C.muted,
                  marginTop: 14,
                }}
              >
                End-to-end latency, live run against the deployed Space.
              </div>
            </Rise>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 22 }}>
            <Stat
              frame={frame}
              fps={fps}
              delay={30}
              value={<Count to={10} decimals={0} delay={30} suffix="×" />}
              label="faster on the hosted model"
              color={C.green}
            />
            <Stat
              frame={frame}
              fps={fps}
              delay={52}
              value={<Count to={80} decimals={0} delay={52} suffix="%" />}
              label="success rate, cold start included"
              color={C.amber}
            />
            <Stat
              frame={frame}
              fps={fps}
              delay={74}
              value={<Count to={24.4} decimals={1} delay={74} suffix="s" />}
              label="mean across all requests"
              color={C.blue}
            />
          </div>
        </div>

        <Rise delay={98}>
          <div
            style={{
              marginTop: 46,
              fontFamily: FONT,
              fontSize: 29,
              color: C.text,
              background: C.surface,
              border: `1px solid ${C.line}`,
              borderLeft: `3px solid ${C.red}`,
              borderRadius: 12,
              padding: "24px 32px",
            }}
          >
            The one failure was a cold start — first request loads an 8B model.
            We warm the Space to hide it.
          </div>
        </Rise>
      </Frame>
    </Backdrop>
  );
};

const Bar: React.FC<{
  frame: number;
  fps: number;
  delay: number;
  label: string;
  sub: string;
  value: number;
  color: string;
}> = ({ frame, fps, delay, label, sub, value, color }) => {
  const grow = interpolate(frame - delay, [0, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <div style={{ marginBottom: 40, opacity: s }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontFamily: FONT, fontSize: 30, color: C.text, fontWeight: 600 }}>
            {label}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 20, color: C.muted, marginTop: 4 }}>
            {sub}
          </div>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 40, color, fontWeight: 700 }}>
          <Count to={value} decimals={1} delay={delay} duration={34} suffix="s" />
        </div>
      </div>
      <div
        style={{
          height: 22,
          background: C.surface2,
          borderRadius: 11,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(value / MAX) * 100 * grow}%`,
            background: `linear-gradient(90deg, ${color}bb, ${color})`,
            borderRadius: 11,
          }}
        />
      </div>
    </div>
  );
};

const Stat: React.FC<{
  frame: number;
  fps: number;
  delay: number;
  value: React.ReactNode;
  label: string;
  color: string;
}> = ({ frame, fps, delay, value, label, color }) => {
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.line}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 14,
        padding: "26px 32px",
        opacity: s,
        transform: `translateX(${(1 - s) * 22}px)`,
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: 52, color, fontWeight: 700 }}>
        {value}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 24, color: C.muted, marginTop: 6 }}>
        {label}
      </div>
    </div>
  );
};
