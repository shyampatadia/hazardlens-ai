import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, MONO } from "../theme";
import { Backdrop, Body, Frame, H1, Kicker, Rise } from "../ui";

export const D_Moat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Backdrop glow={C.blue}>
      <Frame>
        <Rise>
          <Kicker color={C.blue}>What makes it different</Kicker>
        </Rise>
        <Rise delay={8}>
          <H1 size={74} style={{ maxWidth: 1560 }}>
            You never tell it <span style={{ color: C.muted }}>what</span> to look for.
          </H1>
        </Rise>
        <Rise delay={22}>
          <Body size={34} style={{ maxWidth: 1340, marginTop: 30 }}>
            Every other tool on the market makes you tell it what to look for.
            HazardLens works it out from the question — which is the difference
            between a tool an expert can drive and a tool anyone can.
          </Body>
        </Rise>

        <div style={{ display: "flex", gap: 40, marginTop: 66 }}>
          <Col
            frame={frame}
            fps={fps}
            delay={40}
            tone={C.muted}
            head="Every other tool"
            ask={`Select objects to detect:
  box   cart   ladder   pallet   ...`}
            note="The inspector has to already know what the hazard is."
          />
          <Col
            frame={frame}
            fps={fps}
            delay={58}
            tone={C.amber}
            head="HazardLens"
            ask={`"Find anything blocking the emergency exit"`}
            note="It works out that the door is the reference, not the target."
          />
        </div>
      </Frame>
    </Backdrop>
  );
};

const Col: React.FC<{
  frame: number;
  fps: number;
  delay: number;
  tone: string;
  head: string;
  ask: string;
  note: string;
}> = ({ frame, fps, delay, tone, head, ask, note }) => {
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
        padding: 38,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 20,
          letterSpacing: 2.5,
          textTransform: "uppercase",
          color: tone,
          marginBottom: 22,
        }}
      >
        {head}
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 23,
          color: C.text,
          background: C.bg,
          border: `1px solid ${C.line}`,
          borderRadius: 10,
          padding: "20px 22px",
          lineHeight: 1.5,
          minHeight: 108,
          wordBreak: "break-word",
        }}
      >
        {ask}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 24,
          color: C.muted,
          marginTop: 22,
          lineHeight: 1.45,
        }}
      >
        {note}
      </div>
    </div>
  );
};
