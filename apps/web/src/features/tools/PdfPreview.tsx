import { useEffect, useRef, useState } from "react";
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";

interface PdfPageInfo {
  pageNumber: number;
}

function PdfPreviewPage({
  document,
  pageNumber
}: {
  document: any;
  pageNumber: number;
}): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<unknown> } | null = null;

    async function renderPage() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const page = await document.getPage(pageNumber);
      if (cancelled) return;

      const viewport = page.getViewport({ scale: 1.35 });
      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      canvas.style.width = "100%";
      canvas.style.height = "auto";

      const task = page.render({ canvasContext: context, viewport });
      renderTask = task;
      await task.promise.catch((error: unknown) => {
        if (!cancelled) throw error;
      });
    }

    renderPage().catch(() => undefined);

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [document, pageNumber]);

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--ru-color-border)',
        borderRadius: 'var(--ru-radius)',
        boxShadow: 'var(--ru-shadow-sm)',
        overflow: 'hidden'
      }}
    >
      <canvas ref={canvasRef} aria-label={`PDF page ${pageNumber}`} />
    </div>
  );
}

export default function PdfPreview({ file }: { file: File | null }): JSX.Element | null {
  const [document, setDocument] = useState<any>(null);
  const [pages, setPages] = useState<PdfPageInfo[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    if (!file) {
      setDocument(null);
      setPages([]);
      setStatus("idle");
      return;
    }

    let active = true;
    let loadingTask: { destroy: () => Promise<void>; promise: Promise<any> } | null = null;
    setStatus("loading");

    Promise.all([file.arrayBuffer(), import("pdfjs-dist")])
      .then((buffer) => {
        const [arrayBuffer, pdfjs] = buffer;
        if (!active) return null;
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
        loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
        return loadingTask.promise;
      })
      .then((pdfDocument) => {
        if (!active || !pdfDocument) return;
        setDocument(pdfDocument);
        setPages(
          Array.from({ length: pdfDocument.numPages }, (_, index) => ({
            pageNumber: index + 1
          }))
        );
        setStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setDocument(null);
        setPages([]);
        setStatus("error");
      });

    return () => {
      active = false;
      void loadingTask?.destroy();
    };
  }, [file]);

  if (!file || status === "idle") return null;

  if (status === "loading") {
    return (
      <div style={{ color: 'var(--ru-color-muted-foreground)', fontSize: '0.9rem' }}>
        Loading PDF preview...
      </div>
    );
  }

  if (status === "error" || !document) {
    return (
      <div style={{ color: '#b91c1c', fontSize: '0.9rem' }}>
        The PDF preview could not be loaded.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--ru-color-foreground)' }}>
          Document Preview
        </h3>
        <span style={{ color: 'var(--ru-color-muted-foreground)', fontSize: '0.82rem' }}>
          {pages.length} page{pages.length === 1 ? "" : "s"}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gap: '18px',
          maxHeight: '640px',
          overflow: 'auto',
          padding: '12px',
          background: '#f3f4f6',
          border: '1px solid var(--ru-color-border)',
          borderRadius: 'var(--ru-radius)'
        }}
      >
        {pages.map((page) => (
          <PdfPreviewPage key={page.pageNumber} document={document} pageNumber={page.pageNumber} />
        ))}
      </div>
    </div>
  );
}
