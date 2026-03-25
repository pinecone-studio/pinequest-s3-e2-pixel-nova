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
    <div className={`${cardClass} ${className ?? ""}`}>
      <Skeleton className="h-5 w-40" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
