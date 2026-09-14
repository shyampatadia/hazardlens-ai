import { Composition } from "remotion";
import { Pitch, TOTAL_FRAMES } from "./Pitch";
import { FPS } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="HazardLensPitch"
    component={Pitch}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
