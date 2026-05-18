import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

export interface PdfUploadValue {
  pdf: File;
  filename: string;
}

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export default function PdfDropzone({
  value,
  onChange
}: {
  value: PdfUploadValue | "";
  onChange: (value: PdfUploadValue | "") => void;
}): JSX.Element {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setFile = (file: File | undefined) => {
    if (!file) {
      onChange("");
      return;
    }

    if (!isPdfFile(file)) {
      setError("Upload a PDF file.");
      return;
    }

    setError(null);
    onChange({ pdf: file, filename: file.name });
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    setFile(event.dataTransfer.files[0]);
  };

  const fileName = value ? value.filename : null;

  return (
    <label
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `1.5px dashed ${isDragging ? 'var(--ru-color-primary)' : 'var(--ru-color-border)'}`,
        borderRadius: 'var(--ru-radius)',
        background: isDragging ? 'rgba(31, 41, 55, 0.04)' : 'var(--ru-color-muted)',
        padding: '22px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: '140px'
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0])}
        style={{ display: 'none' }}
      />
      <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ru-color-foreground)' }}>
        {fileName ?? "Drop a PDF here"}
      </span>
      <span style={{ color: 'var(--ru-color-muted-foreground)', fontSize: '0.9rem' }}>
        {fileName ? "Drop another PDF or click to replace it." : "or click to choose a file"}
      </span>
      {error && <span style={{ color: '#b91c1c', fontSize: '0.85rem' }}>{error}</span>}
    </label>
  );
}
