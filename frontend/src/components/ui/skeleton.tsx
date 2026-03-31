import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative animate-pulse overflow-hidden rounded-md border border-white/70 bg-[#eef3fb] before:absolute before:inset-0 before:-translate-x-full before:bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.14)_20%,rgba(255,255,255,0.78)_52%,rgba(255,255,255,0.14)_80%,transparent_100%)] before:animate-[skeleton-shimmer_1.6s_ease-in-out_infinite]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
