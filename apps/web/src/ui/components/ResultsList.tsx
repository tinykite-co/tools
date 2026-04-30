import Icon from "./Icon";
import type { OutputAsset } from "@tinykite/core";

export default function ResultsList({ result }: { result: any }) {
  if (result === null || result === undefined) {
    return null;
  }

  if (result && Array.isArray(result.assets)) {
    return (
      <div className="result-wrap">
        <div className="result-status">
          <Icon name="check" /> Result ready!
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          {result.assets.map((asset: OutputAsset) => {
            const isImage = asset.mimeType?.startsWith("image/");
            const blob = new Blob([asset.data], { type: asset.mimeType });
            const url = URL.createObjectURL(blob);
            
            return (
              <div key={asset.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                {isImage && (
                  <img src={url} alt={asset.label} style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', background: 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 20px 20px' }} />
                )}
                <div style={{ fontWeight: 'bold' }}>{asset.fileName}</div>
                <a href={url} download={asset.fileName} style={{ background: '#1f2937', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '4px', textAlign: 'center', textDecoration: 'none', fontSize: '0.9rem' }}>
                  Download
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
        <Icon name="check" /> Result ready
      </div>
      <pre className="result-block">{body}</pre>
    </div>
  );
}
