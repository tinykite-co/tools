import Icon from "./Icon";
import type { OutputAsset } from "@tinykite/core";

function toBlobPart(data: OutputAsset["data"]): BlobPart {
  if (data instanceof ArrayBuffer) {
    return data;
  }

  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(data);
  return buffer;
}

export default function ResultsList({ result }: { result: any }) {
  if (result === null || result === undefined) {
    return null;
  }

  if (result && Array.isArray(result.assets)) {
    return (
      <div className="result-wrap">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {result.assets.map((asset: OutputAsset) => {
            const isImage = asset.mimeType?.startsWith("image/");
            const isVideo = asset.mimeType?.startsWith("video/");
            const blob = new Blob([toBlobPart(asset.data)], { type: asset.mimeType });
            const url = URL.createObjectURL(blob);
            
            return (
              <div
                key={asset.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  background: '#fff',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  minWidth: isImage || isVideo ? '200px' : '160px',
                  maxWidth: '100%',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
                }}
              >
                {isImage && (
                  <img
                    src={url}
                    alt={asset.label}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '280px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      background: 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 16px 16px'
                    }}
                  />
                )}
                {isVideo && (
                  <video
                    src={url}
                    controls
                    playsInline
                    style={{
                      maxWidth: '100%',
                      maxHeight: '280px',
                      borderRadius: '8px',
                      background: '#0f172a'
                    }}
                  />
                )}
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>
                  {asset.label || asset.fileName}
                </div>
                <a
                  href={url}
                  download={asset.fileName}
                  style={{
                    background: '#0f172a',
                    color: 'white',
                    padding: '0.55rem 0.9rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  Keep it
                </a>
              </div>
            )
          })}
        </div>
      </div>
    );
  }

  const body = typeof result === "string" ? result : JSON.stringify(result, null, 2);

  return (
    <div className="result-wrap">
      <div className="result-status">
        <Icon name="check" /> Yours
      </div>
      <pre className="result-block">{body}</pre>
    </div>
  );
}
