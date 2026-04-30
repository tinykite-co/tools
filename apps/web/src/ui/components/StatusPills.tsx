import Icon from "./Icon";
import { Badge } from "@refraction-ui/react";

export interface StatusPill {
  label: string;
  tone: "success" | "warning" | "neutral";
}

export default function StatusPills({ items }: { items: StatusPill[] }) {
  return (
    <div className="status-pills" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {items.map((item) => (
        <Badge key={item.label} variant={item.tone === "success" ? "success" : item.tone === "warning" ? "warning" : "default"}>
          {item.tone === "success" && <Icon name="check" />}
          {item.tone === "warning" && <Icon name="warning" />}
          <span style={{ marginLeft: '4px' }}>{item.label}</span>
        </Badge>
      ))}
    </div>
  );
}
