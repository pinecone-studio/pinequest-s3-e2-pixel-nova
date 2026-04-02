import { Skeleton } from "@/components/ui/skeleton";

type TeacherPageSkeletonProps = {
  variant?: "schedule" | "examLibrary" | "analytics";
};

function ScheduleTabSkeleton() {
  return (
    <section
      aria-label="Teacher page loading"
      className="mx-auto w-full max-w-[1260px] px-4 pb-8 pt-8 md:px-6 xl:px-0"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="space-y-3">
          <Skeleton className="h-7 w-52 rounded-full border-0 bg-[#e5ebf5]" />
          <div className="flex flex-wrap items-center gap-4">
            <Skeleton className="h-5 w-32 rounded-full border-0 bg-[#e5ebf5]" />
            <Skeleton className="h-5 w-32 rounded-full border-0 bg-[#e5ebf5]" />
          </div>
        </div>

        <div className="ml-auto flex flex-col items-end gap-3">
          <Skeleton className="h-[48px] w-[184px] rounded-[14px] border-0 bg-[#e5ebf5]" />
          <Skeleton className="h-[54px] w-[112px] rounded-[16px] border-0 bg-[#e5ebf5]" />
        </div>
      </div>

      <div className="mt-8 space-y-7">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-5">
            <Skeleton className="h-6 w-40 rounded-full border-0 bg-[#e5ebf5]" />
            <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: index === 0 ? 3 : 2 }).map((__, cardIndex) => (
                <div
                  key={`${index}-${cardIndex}`}
                  className="rounded-[32px] border border-[#edf1f7] bg-white p-6 shadow-[0_16px_36px_-34px_rgba(15,23,42,0.18)]"
                >
                  <div className="space-y-4">
                    <Skeleton className="h-5 w-36 rounded-full border-0 bg-[#e5ebf5]" />
                    <Skeleton className="h-4 w-2/3 rounded-full border-0 bg-[#e5ebf5]" />
                    <Skeleton className="h-4 w-1/2 rounded-full border-0 bg-[#e5ebf5]" />
                  </div>
                  <div className="mt-8 grid gap-3">
                    <Skeleton className="h-12 rounded-[18px] border-0 bg-[#e5ebf5]" />
                    <Skeleton className="h-12 rounded-[18px] border-0 bg-[#e5ebf5]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExamLibrarySkeleton() {
  return (
    <section
      aria-label="Teacher page loading"
      className="grid w-full gap-0 bg-white xl:grid-cols-[248px_minmax(0,1fr)]"
    >
      <aside className="min-h-[calc(100vh-59px)] border-r border-[#ececec] bg-white pr-[12px] pt-[16px]">
        <div className="mx-[12px]">
          <Skeleton className="h-[42px] w-full rounded-[10px] border-0 bg-[#e5ebf5]" />
        </div>

        <div className="mt-[12px] space-y-[8px] px-[12px]">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-[36px] w-full rounded-[8px] border-0 bg-[#e5ebf5]"
            />
          ))}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="w-full max-w-[1260px] px-[16px] pt-[28px] xl:px-[18px]">
          <div className="flex min-h-[65px] items-start justify-between gap-6">
            <div className="min-w-0 flex-1 space-y-3 pt-[2px]">
              <Skeleton className="h-7 w-48 rounded-full border-0 bg-[#e5ebf5]" />
              <Skeleton className="h-5 w-72 rounded-full border-0 bg-[#e5ebf5]" />
            </div>

            <Skeleton className="h-[54px] w-[214px] rounded-[16px] border-0 bg-[#e5ebf5]" />
          </div>

          <div className="mt-[16px] overflow-hidden rounded-[24px] border border-[#ededed] bg-white p-[18px] shadow-[0_12px_28px_-34px_rgba(15,23,42,0.12)]">
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className={`flex min-h-[80px] items-center justify-between gap-8 rounded-[20px] px-[12px] py-[10px] ${
                    index !== 5 ? "border-b border-[#ececec]" : ""
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-[14px]">
                    <Skeleton className="size-[38px] rounded-[14px] border-0 bg-[#e5ebf5]" />
                    <div className="min-w-0 flex-1 space-y-3">
                      <Skeleton className="h-5 w-1/3 rounded-full border-0 bg-[#e5ebf5]" />
                      <Skeleton className="h-4 w-2/3 rounded-full border-0 bg-[#e5ebf5]" />
                    </div>
                  </div>

                  <div className="ml-4 flex shrink-0 items-center gap-[24px]">
                    <Skeleton className="h-5 w-5 rounded-full border-0 bg-[#e5ebf5]" />
                    <Skeleton className="h-5 w-5 rounded-full border-0 bg-[#e5ebf5]" />
                    <Skeleton className="h-5 w-[96px] rounded-full border-0 bg-[#e5ebf5]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnalyticsTabSkeleton() {
  return (
    <section
      aria-label="Teacher page loading"
      className="mx-auto w-full max-w-[1380px] px-4 pt-[42.5px] pb-8 sm:px-6 lg:px-8"
    >
      <div className="flex gap-[46px]">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-7 w-52 rounded-full border-0 bg-[#e5ebf5]" />
          <Skeleton className="mt-3 h-4 w-[420px] rounded-full border-0 bg-[#e5ebf5]" />

          <div className="mt-6 flex gap-[14px]">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-[110px] flex-1 rounded-2xl border-0 bg-[#e5ebf5]"
              />
            ))}
          </div>

          <Skeleton className="mt-[26px] h-[380px] rounded-2xl border-0 bg-[#e5ebf5]" />
        </div>

        <div className="flex w-[421px] shrink-0 flex-col pt-[43.5px]">
          <Skeleton className="h-[318px] rounded-2xl border-0 bg-[#e5ebf5]" />
          <Skeleton className="mt-[41px] h-[210px] rounded-2xl border-0 bg-[#e5ebf5]" />
        </div>
      </div>
    </section>
  );
}

export default function TeacherPageSkeleton({
  variant = "schedule",
}: TeacherPageSkeletonProps) {
  if (variant === "examLibrary") {
    return <ExamLibrarySkeleton />;
  }

  if (variant === "analytics") {
    return <AnalyticsTabSkeleton />;
  }

  return <ScheduleTabSkeleton />;
}
