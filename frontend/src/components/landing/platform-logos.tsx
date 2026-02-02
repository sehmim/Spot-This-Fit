import { Instagram, Youtube, Facebook, Music } from "lucide-react";

type PlatformKey = "instagram" | "tiktok" | "youtube" | "facebook";

const platforms: { key: PlatformKey; icon: typeof Instagram; color: string }[] =
  [
    { key: "instagram", icon: Instagram, color: "#E4405F" },
    { key: "tiktok", icon: Music, color: "#000000" },
    { key: "youtube", icon: Youtube, color: "#FF0000" },
    { key: "facebook", icon: Facebook, color: "#1877F2" },
  ];

interface PlatformLogosProps {
  title: string;
  labels: Record<PlatformKey, string>;
}

export function PlatformLogos({ title, labels }: PlatformLogosProps) {
  return (
    <section className="flex flex-col items-center gap-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="flex items-center gap-6">
        {platforms.map((p) => (
          <div
            key={p.key}
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <p.icon className="size-6" style={{ color: p.color }} />
            <span className="text-[10px] font-medium">{labels[p.key]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
