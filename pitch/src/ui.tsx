import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, MONO } from "./theme";

/** Fade + lift that most elements share. */
export const Rise: React.FC<{
  delay?: number;
  children: React.ReactNode;
  distance?: number;
  style?: React.CSSProperties;
}> = ({ delay = 0, children, distance = 28, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, mass: 0.6 },
  });
  return (
    <div
      style={{
        opacity: s,
        transform: `translateY(${(1 - s) * distance}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Small uppercase section marker. */
export const Kicker: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color = C.amber,
}) => (
  <div
    style={{
      fontFamily: MONO,
      fontSize: 22,
      letterSpacing: 4,
      textTransform: "uppercase",
      color,
      marginBottom: 24,
      fontWeight: 600,
    }}
  >
    {children}
  </div>
);

export const H1: React.FC<{
  children: React.ReactNode;
  size?: number;
  style?: React.CSSProperties;
}> = ({ children, size = 92, style }) => (
  <div
    style={{
      fontFamily: FONT,
      fontSize: size,
      fontWeight: 700,
      lineHeight: 1.06,
      letterSpacing: -2.5,
      color: C.text,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Body: React.FC<{
  children: React.ReactNode;
  size?: number;
  style?: React.CSSProperties;
}> = ({ children, size = 34, style }) => (
  <div
    style={{
      fontFamily: FONT,
      fontSize: size,
      lineHeight: 1.5,
      color: C.muted,
      fontWeight: 400,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Counts up to a value, then holds. */
export const Count: React.FC<{
  to: number;
  delay?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}> = ({ to, delay = 0, duration = 38, decimals = 0, prefix = "", suffix = "" }) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame - delay, [0, duration], [0, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      {prefix}
      {v.toFixed(decimals)}
      {suffix}
    </>
  );
};

export const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: string;
}> = ({ children, style, accent }) => (
  <div
    style={{
      background: C.surface,
      border: `1px solid ${C.line}`,
      borderTop: accent ? `3px solid ${accent}` : `1px solid ${C.line}`,
      borderRadius: 16,
      padding: 40,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Full-frame scene background with a soft vignette glow. */
export const Backdrop: React.FC<{
  children: React.ReactNode;
  glow?: string;
}> = ({ children, glow = C.amber }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: C.bg,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        width: 1400,
        height: 1400,
        left: -400,
        top: -600,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${glow}14 0%, transparent 62%)`,
      }}
    />
    <div
      style={{
        position: "absolute",
        width: 1200,
        height: 1200,
        right: -400,
        bottom: -560,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${C.red}10 0%, transparent 62%)`,
      }}
    />
    {children}
  </div>
);

/** Consistent left-aligned scene padding. */
export const Frame: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      padding: "110px 130px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      ...style,
    }}
  >
    {children}
  </div>
);
