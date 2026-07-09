import { CancelledError, type ToolDefinition } from "@tinykite/core";
import {
  inspectPdfForm,
  type PdfFormField,
  type PdfFieldValue,
  type PdfTextOverlay
} from "@tinykite/pdf";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { buildFeedbackUrl } from "../../lib/feedback";
import { APP_VERSION } from "../../lib/version";
import { getCapabilities, getDeviceDefaults, getProcessingMode } from "../../lib/capabilities";
import { executeTool, type ProgressState } from "../../lib/toolExecution";
import FieldInput from "../../ui/components/FieldInput";
import OnboardingTips from "../../ui/components/OnboardingTips";
import PdfDropzone, { type PdfUploadValue } from "./PdfDropzone";
import PdfFormFields, {
  getInitialPdfFieldValue,
  isFillablePdfField,
  type PdfInspectStatus
} from "./PdfFormFields";
import PdfPreview from "./PdfPreview";
import ProgressBar from "../../ui/components/ProgressBar";
import ResultsList from "../../ui/components/ResultsList";
import { motionTokens } from "../../ui/motion/motionTokens";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, ThemeProvider } from "@tinykite/ui";

const emptyProgress: ProgressState = { label: "Idle", percent: 0 };
const pdfFormRunner = "@tinykite/pdf:fillPdfForm";

function isMissingPdfUpload(value: unknown): boolean {
  return !value || value === "";
}

