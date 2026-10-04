import { Audio } from "@remotion/media";
import {
  linearTiming,
  springTiming,
  TransitionSeries,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { staticFile, useVideoConfig } from "remotion";
import { Impact } from "./Impact";
import { ArchitectureScene } from "./scenes/ArchitectureScene";
import { FlowScene } from "./scenes/FlowScene";
import { HeadlineScene } from "./scenes/HeadlineScene";
import { HookScene } from "./scenes/HookScene";
import { LogoScene } from "./scenes/LogoScene";
import { OutroScene } from "./scenes/OutroScene";

/** Scenes add up to 699 frames; five 10-frame transitions overlap, so the promo runs 649 frames (~21.6s). */
export const ProofyPromo: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <>
      {/* Original cue synced to these cuts; regenerate with scripts/make_soundtrack.py if timings change. */}
      <Audio
        name="Soundtrack"
        src={staticFile("soundtrack.wav")}
        premountFor={fps}
      />
      <TransitionSeries name="Proofy promo">
        <TransitionSeries.Sequence
          name="Logo"
          durationInFrames={66}
          premountFor={fps}
        >
          <Impact>
            <LogoScene />
          </Impact>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 10 })}
        />
        <TransitionSeries.Sequence
          name="Hook"
          durationInFrames={72}
          premountFor={fps}
        >
          <Impact>
            <HookScene />
          </Impact>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: 10,
          })}
        />
        <TransitionSeries.Sequence
          name="Headline"
          durationInFrames={105}
          premountFor={fps}
        >
          <Impact>
            <HeadlineScene />
          </Impact>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: 10 })}
        />
        <TransitionSeries.Sequence
          name="Flow"
          durationInFrames={210}
          premountFor={fps}
        >
          <Impact>
            <FlowScene />
          </Impact>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: 10,
          })}
        />
        <TransitionSeries.Sequence
          name="Architecture"
          durationInFrames={126}
          premountFor={fps}
        >
          <Impact>
            <ArchitectureScene />
          </Impact>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 10 })}
        />
        <TransitionSeries.Sequence
          name="Outro"
          durationInFrames={120}
          premountFor={fps}
        >
          <Impact>
            <OutroScene />
          </Impact>
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};
