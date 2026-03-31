import { Skeleton } from "@/components/ui/skeleton";
import { cardClass } from "../styles";

type TeacherCardSkeletonProps = {
  className?: string;
  rows?: number;
};

export default function TeacherCardSkeleton({
  className,
  rows = 4,
}: TeacherCardSkeletonProps) {
  return (
    <div className={`${cardClass} ${className ?? ""} border-[#e6edf8] bg-white/95 shadow-[0_20px_42px_-34px_rgba(15,23,42,0.2)]`}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-8 w-44 rounded-full" />
      </div>
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="rounded-[22px] border border-[#edf2fb] bg-[#fbfdff] p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-2.5">
                <Skeleton className="h-4 w-2/5 rounded-full" />
                <Skeleton className="h-3 w-4/5 rounded-full" />
              </div>
              <Skeleton className="h-10 w-10 rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
