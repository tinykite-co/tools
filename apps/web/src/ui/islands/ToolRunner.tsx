import { CancelledError, type ToolDefinition } from "@tinykite/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildFeedbackUrl } from "../../lib/feedback";
import { APP_VERSION } from "../../lib/version";
import { getCapabilities, getDeviceDefaults, getProcessingMode } from "../../lib/capabilities";
import { executeTool, type ProgressState } from "../../lib/toolExecution";
import FieldInput from "../components/FieldInput";
import OnboardingTips from "../components/OnboardingTips";
import ProgressBar from "../components/ProgressBar";
import ResultsList from "../components/ResultsList";
import SettingsPanel from "../components/SettingsPanel";
import StatusPills from "../components/StatusPills";
import { motionTokens } from "../motion/motionTokens";
const emptyProgress: ProgressState = { label: "Idle", percent: 0 };

export default function ToolRunner({ tool }: { tool: ToolDefinition }) {
  const initialValues = useMemo(
    () => Object.fromEntries(tool.params.map((param) => [param.id, ""])) as Record<string, string>,
    [tool.params]
  );
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [progress, setProgress] = useState<ProgressState>(emptyProgress);
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [caps, setCaps] = useState(() => getCapabilities());
  const [compact, setCompact] = useState(false);
  const [userAgent, setUserAgent] = useState<string | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    const defaults = getDeviceDefaults();
    setCaps(getCapabilities());
    setCompact(defaults.compact);
    if (typeof navigator !== "undefined") {
      setUserAgent(navigator.userAgent);
    }
  }, []);

  const processing = useMemo(() => getProcessingMode(caps), [caps]);

  const handleRun = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("running");
    setError(null);
    setResult(null);
    setWarning(processing.warning);

    const payload = tool.params.length === 1 ? values[tool.params[0].id] ?? "" : values;

    try {
      const output = await executeTool({
        runner: tool.runner,
        input: payload,
        useWorker: caps.worker,
        signal: controller.signal,
        onProgress: setProgress
      });
      setResult(output);
      setStatus("success");
    } catch (err) {
      if (err instanceof CancelledError) {
        setStatus("idle");
        setProgress(emptyProgress);
        return;
      }
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unexpected error");
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setStatus("idle");
    setProgress(emptyProgress);
  };

  const feedbackUrl = buildFeedbackUrl({
    tool: tool.slug,
    version: APP_VERSION,
    userAgent
  });

  const motionStyle = {
    "--motion-page": `${motionTokens.pageEnter.durationMs}ms`,
    "--motion-panel": `${motionTokens.panel.durationMs}ms`,
    "--motion-progress": `${motionTokens.progress.durationMs}ms`
  } as React.CSSProperties;

  return (
    <section className="tool-runner page" style={motionStyle}>
      <p className="runner-meta">Runner: {tool.runner.split(":")[1] ?? tool.runner}</p>
      {tool.onboarding && <OnboardingTips tips={tool.onboarding.tips} storageKey={tool.onboarding.key} />}

      <form className="tool-form" onSubmit={(event) => event.preventDefault()}>
        {tool.params.map((field) => (
          <label key={field.id} className="field">
            <span>{field.label}</span>
            <FieldInput
              field={field}
              value={values[field.id] ?? ""}
              compact={compact}
              onChange={(next) => setValues((prev) => ({ ...prev, [field.id]: next }))}
            />
          </label>
        ))}
        <div className="actions">
          <button type="button" onClick={handleRun} disabled={status === "running"}>
            Run
          </button>
          {status === "running" && (
            <button type="button" className="ghost" onClick={handleCancel}>
              Cancel
            </button>
          )}
          <a className="ghost" href={feedbackUrl}>
            Feedback
          </a>
        </div>
      </form>

      <SettingsPanel title="Processing settings">
        <p>Mode: {processing.label}</p>
        <p>Layout: {compact ? "Compact" : "Comfortable"}</p>
        <p>Memory: {caps.deviceMemory ? `${caps.deviceMemory} GB` : "Unknown"}</p>
        <StatusPills
          items={[
            { label: caps.worker ? "Worker" : "No worker", tone: caps.worker ? "success" : "warning" },
            { label: caps.wasm ? "WASM" : "No WASM", tone: caps.wasm ? "success" : "warning" },
            {
              label: caps.offscreenCanvas ? "OffscreenCanvas" : "No OffscreenCanvas",
              tone: caps.offscreenCanvas ? "success" : "warning"
            }
          ]}
        />
        {warning && <p className="warning">{warning}</p>}
      </SettingsPanel>

      <ProgressBar percent={progress.percent} label={progress.label} />

      {status === "error" && <p className="error">{error}</p>}
      {status === "success" && <ResultsList result={result} />}
    </section>
  );
}