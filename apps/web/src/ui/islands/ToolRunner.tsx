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
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, ThemeProvider } from "@tinykite/ui";

const emptyProgress: ProgressState = { label: "Idle", percent: 0 };

export default function ToolRunner({ tool }: { tool: ToolDefinition }) {
  const initialValues = useMemo(
    () => Object.fromEntries(tool.params.map((param) => [param.id, ""])) as Record<string, any>,
    [tool.params]
  );
  const [values, setValues] = useState<Record<string, any>>(initialValues);
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

    if (!payload || payload === "") {
      setStatus("error");
      setError("Please provide the required input.");
      return;
    }

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
    <ThemeProvider>
      <section className="tool-runner" style={{ ...motionStyle, maxWidth: '720px', margin: '40px auto', fontFamily: 'var(--ru-font-sans)' }}>
        <Card style={{ border: '1px solid var(--ru-color-border)', boxShadow: 'var(--ru-shadow-md)', borderRadius: 'var(--ru-radius)' }}>
          <CardHeader style={{ padding: '32px 32px 16px', borderBottom: '1px solid var(--ru-color-border)' }}>
            <CardTitle style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--ru-color-foreground)' }}>
              {tool.title ?? tool.slug}
            </CardTitle>
            <CardDescription style={{ fontSize: '0.875rem', color: 'var(--ru-color-muted-foreground)', marginTop: '4px' }}>
              Runner: {tool.runner.split(":")[1] ?? tool.runner}
            </CardDescription>
          </CardHeader>
          
          <CardContent style={{ padding: '32px' }}>
            {tool.onboarding && <OnboardingTips tips={tool.onboarding.tips} storageKey={tool.onboarding.key} />}

            <form className="tool-form" onSubmit={(event) => event.preventDefault()}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {tool.params.map((field) => (
                  <label key={field.id} className="field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--ru-color-foreground)' }}>{field.label}</span>
                    <FieldInput
                      field={field}
                      value={values[field.id] ?? ""}
                      compact={compact}
                      onChange={(next) => setValues((prev) => ({ ...prev, [field.id]: next }))}
                    />
                  </label>
                ))}
              </div>
              
              <div className="actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '32px' }}>
                <Button 
                  type="button" 
                  onClick={handleRun} 
                  disabled={status === "running"} 
                  variant="primary"
                  style={{ padding: '0 24px', height: '40px', fontWeight: 500, transition: 'all 0.2s' }}
                >
                  {status === "running" ? "Processing..." : "Generate Output"}
                </Button>
                
                {status === "running" && (
                  <Button type="button" variant="outline" onClick={handleCancel} style={{ height: '40px' }}>
                    Cancel
                  </Button>
                )}
                
                <div style={{ flex: 1 }} />
                
                <Button as="a" variant="ghost" href={feedbackUrl} style={{ color: 'var(--ru-color-muted-foreground)' }}>
                  Provide Feedback
                </Button>
              </div>
            </form>

            <div style={{ marginTop: '32px' }}>
              <SettingsPanel title="Processing Engine Details">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.85rem', color: 'var(--ru-color-muted-foreground)' }}>
                  <div><strong>Mode:</strong> {processing.label}</div>
                  <div><strong>Layout:</strong> {compact ? "Compact" : "Comfortable"}</div>
                  <div><strong>Memory:</strong> {caps.deviceMemory ? `${caps.deviceMemory} GB` : "Unknown"}</div>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <StatusPills
                    items={[
                      { label: caps.worker ? "Worker Active" : "No Worker", tone: caps.worker ? "success" : "warning" },
                      { label: caps.wasm ? "WASM Active" : "No WASM", tone: caps.wasm ? "success" : "warning" },
                      { label: caps.offscreenCanvas ? "OffscreenCanvas Active" : "No OffscreenCanvas", tone: caps.offscreenCanvas ? "success" : "warning" }
                    ]}
                  />
                </div>
                {warning && <p className="warning" style={{ color: '#ef4444', marginTop: '12px', fontSize: '0.85rem' }}>{warning}</p>}
              </SettingsPanel>
            </div>

            {status === "running" && (
              <div style={{ marginTop: '24px' }}>
                <ProgressBar percent={progress.percent} label={progress.label} />
              </div>
            )}

            {status === "error" && (
              <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--ru-radius)', color: '#b91c1c', fontSize: '0.9rem' }}>
                <strong>Error: </strong> {error}
              </div>
            )}
            
            {status === "success" && (
              <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid var(--ru-color-border)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Result Ready</h3>
                <ResultsList result={result} />
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </ThemeProvider>
  );
}