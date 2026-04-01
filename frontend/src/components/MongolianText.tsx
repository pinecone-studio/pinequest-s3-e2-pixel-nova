import { cn } from "@/lib/utils";
import { hasTraditionalMongolian } from "@/lib/mongolian-script";

type MongolianTextProps = {
  text: string;
  className?: string;
};

export default function MongolianText({
  text,
  className,
}: MongolianTextProps) {
  if (!text) return null;

  const isTraditional = hasTraditionalMongolian(text);

  return (
    <div
      data-testid={isTraditional ? "traditional-mongolian-text" : "plain-text"}
      data-traditional-mongolian={isTraditional ? "true" : "false"}
      className={cn(
        "min-w-0 whitespace-pre-wrap break-words",
        isTraditional &&
          "mongolian-text max-h-[32rem] overflow-x-auto overflow-y-hidden rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3",
        className,
      )}
    >
      {text}
    </div>
  );
}
