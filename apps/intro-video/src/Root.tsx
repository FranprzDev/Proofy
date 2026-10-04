import { Composition, Folder } from "remotion";
import { ProofyPromo } from "./ProofyPromo";
import { ArchitectureScene } from "./scenes/ArchitectureScene";
import { FlowScene } from "./scenes/FlowScene";
import { HeadlineScene } from "./scenes/HeadlineScene";
import { HookScene } from "./scenes/HookScene";
import { LogoScene } from "./scenes/LogoScene";
import { OutroScene } from "./scenes/OutroScene";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="ProofyPromo" component={ProofyPromo} durationInFrames={649} fps={30} width={1920} height={1080} />
      <Folder name="Scenes">
        <Composition id="Logo" component={LogoScene} durationInFrames={66} fps={30} width={1920} height={1080} />
        <Composition id="Hook" component={HookScene} durationInFrames={72} fps={30} width={1920} height={1080} />
        <Composition id="Headline" component={HeadlineScene} durationInFrames={105} fps={30} width={1920} height={1080} />
        <Composition id="Flow" component={FlowScene} durationInFrames={210} fps={30} width={1920} height={1080} />
        <Composition id="Architecture" component={ArchitectureScene} durationInFrames={126} fps={30} width={1920} height={1080} />
        <Composition id="Outro" component={OutroScene} durationInFrames={120} fps={30} width={1920} height={1080} />
      </Folder>
    </>
  );
};
