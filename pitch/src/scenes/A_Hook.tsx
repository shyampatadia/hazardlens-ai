import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT, MONO } from "../theme";
import { Backdrop, Body, Frame, H1, Rise } from "../ui";

export const A_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 0.5 + 0.5 * Math.sin(frame / 14);
  const lineW = interpolate(frame, [18, 60], [0, 260], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Backdrop>
      <Frame>
        <Rise delay={0}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginBottom: 40,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: C.red,
                boxShadow: `0 0 ${18 + pulse * 26}px ${C.red}`,
                opacity: 0.55 + pulse * 0.45,
              }}
            />
            <div
              style={{
                fontFamily: MONO,
                fontSize: 24,
                letterSpacing: 4,
                color: C.red,
                fontWeight: 600,
              }}
            >
              WORKPLACE SAFETY
            </div>
          </div>
        </Rise>

        <Rise delay={12}>
          <H1 size={118} style={{ maxWidth: 1480 }}>
            A blocked fire exit
            <br />
            is invisible
            <span style={{ color: C.muted }}> — </span>
            <span style={{ color: C.amber }}>until it isn't.</span>
          </H1>
        </Rise>

        <div
          style={{
            height: 4,
            width: lineW,
            background: `linear-gradient(90deg, ${C.amber}, ${C.red})`,
            borderRadius: 2,
            margin: "56px 0 44px",
          }}
        />

        <Rise delay={42}>
          <Body size={40} style={{ maxWidth: 1180 }}>
            Safety walkthroughs are manual, subjective, and happen far less often
            than they should.
          </Body>
        </Rise>

        <Rise delay={62}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 32,
              color: C.muted,
              marginTop: 28,
              opacity: 0.8,
            }}
          >
            The hazard is usually in plain sight. Nobody is looking.
          </div>
        </Rise>
      </Frame>
    </Backdrop>
  );
};