export default function ToolRunner({ tool }: { tool: ToolDefinition }) {
  const initialValues = useMemo(
    () => Object.fromEntries(
      tool.params.map((param) => {
        if (param.type === "select" && param.options && param.options.length > 0) {
          return [param.id, param.options[0].value];
        }
        return [param.id, ""];
      })
    ) as Record<string, any>,
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
  const [pdfFields, setPdfFields] = useState<PdfFormField[]>([]);
  const [pdfFieldValues, setPdfFieldValues] = useState<Record<string, PdfFieldValue>>({});
  const [pdfInspectStatus, setPdfInspectStatus] = useState<PdfInspectStatus>("idle");
  const [pdfInspectError, setPdfInspectError] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState("");
  const [pdfTextOverlays, setPdfTextOverlays] = useState<PdfTextOverlay[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const isPdfFormTool = tool.runner === pdfFormRunner;
  
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    if (!isPdfFormTool) {
      return;
    }

    const pdf = values.pdf;
    setPdfFields([]);
    setPdfFieldValues({});
    setPdfTextOverlays([]);
    setPdfInspectError(null);

    if (isMissingPdfUpload(pdf)) {
      setPdfInspectStatus("idle");
      return;
    }

    let active = true;
    setPdfInspectStatus("loading");

    inspectPdfForm({ pdf })
      .then((result) => {
        if (!active) return;
        const nextValues = Object.fromEntries(
          result.fields
            .filter(isFillablePdfField)
            .map((field) => [field.name, getInitialPdfFieldValue(field)])
        );
        setPdfFields(result.fields);
        setPdfFieldValues(nextValues);
        setPdfInspectStatus("ready");
      })
      .catch((err) => {
        if (!active) return;
        setPdfInspectStatus("error");
        setPdfInspectError(err instanceof Error ? err.message : "Could not inspect PDF fields.");
      });

    return () => {
      active = false;
    };
  }, [isPdfFormTool, values.pdf]);

  useEffect(() => {
    const defaults = getDeviceDefaults();
    setCaps(getCapabilities());
    setCompact(defaults.compact);
    if (typeof navigator !== "undefined") {
      setUserAgent(navigator.userAgent);
    }
  }, []);

  const processing = useMemo(() => getProcessingMode(caps), [caps]);
  const pdfUploadValue = isPdfFormTool && !isMissingPdfUpload(values.pdf)
    ? values.pdf as PdfUploadValue
    : "";
  const pdfPreviewFile = pdfUploadValue ? pdfUploadValue.pdf : null;
  const hasFillablePdfFields = pdfFields.some(isFillablePdfField);
  const canAddPdfText = isPdfFormTool && pdfInspectStatus === "ready" && !hasFillablePdfFields;

  const handlePlacePdfText = (pageIndex: number, x: number, y: number) => {
    const text = pdfText.trim();
    if (!text) return;

    setPdfTextOverlays((prev) => [
      ...prev,
      {
        id: typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `text-${Date.now()}-${prev.length}`,
        pageIndex,
        x,
        y,
        text,
        fontSize: 12
      }
    ]);
    setPdfText("");
  };

  const recoverFileValues = (current: Record<string, any>): Record<string, any> => {
    // File inputs are uncontrolled; React state can lag behind the DOM after setInputFiles.
    // Re-read the live input so Generate always sees the selected file.
    const next = { ...current };
    for (const param of tool.params) {
      if (param.type !== "file") continue;
      const existing = next[param.id];
      const hasFile =
        existing instanceof Blob ||
        (existing &&
          typeof existing === "object" &&
          (existing.image instanceof Blob || existing.video instanceof Blob));
      if (hasFile) continue;
      if (typeof document === "undefined") continue;
      const input = document.getElementById(param.id) as HTMLInputElement | null;
      if (!input?.files?.length) continue;
      if (param.multiple) {
        next[param.id] = Array.from(input.files).map((f) => ({
          image: f,
          filename: f.name
        }));
      } else {
        const file = input.files[0];
        if (file) {
          next[param.id] = { image: file, filename: file.name };
        }
      }
    }
    return next;
  };

  const handleRun = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("running");
    setError(null);
    setResult(null);
    setWarning(processing.warning);

    const resolvedValues = recoverFileValues(values);
    let payload: unknown =
      tool.params.length === 1
        ? resolvedValues[tool.params[0].id] ?? ""
        : resolvedValues;

    if (isPdfFormTool) {
      if (isMissingPdfUpload(values.pdf)) {
        setStatus("error");
        setError("Please upload a PDF.");
        return;
      }

      if (pdfInspectStatus === "loading") {
        setStatus("error");
        setError("Still reading the PDF form fields.");
        return;
      }

      if (pdfInspectStatus === "error") {
        setStatus("error");
        setError(pdfInspectError ?? "Could not read editable PDF fields.");
        return;
      }

      const hasTextOverlays = pdfTextOverlays.some((overlay) => overlay.text.trim());

      if (!hasFillablePdfFields && !hasTextOverlays) {
        setStatus("error");
        setError("No editable fields were found. Type text and click the PDF preview to place it.");
        return;
      }

      payload = {
        pdf: values.pdf,
        values: hasFillablePdfFields ? pdfFieldValues : {},
        textOverlays: pdfTextOverlays,
        flatten: false
      };
    }

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
  } as CSSProperties;

  return (
    <ThemeProvider>
      <section className="tool-runner" style={{ ...motionStyle, maxWidth: '720px', margin: '40px auto', fontFamily: 'var(--ru-font-sans)' }}>
        <Card style={{ border: '1px solid var(--ru-color-border)', boxShadow: 'var(--ru-shadow-md)', borderRadius: 'var(--ru-radius)' }}>
          <CardHeader style={{ padding: '32px 32px 16px', borderBottom: '1px solid var(--ru-color-border)' }}>
            <CardTitle style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--ru-color-foreground)' }}>
              {tool.title ?? tool.slug}
            </CardTitle>
            <CardDescription style={{ fontSize: '0.875rem', color: 'var(--ru-color-muted-foreground)', marginTop: '4px' }}>
              {tool.seo.summary}
            </CardDescription>
          </CardHeader>
          
          <CardContent style={{ padding: '32px' }}>
            {tool.onboarding && <OnboardingTips tips={tool.onboarding.tips} storageKey={tool.onboarding.key} />}

            <form className="tool-form" onSubmit={(event) => event.preventDefault()}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {isPdfFormTool ? (
                  <>
                    <PdfDropzone
                      value={pdfUploadValue}
                      onChange={(next) => setValues((prev) => ({ ...prev, pdf: next }))}
                    />
                    {canAddPdfText && (
                      <div
                        style={{
                          display: 'grid',
                          gap: '10px',
                          padding: '14px 16px',
                          border: '1px solid var(--ru-color-border)',
                          borderRadius: 'var(--ru-radius)',
                          background: '#fff'
                        }}
                      >
                        <label style={{ display: 'grid', gap: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ru-color-foreground)' }}>
                            Add text to this PDF
                          </span>
                          <input
                            type="text"
                            value={pdfText}
                            placeholder="Type text, then click where it should appear"
                            onChange={(event) => setPdfText(event.target.value)}
                            style={{
                              width: '100%',
                              border: '1px solid var(--ru-color-border)',
                              borderRadius: 'var(--ru-radius)',
                              padding: '0.6rem 0.75rem',
                              fontSize: '0.95rem'
                            }}
                          />
                        </label>
                        <div style={{ color: 'var(--ru-color-muted-foreground)', fontSize: '0.85rem' }}>
                          {pdfText.trim()
                            ? "Click the document preview to place this text."
                            : "This PDF has no editable fields, so text can be placed directly on the preview."}
                        </div>
                        {pdfTextOverlays.length > 0 && (
                          <div style={{ color: 'var(--ru-color-muted-foreground)', fontSize: '0.85rem' }}>
                            {pdfTextOverlays.length} text item{pdfTextOverlays.length === 1 ? "" : "s"} placed.
                          </div>
                        )}
                      </div>
                    )}
                    <PdfPreview
                      file={pdfPreviewFile}
                      textOverlays={pdfTextOverlays}
                      canPlaceText={canAddPdfText && pdfText.trim().length > 0}
                      onPlaceText={handlePlacePdfText}
                      onRemoveTextOverlay={(id) =>
                        setPdfTextOverlays((prev) => prev.filter((overlay) => overlay.id !== id))
                      }
                    />
                  </>
                ) : (
                  tool.params.map((field) => (
                    <label key={field.id} className="field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--ru-color-foreground)' }}>{field.label}</span>
                      <FieldInput
                        field={field}
                        value={values[field.id] ?? ""}
                        compact={compact}
                        onChange={(next) => setValues((prev) => ({ ...prev, [field.id]: next }))}
                      />
                    </label>
                  ))
                )}
                {isPdfFormTool && (
                  <PdfFormFields
                    fields={pdfFields}
                    values={pdfFieldValues}
                    status={pdfInspectStatus}
                    error={pdfInspectError}
                    onChange={(name, value) =>
                      setPdfFieldValues((prev) => ({ ...prev, [name]: value }))
                    }
                  />
                )}
              </div>
              
              <div className="actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '32px' }}>
                <Button 
                  type="button" 
                  onClick={handleRun} 
                  disabled={status === "running"} 
                  variant="default"
                  style={{ padding: '0 24px', height: '40px', fontWeight: 500, transition: 'all 0.2s' }}
                >
                  {status === "running" ? "Working…" : "Make it"}
                </Button>
                
                {status === "running" && (
                  <Button type="button" variant="outline" onClick={handleCancel} style={{ height: '40px' }}>
                    Stop
                  </Button>
                )}
                
                <div style={{ flex: 1 }} />
                
                <a
                  href={feedbackUrl}
                  style={{
                    color: 'var(--ru-color-muted-foreground)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '40px',
                    padding: '0 16px',
                    borderRadius: 'var(--ru-radius)',
                    fontSize: '0.875rem',
                    fontWeight: 500
                  }}
                >
                  Feedback
                </a>
              </div>
            </form>

            <p
              style={{
                marginTop: '28px',
                fontSize: '0.8rem',
                color: 'var(--ru-color-muted-foreground)',
                letterSpacing: '0.01em'
              }}
            >
              Never uploaded. Never stored. Only yours.
              {warning ? ` ${warning}` : ""}
            </p>

            {status === "running" && (
              <div style={{ marginTop: '24px' }}>
                <ProgressBar percent={progress.percent} label={progress.label} />
              </div>
            )}

            {status === "error" && (
              <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--ru-radius)', color: '#b91c1c', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}
            
            {status === "success" && (
              <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid var(--ru-color-border)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '4px', letterSpacing: '-0.02em' }}>
                  Yours.
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--ru-color-muted-foreground)', marginBottom: '16px' }}>
                  Ready when you are.
                </p>
                <ResultsList result={result} />
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </ThemeProvider>
  );
}
