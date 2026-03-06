import { Separator } from "@/components/ui/separator";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="section-header mb-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {subtitle && (
          <span className="text-sm text-muted-foreground">{subtitle}</span>
        )}
      </div>
      <Separator className="mt-2 opacity-70" />
    </div>
  );
}
