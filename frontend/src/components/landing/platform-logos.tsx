import { Instagram, Youtube, Facebook, Music } from "lucide-react";

const platforms = [
  { name: "Instagram", icon: Instagram, color: "#E4405F" },
  { name: "TikTok", icon: Music, color: "#000000" },
  { name: "YouTube", icon: Youtube, color: "#FF0000" },
  { name: "Facebook", icon: Facebook, color: "#1877F2" },
];

export function PlatformLogos() {
  return (
    <section className="flex flex-col items-center gap-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Works with
      </p>
      <div className="flex items-center gap-6">
        {platforms.map((p) => (
          <div
            key={p.name}
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <p.icon className="size-6" style={{ color: p.color }} />
            <span className="text-[10px] font-medium">{p.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
