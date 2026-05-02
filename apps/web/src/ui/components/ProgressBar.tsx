import { ProgressDisplay } from "@tinykite/ui";
import { motionTokens } from "../motion/motionTokens";

export default function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div className="progress-wrapper" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
      <ProgressDisplay 
        value={percent} 
        label={label} 
        showValue={true} 
      />
    </div>
  );
}
