import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, MONO } from "../theme";
import { Backdrop, Body, Frame, H1, Kicker, Rise } from "../ui";

export const B_Product: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mark = spring({ frame: frame - 4, fps, config: { damping: 14, mass: 0.8 } });

  return (
    <Backdrop>
      <Frame>
        <div style={{ display: "flex", alignItems: "center", gap: 34, marginBottom: 46 }}>
          <div
            style={{
              width: 108,
              height: 108,
              borderRadius: 26,
              background: `linear-gradient(140deg, ${C.amber}, ${C.red})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 58,
              transform: `scale(${mark}) rotate(${(1 - mark) * -18}deg)`,
            }}
          >
            ⚠️
          </div>
          <Rise delay={10}>
            <div>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 78,
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
                  fontSize: 22,
                  letterSpacing: 3,
                  color: C.amber,
                  marginTop: 12,
                }}
              >
                SEE THE HAZARD BEFORE IT COSTS YOU
              </div>
            </div>
          </Rise>
        </div>

        <Rise delay={26}>
          <H1 size={62} style={{ maxWidth: 1500, letterSpacing: -1.5 }}>
            Ask a safety question in plain English.
            <br />
            Get it answered <span style={{ color: C.amber }}>on the photo.</span>
          </H1>
        </Rise>

        <Rise delay={46}>
          <Body size={36} style={{ maxWidth: 1280, marginTop: 40 }}>
            Upload a workplace image, describe what you want checked, and
            HazardLens returns the same image with the objects that matter boxed
            and labelled.
          </Body>
        </Rise>

        <Rise delay={66}>
          <div style={{ display: "flex", gap: 16, marginTop: 52 }}>
            {["Warehouses", "Construction", "Manufacturing", "Facilities"].map(
              (t) => (
                <div
                  key={t}
                  style={{
                    fontFamily: FONT,
                    fontSize: 26,
                    color: C.muted,
                    border: `1px solid ${C.line}`,
                    background: C.surface,
                    borderRadius: 999,
                    padding: "14px 30px",
                  }}
                >
                  {t}
                </div>
              )
            )}
          </div>
        </Rise>
      </Frame>
    </Backdrop>
  );
};
