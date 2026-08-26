import type { ProgressState } from "../../lib/toolExecution";
import ProgressBar from "../../ui/components/ProgressBar";
import ResultsList from "../../ui/components/ResultsList";

export function ToolRunnerStatus({
  status,
  warning,
  progress,
  error,
  result
}: {
  status: "idle" | "running" | "success" | "error";
  warning?: string | null;
  progress: ProgressState;
  error?: string | null;
  result?: unknown;
}) {
  return (
    <>
      <p
        style={{
          marginTop: "28px",
          fontSize: "0.8rem",
          color: "var(--ru-color-muted-foreground)",
          letterSpacing: "0.01em"
        }}
      >
        Never uploaded. Never stored. Only yours.
        {warning ? ` ${warning}` : ""}
      </p>

      {status === "running" && (
        <div style={{ marginTop: "24px" }}>
          <ProgressBar percent={progress.percent} label={progress.label} />
        </div>
      )}

      {status === "error" && (
        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "var(--ru-radius)",
            color: "#b91c1c",
            fontSize: "0.9rem"
          }}
        >
          {error}
        </div>
      )}

      {status === "success" && (
        <div
          style={{
            marginTop: "32px",
            paddingTop: "32px",
            borderTop: "1px solid var(--ru-color-border)"
          }}
        >
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: "4px",
              letterSpacing: "-0.02em"
            }}
          >
            Yours.
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--ru-color-muted-foreground)",
              marginBottom: "16px"
            }}
          >
            Ready when you are.
          </p>
          <ResultsList result={result} />
        </div>
      )}
    </>
  );
}
