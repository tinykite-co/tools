import React, { useState, useEffect, useRef } from "react";
import { Input, Badge } from "@tinykite/ui";

export function CommandPalette({ tools, flows }: { tools: any[], flows: any[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      // Small timeout to ensure the element is painted before focusing
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const filteredTools = tools.filter(t => t.title.toLowerCase().includes(query.toLowerCase()) || t.category.toLowerCase().includes(query.toLowerCase()));
  const filteredFlows = flows.filter(f => f.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', 
      zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '15vh'
    }} onClick={() => setOpen(false)}>
      <div style={{
        background: 'var(--ru-color-background)', border: '1px solid var(--ru-color-border)', 
        borderRadius: 'var(--ru-radius-md)', width: '100%', maxWidth: '650px', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }} onClick={e => e.stopPropagation()}>
        
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--ru-color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ru-color-muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <Input 
            ref={inputRef}
            placeholder="Search free tools and premium workflows..." 
            value={query} 
            onChange={(e: any) => setQuery(e.target.value)}
            style={{ border: 'none', boxShadow: 'none', fontSize: '1.1rem', padding: '0.5rem 0', width: '100%', background: 'transparent' }}
          />
          <div style={{ fontSize: '0.7rem', color: 'var(--ru-color-muted-foreground)', padding: '0.2rem 0.4rem', border: '1px solid var(--ru-color-border)', borderRadius: '4px' }}>ESC</div>
        </div>

        <div style={{ maxHeight: '450px', overflowY: 'auto', padding: '0.5rem' }}>
          {filteredTools.length > 0 && (
            <div style={{ padding: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--ru-color-muted-foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Free Utilities</div>
              {filteredTools.map(t => (
                <a href={`/tools/${t.slug}`} key={t.slug} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', textDecoration: 'none', color: 'var(--ru-color-foreground)', borderRadius: 'var(--ru-radius-sm)', marginBottom: '0.25rem' }} className="cmd-item">
                  <span style={{ fontWeight: 500 }}>{t.title}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--ru-color-muted-foreground)' }}>{t.category}</span>
                </a>
              ))}
            </div>
          )}

          {filteredFlows.length > 0 && (
            <div style={{ padding: '0.5rem', borderTop: filteredTools.length > 0 ? '1px solid var(--ru-color-border)' : 'none' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#FF6B6B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                Premium Workflows
                <span style={{ fontSize: '0.65rem', color: 'var(--ru-color-muted-foreground)', textTransform: 'none', fontWeight: 400 }}>(Transparent: You can build these manually using the free tools)</span>
              </div>
              {filteredFlows.map(f => (
                <a href={`/flows/${f.slug}`} key={f.slug} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', textDecoration: 'none', color: 'var(--ru-color-foreground)', borderRadius: 'var(--ru-radius-sm)', marginBottom: '0.25rem' }} className="cmd-item">
                  <span style={{ fontWeight: 500 }}>{f.title}</span>
                  <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', border: '1px solid #FF6B6B', color: '#FF6B6B', borderRadius: '4px', fontWeight: 600 }}>PRO</span>
                </a>
              ))}
            </div>
          )}

          {filteredTools.length === 0 && filteredFlows.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ru-color-muted-foreground)' }}>
              No tools or workflows found for "{query}".
            </div>
          )}
        </div>
      </div>
      <style>{`
        .cmd-item:hover {
          background: var(--ru-color-muted);
        }
      `}</style>
    </div>
  );
}
