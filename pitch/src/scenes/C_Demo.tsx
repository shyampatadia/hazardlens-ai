import React from "react";
import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONT, MONO } from "../theme";
import { Backdrop, Kicker } from "../ui";
import det from "../../public/detections.json";

const IMG_W = 880;
const SCALE = IMG_W / det.width;
const IMG_H = det.height * SCALE;

const GOAL = det.goal;

export const C_Demo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Typing the inspection request.
  const typed = Math.floor(
    interpolate(frame, [14, 92], [0, GOAL.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const caret = frame < 96 && Math.floor(frame / 8) % 2 === 0;

  // Stage 1: the vision-language model returns labels.
  const thinking = frame > 100 && frame < 150;
  const labelsIn = frame >= 150;

  // Stage 2: detection boxes draw in sequence.
  const boxStart = 186;
  const panel = spring({ frame: frame - 4, fps, config: { damping: 200 } });

  return (
    <Backdrop>
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "70px 100px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ opacity: panel }}>
          <Kicker>Live product</Kicker>
        </div>

        <div style={{ display: "flex", gap: 52, alignItems: "flex-start", marginTop: 8 }}>
          {/* ---- input panel ---- */}
          <div
            style={{
              width: 640,
              opacity: panel,
              transform: `translateY(${(1 - panel) * 20}px)`,
            }}
          >
            <Label>Inspection request</Label>
            <div
              style={{
                background: C.surface,
                border: `1px solid ${frame > 14 && frame < 96 ? C.amber : C.line}`,
                borderRadius: 12,
                padding: "26px 28px",
                fontFamily: FONT,
                fontSize: 30,
                color: C.text,
                minHeight: 104,
                lineHeight: 1.35,
              }}
            >
              {GOAL.slice(0, typed)}
              {caret && (
                <span style={{ color: C.amber, fontWeight: 300 }}>|</span>
              )}
            </div>

            <div style={{ display: "flex", gap: 20, marginTop: 32 }}>
              <div style={{ flex: 1 }}>
                <Label>Vision model</Label>
                <Pill>Auto</Pill>
              </div>
              <div style={{ flex: 1 }}>
                <Label>Threshold</Label>
                <Pill>0.22</Pill>
              </div>
            </div>

            {/* stage indicators */}
            <div style={{ marginTop: 44 }}>
              <Stage
                n={1}
                title="Vision-language model"
                sub="reads the photo and the question"
                active={thinking}
                done={labelsIn}
              />
              <Stage
                n={2}
                title="OWL-ViT detector"
                sub="locates only what matters"
                active={frame >= boxStart && frame < boxStart + 110}
                done={frame >= boxStart + 110}
              />
            </div>

            {labelsIn && (
              <div style={{ marginTop: 40 }}>
                <Label>Objects searched</Label>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {det.labels.map((l, i) => {
                    const s = spring({
                      frame: frame - 150 - i * 7,
                      fps,
                      config: { damping: 200 },
                    });
                    return (
                      <div
                        key={l}
                        style={{
                          fontFamily: MONO,
                          fontSize: 26,
                          color: C.amber,
                          border: `1px solid ${C.amber}55`,
                          background: `${C.amber}12`,
                          borderRadius: 8,
                          padding: "10px 20px",
                          opacity: s,
                          transform: `scale(${0.85 + s * 0.15})`,
                        }}
                      >
                        {l}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ---- image with detections ---- */}
          <div
            style={{
              position: "relative",
              width: IMG_W,
              height: IMG_H,
              borderRadius: 14,
              overflow: "hidden",
              border: `1px solid ${C.line}`,
              opacity: panel,
            }}
          >
            <Img
              src={staticFile("demo.jpg")}
              style={{ width: IMG_W, height: IMG_H, objectFit: "cover" }}
            />

            {/* scan sweep while the models run */}
            {frame > 100 && frame < boxStart && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: 3,
                  top: interpolate(frame, [100, boxStart], [0, IMG_H], {
                    extrapolateRight: "clamp",
                  }),
                  background: `linear-gradient(90deg, transparent, ${C.amber}, transparent)`,
                  boxShadow: `0 0 26px ${C.amber}`,
                }}
              />
            )}

            {det.detections.map((d, i) => {
              const delay = boxStart + i * 20;
              const s = spring({
                frame: frame - delay,
                fps,
                config: { damping: 200, mass: 0.5 },
              });
              if (frame < delay) return null;
              const x = d.box.xmin * SCALE;
              const y = d.box.ymin * SCALE;
              const w = (d.box.xmax - d.box.xmin) * SCALE;
              const h = (d.box.ymax - d.box.ymin) * SCALE;
              return (
                <div key={i}>
                  <div
                    style={{
                      position: "absolute",
                      left: x,
                      top: y,
                      width: w * s,
                      height: h * s,
                      border: `3px solid ${C.red}`,
                      borderRadius: 4,
                      boxShadow: `0 0 20px ${C.red}66`,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: x,
                      top: Math.max(0, y - 34),
                      background: C.red,
                      color: "#fff",
                      fontFamily: MONO,
                      fontSize: 20,
                      fontWeight: 600,
                      padding: "4px 12px",
                      borderRadius: 5,
                      opacity: s,
                    }}
                  >
                    {d.label} {d.score.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* result strip */}
        {frame > boxStart + 96 && (
          <div
            style={{
              marginTop: 40,
              display: "flex",
              gap: 18,
              alignItems: "center",
              opacity: spring({
                frame: frame - boxStart - 96,
                fps,
                config: { damping: 200 },
              }),
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontSize: 30,
                color: C.text,
                background: C.surface,
                border: `1px solid ${C.line}`,
                borderLeft: `3px solid ${C.red}`,
                borderRadius: 10,
                padding: "18px 30px",
              }}
            >
              <span style={{ color: C.muted }}>Detected&nbsp;&nbsp;</span>
              box: {det.detections.length}
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 30,
                color: C.text,
                background: C.surface,
                border: `1px solid ${C.line}`,
                borderLeft: `3px solid ${C.green}`,
                borderRadius: 10,
                padding: "18px 30px",
              }}
            >
              <span style={{ color: C.muted }}>Served by&nbsp;&nbsp;</span>
              Remote: GLM-5.3-Flash
            </div>
          </div>
        )}
      </div>
    </Backdrop>
  );
};

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontFamily: MONO,
      fontSize: 19,
      letterSpacing: 2.5,
      textTransform: "uppercase",
      color: C.muted,
      marginBottom: 12,
    }}
  >
    {children}
  </div>
);

const Pill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      background: C.surface,
      border: `1px solid ${C.line}`,
      borderRadius: 10,
      padding: "16px 24px",
      fontFamily: FONT,
      fontSize: 27,
      color: C.text,
    }}
  >
    {children}
  </div>
);

const Stage: React.FC<{
  n: number;
  title: string;
  sub: string;
  active: boolean;
  done: boolean;
}> = ({ n, title, sub, active, done }) => {
  const color = done ? C.green : active ? C.amber : C.line;
  return (
    <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 22 }}>
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: "50%",
          border: `2px solid ${color}`,
          color: done || active ? color : C.muted,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: MONO,
          fontSize: 22,
          fontWeight: 700,
          flexShrink: 0,
          background: done ? `${C.green}18` : "transparent",
        }}
      >
        {done ? "✓" : n}
      </div>
      <div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 27,
            color: done || active ? C.text : C.muted,
            fontWeight: 600,
          }}
        >
          {title}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 21, color: C.muted }}>{sub}</div>
      </div>
    </div>
  );
};
