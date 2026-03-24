import { cardClass } from "../styles";

type StudentSettingsTabProps = {
  username: string;
};

export default function StudentSettingsTab({ username }: StudentSettingsTabProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className={cardClass}>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <svg
            className="h-4 w-4 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          </svg>
          Профайл
        </h2>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <div>Нэр: {username}</div>
          <div>Багц: Сурагч Pro</div>
          <div>Мэдэгдэл: Идэвхтэй</div>
        </div>
      </div>
      <div className={cardClass}>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <svg
            className="h-4 w-4 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 4v6h-6" />
            <path d="M3 20v-6h6" />
            <path d="M21 10a9 9 0 0 0-15.3-6.3L3 6" />
            <path d="M3 18a9 9 0 0 0 15.3 2.3L21 18" />
          </svg>
          Тохиргоо
        </h2>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <div>Авто хадгалалт: Асаалттай</div>
          <div>Шалгалтын сануулга: Асаалттай</div>
          <div>Төвлөрөх горим: Идэвхтэй</div>
        </div>
      </div>
    </section>
  );
}
