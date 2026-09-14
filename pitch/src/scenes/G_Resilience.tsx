import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, MONO } from "../theme";
import { Backdrop, Frame, H1, Kicker, Rise } from "../ui";

export const G_Resilience: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Primary degrades at 96; the service never drops.
  const degraded = frame > 96;
  const rerouted = frame > 124;

  return (
    <Backdrop glow={C.red}>
      <Frame>
        <Rise>
          <Kicker color={C.red}>Built to stay up</Kicker>
        </Rise>
        <Rise delay={8}>
          <H1 size={70} style={{ maxWidth: 1620 }}>
            No single point of failure.
          </H1>
        </Rise>

        <Rise delay={20}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 33,
              color: C.muted,
              marginTop: 28,
              maxWidth: 1440,
              lineHeight: 1.5,
            }}
          >
            Safety tooling that is down is worse than no safety tooling, because
            people stop trusting it. So every inspection has a second path.
          </div>
        </Rise>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 26,
            marginTop: 58,
          }}
        >
          <Path
            title="Primary"
            note="fastest route"
            state={degraded ? "down" : "up"}
          />
          <Arrow active={rerouted} frame={frame} />
          <Path
            title="Secondary"
            note="our own infrastructure"
            state={rerouted ? "up" : "idle"}
          />

          <div style={{ flex: 1, paddingLeft: 24 }}>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 20,
                letterSpacing: 2.5,
                textTransform: "uppercase",
                color: C.muted,
                marginBottom: 14,
              }}
            >
              Service status
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: `${C.green}12`,
                border: `1px solid ${C.green}55`,
                borderRadius: 12,
                padding: "24px 30px",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: C.green,
                  boxShadow: `0 0 18px ${C.green}`,
                }}
              />
              <div
                style={{ fontFamily: FONT, fontSize: 34, color: C.text, fontWeight: 600 }}
              >
                Operational
              </div>
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 24,
                color: C.muted,
                marginTop: 16,
              }}
            >
              The customer never sees the switch.
            </div>
          </div>
        </div>

        <Rise delay={152}>
          <div
            style={{
              marginTop: 54,
              fontFamily: FONT,
              fontSize: 31,
              color: C.text,
              maxWidth: 1620,
              lineHeight: 1.45,
            }}
          >
            We built the fallback before we needed it, and it is already running
            in production today.
          </div>
        </Rise>
      </Frame>
    </Backdrop>
  );
};

const Path: React.FC<{
  title: string;
  note: string;
  state: "up" | "down" | "idle";
}> = ({ title, note, state }) => {
  const color = state === "up" ? C.green : state === "down" ? C.red : C.muted;
  const word =
    state === "down" ? "degraded" : state === "up" ? "serving" : "standby";
  return (
    <div
      style={{
        width: 300,
        background: C.surface,
        border: `2px solid ${color}`,
        borderRadius: 16,
        padding: 30,
        opacity: state === "idle" ? 0.5 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 14px ${color}`,
          }}
        />
        <div
          style={{
            fontFamily: MONO,
            fontSize: 19,
            letterSpacing: 2,
            color,
            textTransform: "uppercase",
          }}
        >
          {word}
        </div>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 36, color: C.text, fontWeight: 700 }}>
        {title}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 22, color: C.muted, marginTop: 6 }}>
        {note}
      </div>
    </div>
  );
};

const Arrow: React.FC<{ active: boolean; frame: number }> = ({ active, frame }) => {
  const dash = interpolate(frame, [124, 164], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <svg width={120} height={40}>
      <line
        x1={0}
        y1={20}
        x2={110}
        y2={20}
        stroke={active ? C.amber : C.line}
        strokeWidth={4}
        strokeDasharray="10 8"
        strokeDashoffset={-dash}
      />
      <polygon points="110,12 120,20 110,28" fill={active ? C.amber : C.line} />
    </svg>
  );
};
