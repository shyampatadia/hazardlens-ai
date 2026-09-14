import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, MONO } from "../theme";
import { Backdrop, Count, Frame, H1, Kicker, Rise } from "../ui";

export const E_Speed: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Backdrop glow={C.green}>
      <Frame>
        <Rise>
          <Kicker color={C.green}>Speed is the product</Kicker>
        </Rise>

        <div style={{ display: "flex", alignItems: "baseline", gap: 26 }}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 190,
              fontWeight: 700,
              letterSpacing: -8,
              color: C.green,
              lineHeight: 1,
            }}
          >
            <Count to={4} decimals={0} delay={6} duration={30} />
          </div>
          <H1 size={78} style={{ letterSpacing: -2 }}>
            seconds per inspection
          </H1>
        </div>

        <Rise delay={30}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 36,
              color: C.muted,
              maxWidth: 1420,
              marginTop: 34,
              lineHeight: 1.5,
            }}
          >
            At that speed, a safety check stops being an event you schedule and
            becomes something you do every shift.
          </div>
        </Rise>

        <div style={{ display: "flex", gap: 24, marginTop: 58 }}>
          <Beat
            frame={frame}
            fps={fps}
            delay={48}
            head="Today"
            body="A walkthrough on a clipboard, once a quarter, if someone remembers."
            tone={C.muted}
          />
          <Beat
            frame={frame}
            fps={fps}
            delay={64}
            head="With HazardLens"
            body="A photo from a phone, every shift, by anyone on site."
            tone={C.green}
          />
        </div>

        <Rise delay={92}>
          <div
            style={{
              marginTop: 52,
              fontFamily: FONT,
              fontSize: 33,
              color: C.text,
              lineHeight: 1.45,
              maxWidth: 1600,
            }}
          >
            Our real competition is not another tool. It is{" "}
            <span style={{ color: C.amber }}>
              the inspection that never happened.
            </span>
          </div>
        </Rise>
      </Frame>
    </Backdrop>
  );
};

const Beat: React.FC<{
  frame: number;
  fps: number;
  delay: number;
  head: string;
  body: string;
  tone: string;
}> = ({ frame, fps, delay, head, body, tone }) => {
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        flex: 1,
        opacity: s,
        transform: `translateY(${(1 - s) * 24}px)`,
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
          fontSize: 20,
          letterSpacing: 2.5,
          textTransform: "uppercase",
          color: tone,
          marginBottom: 18,
        }}
      >
        {head}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 29, color: C.text, lineHeight: 1.45 }}>
        {body}
      </div>
    </div>
  );
};
