import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, MONO } from "../theme";
import { Backdrop, Count, Frame, H1, Kicker, Rise } from "../ui";

export const F_Economics: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Backdrop glow={C.blue}>
      <Frame>
        <Rise>
          <Kicker color={C.blue}>Unit economics</Kicker>
        </Rise>

        <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 150,
              fontWeight: 700,
              letterSpacing: -6,
              color: C.blue,
              lineHeight: 1,
            }}
          >
            <Count to={0.0006} decimals={4} delay={6} duration={32} prefix="$" />
          </div>
          <H1 size={64} style={{ letterSpacing: -1.5 }}>
            per inspection
          </H1>
        </div>

        <Rise delay={30}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 34,
              color: C.muted,
              marginTop: 30,
              maxWidth: 1480,
              lineHeight: 1.5,
            }}
          >
            Measured, not modelled. We ran the product and priced what it actually
            consumed.
          </div>
        </Rise>

        <div style={{ display: "flex", gap: 24, marginTop: 56 }}>
          <Tile
            frame={frame}
            fps={fps}
            delay={46}
            head="1,000 customers"
            big="$6.40"
            sub="total monthly infrastructure at 10,000 inspections"
            tone={C.green}
          />
          <Tile
            frame={frame}
            fps={fps}
            delay={60}
            head="Scales with"
            big="usage"
            sub="not headcount, and not a sales team per account"
            tone={C.amber}
          />
          <Tile
            frame={frame}
            fps={fps}
            delay={74}
            head="Gross margin"
            big="~99%"
            sub="infrastructure is a rounding error at any subscription price"
            tone={C.blue}
          />
        </div>

        <Rise delay={98}>
          <div
            style={{
              marginTop: 50,
              fontFamily: FONT,
              fontSize: 32,
              color: C.text,
              lineHeight: 1.45,
              maxWidth: 1620,
            }}
          >
            The expensive part of safety inspection was always the person walking
            the floor. We did not make that cheaper — we made it{" "}
            <span style={{ color: C.blue }}>unnecessary for the first pass.</span>
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
  big: string;
  sub: string;
  tone: string;
}> = ({ frame, fps, delay, head, big, sub, tone }) => {
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
        padding: 34,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 19,
          letterSpacing: 2.5,
          textTransform: "uppercase",
          color: C.muted,
          marginBottom: 16,
        }}
      >
        {head}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 62,
          color: tone,
          fontWeight: 700,
          letterSpacing: -2,
          marginBottom: 14,
        }}
      >
        {big}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 23, color: C.muted, lineHeight: 1.4 }}>
        {sub}
      </div>
    </div>
  );
};
