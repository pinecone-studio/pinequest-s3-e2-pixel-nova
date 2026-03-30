import { Skeleton } from "@/components/ui/skeleton";
import { contentCanvasClass } from "../styles";

export default function TeacherPageSkeleton() {
  return (
    <section
      aria-label="Teacher page loading"
      className={`space-y-7 ${contentCanvasClass}`}
    >
      <div className="space-y-3">
        <Skeleton className="h-8 w-[196px] rounded-full bg-[#e7e7e7]" />
        <Skeleton className="h-8 w-full max-w-[470px] rounded-full bg-[#e7e7e7]" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-[58px] w-full rounded-[20px] bg-[#e7e7e7]"
          />
        ))}
      </div>

      <Skeleton className="h-[360px] w-full rounded-[32px] bg-[#e7e7e7]" />
    </section>
  );
}
