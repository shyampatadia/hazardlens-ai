import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, MONO } from "../theme";
import { Backdrop, Count, Frame, H1, Kicker, Rise } from "../ui";

export const F_Economics: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Backdrop glow={C.green}>
      <Frame>
        <Rise>
          <Kicker color={C.green}>Unit economics at 1,000 users</Kicker>
        </Rise>
        <Rise delay={8}>
          <H1 size={68} style={{ maxWidth: 1500 }}>
            10,000 inspections a month for
            <span style={{ color: C.green }}>
              {" "}
              <Count to={6.4} decimals={2} delay={18} prefix="$" />
            </span>
          </H1>
        </Rise>

        <div style={{ display: "flex", gap: 30, marginTop: 58 }}>
          <Tile
            frame={frame}
            fps={fps}
            delay={34}
            head="Remote path"
            big={<Count to={4.4} decimals={2} delay={34} prefix="$" />}
            rows={[
              ["GPU (T4 small)", "~11 h/mo"],
              ["API inference", "$2.00"],
            ]}
            tone={C.green}
          />
          <Tile
            frame={frame}
            fps={fps}
            delay={50}
            head="Local path"
            big={<Count to={44} decimals={0} delay={50} prefix="$" />}
            rows={[
              ["GPU (T4 small)", "~110 h/mo"],
              ["API inference", "$0.00"],
            ]}
            tone={C.amber}
          />
          <Tile
            frame={frame}
            fps={fps}
            delay={66}
            head="Cost per inspection"
            big={<Count to={0.0006} decimals={4} delay={66} prefix="$" />}
            rows={[
              ["Gross margin", "very high"],
              ["Scales with", "GPU hours"],
            ]}
            tone={C.blue}
          />
        </div>

        <Rise delay={88}>
          <div
            style={{
              marginTop: 50,
              fontFamily: FONT,
              fontSize: 31,
              color: C.text,
              lineHeight: 1.5,
              maxWidth: 1560,
            }}
          >
            Running the model ourselves is not the cheap option —{" "}
            <span style={{ color: C.amber }}>it costs 7× more</span>. GPU hours
            dominate API fees, and we priced both.
          </div>
        </Rise>
      </Frame>
    </Backdrop>
  );
};

const Tile: React.FC<{
  frame: number;
  fps: number;
  delay: number;
  head: string;
  big: React.ReactNode;
  rows: [string, string][];
  tone: string;
}> = ({ frame, fps, delay, head, big, rows, tone }) => {
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        flex: 1,
        opacity: s,
        transform: `translateY(${(1 - s) * 26}px)`,
        background: C.surface,
        border: `1px solid ${C.line}`,
        borderTop: `3px solid ${tone}`,
        borderRadius: 16,
        padding: 36,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 19,
          letterSpacing: 2.5,
          textTransform: "uppercase",
          color: C.muted,
          marginBottom: 18,
        }}
      >
        {head}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 68, color: tone, fontWeight: 700 }}>
        {big}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 21, color: C.muted, marginBottom: 22 }}>
        per month
      </div>
      {rows.map(([k, v]) => (
        <div
          key={k}
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: `1px solid ${C.line}`,
            padding: "14px 0",
            fontFamily: FONT,
            fontSize: 23,
          }}
        >
          <span style={{ color: C.muted }}>{k}</span>
          <span style={{ color: C.text }}>{v}</span>
        </div>
      ))}
    </div>
  );
};
