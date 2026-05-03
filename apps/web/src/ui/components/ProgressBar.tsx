import { ProgressBar as TinykiteProgressBar } from "@tinykite/ui";
import { motionTokens } from "../motion/motionTokens";

export default function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div className="progress-wrapper" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
      <TinykiteProgressBar 
        percent={percent} 
        label={label}
      />
    </div>
  );
}
