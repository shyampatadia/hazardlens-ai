import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, MONO } from "../theme";
import { Backdrop, Frame, H1, Kicker, Rise } from "../ui";

export const H_Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mark = spring({ frame: frame - 2, fps, config: { damping: 13, mass: 0.7 } });
  const lineW = interpolate(frame, [30, 74], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Backdrop>
      <Frame>
        <Rise>
          <Kicker>Privacy is the moat</Kicker>
        </Rise>
        <Rise delay={6}>
          <H1 size={66} style={{ maxWidth: 1620 }}>
            Safety photos show employees, layouts, and
            <br />
            evidence of non-compliance.
          </H1>
        </Rise>
        <Rise delay={22}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 34,
              color: C.muted,
              marginTop: 32,
              maxWidth: 1420,
              lineHeight: 1.5,
            }}
          >
            Regulated customers cannot send those outside their own walls. We
            can run the whole product inside their infrastructure, which turns
            the buyers everyone else has to walk away from into{" "}
            <span style={{ color: C.text }}>our enterprise tier</span>.
          </div>
        </Rise>

        <div
          style={{
            height: 3,
            width: `${lineW * 100}%`,
            maxWidth: 1660,
            background: `linear-gradient(90deg, ${C.amber}, ${C.red}, transparent)`,
            margin: "62px 0 56px",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: `linear-gradient(140deg, ${C.amber}, ${C.red})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 52,
              transform: `scale(${mark})`,
            }}
          >
            ⚠️
          </div>
          <div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 66,
                fontWeight: 700,
                letterSpacing: -2,
                color: C.text,
                lineHeight: 1,
              }}
            >
              HazardLens AI
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 23,
                color: C.amber,
                marginTop: 12,
                letterSpacing: 2,
              }}
            >
              huggingface.co/spaces/shyampatadia22/hazardlens-ai
            </div>
          </div>
        </div>

        <Rise delay={64}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 26,
              color: C.muted,
              marginTop: 54,
              opacity: 0.75,
            }}
          >
            HazardLens provides an AI-assisted pre-check, not a certified safety
            inspection.
          </div>
        </Rise>
      </Frame>
    </Backdrop>
  );
};
