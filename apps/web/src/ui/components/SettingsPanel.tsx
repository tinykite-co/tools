import { useState } from "react";
import Icon from "./Icon";
import { Card, CardHeader, CardTitle, CardContent } from "@refraction-ui/react";

export default function SettingsPanel({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="settings-panel" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
      <CardHeader style={{ padding: '0.75rem 1rem', cursor: 'pointer' }} onClick={() => setOpen((value) => !value)}>
        <CardTitle style={{ fontSize: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
          {title}
          <Icon name={open ? "check" : "warning"} />
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent>
          {children}
        </CardContent>
      )}
    </Card>
  );
}
