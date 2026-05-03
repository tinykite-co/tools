import React from "react";
// @ts-ignore
import { ProgressBar as RefractionProgress } from "@refraction-ui/react";

export interface ProgressBarProps {
  percent: number;
  label: string;
}

export function ProgressBar({ percent, label }: ProgressBarProps) {
  return (
    <div className="progress-wrapper" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
      <RefractionProgress value={percent} max={100} />
      <div className="progress-label" aria-live="polite" style={{ fontSize: '0.85rem', marginTop: '0.4rem', color: '#6a7280' }}>
        {label}
      </div>
    </div>
  );
}
