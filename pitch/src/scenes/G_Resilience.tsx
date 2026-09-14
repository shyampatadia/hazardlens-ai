import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, MONO } from "../theme";
import { Backdrop, Body, Frame, H1, Kicker, Rise } from "../ui";

export const G_Resilience: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Remote dies at 108, local takes over at 132.
  const remoteDead = frame > 108;
  const localLive = frame > 132;
  const flash = remoteDead && frame < 126 && Math.floor(frame / 4) % 2 === 0;

  return (
    <Backdrop glow={C.red}>
      <Frame>
        <Rise>
          <Kicker color={C.red}>Reliability</Kicker>
        </Rise>
        <Rise delay={8}>
          <H1 size={68}>When the API dies, the product doesn't.</H1>
        </Rise>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 30,
            marginTop: 64,
          }}
        >
          <Node
            title="Remote"
            sub="GLM-5.3-Flash"
            state={remoteDead ? "down" : "up"}
            flash={flash}
          />
          <Arrow active={localLive} frame={frame} />
          <Node
            title="Local"
            sub="Qwen3-VL-8B"
            state={localLive ? "up" : "idle"}
            flash={false}
          />
          <div style={{ flex: 1, paddingLeft: 26 }}>
            {localLive && (
              <div
                style={{
                  opacity: spring({
                    frame: frame - 132,
                    fps,
                    config: { damping: 200 },
                  }),
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 25,
                    color: C.amber,
                    background: `${C.amber}12`,
                    border: `1px solid ${C.amber}55`,
                    borderRadius: 10,
                    padding: "18px 24px",
                    marginBottom: 16,
                  }}
                >
                  Local fallback: Qwen/Qwen3-VL-8B-Instruct
                </div>
                <div style={{ fontFamily: FONT, fontSize: 25, color: C.muted }}>
                  The interface always names the model that answered.
                </div>
              </div>
            )}
          </div>
        </div>

        <Rise delay={150}>
          <Body size={32} style={{ maxWidth: 1560, marginTop: 58 }}>
            Timeout, rate limit, or outage — the request reroutes automatically
            with no user action. And the fallback path is the one that never
            leaves our infrastructure.
          </Body>
        </Rise>
      </Frame>
    </Backdrop>
  );
};

const Node: React.FC<{
  title: string;
  sub: string;
  state: "up" | "down" | "idle";
  flash: boolean;
}> = ({ title, sub, state, flash }) => {
  const color =
    state === "up" ? C.green : state === "down" ? C.red : C.muted;
  return (
    <div
      style={{
        width: 330,
        background: C.surface,
        border: `2px solid ${flash ? C.red : color}`,
        borderRadius: 16,
        padding: 32,
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
          {state === "down" ? "unavailable" : state === "up" ? "serving" : "standby"}
        </div>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 38, color: C.text, fontWeight: 700 }}>
        {title}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 21, color: C.muted, marginTop: 6 }}>
        {sub}
      </div>
    </div>
  );
};

const Arrow: React.FC<{ active: boolean; frame: number }> = ({ active, frame }) => {
  const dash = interpolate(frame, [132, 172], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ width: 130, display: "flex", alignItems: "center" }}>
      <svg width={130} height={40}>
        <line
          x1={0}
          y1={20}
          x2={120}
          y2={20}
          stroke={active ? C.amber : C.line}
          strokeWidth={4}
          strokeDasharray="10 8"
          strokeDashoffset={-dash}
        />
        <polygon
          points="120,12 130,20 120,28"
          fill={active ? C.amber : C.line}
        />
      </svg>
    </div>
  );
};
