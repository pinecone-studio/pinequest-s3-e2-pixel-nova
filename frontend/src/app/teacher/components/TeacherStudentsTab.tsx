import { cardClass } from "../styles";

const actions = [
  { label: "Сурагч нэмэх", note: "Бүртгэл үүсгэх" },
  { label: "Импорт хийх", note: "CSV/Excel" },
  { label: "Идэвхтэй сурагч", note: "Сүүлийн 7 хоног" },
];

export default function TeacherStudentsTab() {
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
            <path d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3" />
            <circle cx="8" cy="8" r="3" />
            <path d="M2 20c0-3 3-5 6-5s6 2 6 5" />
            <path d="M17 20c0-2.2-1.4-4.1-3.4-4.7" />
          </svg>
          Сурагчдын менежмент
        </h2>
        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          {actions.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2"
            >
              <span>{item.label}</span>
              <span className="text-xs font-semibold text-foreground">{item.note}</span>
            </div>
          ))}
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
            <path d="M3 3v18h18" />
            <path d="M7 14v4" />
            <path d="M12 10v8" />
            <path d="M17 6v12" />
          </svg>
          Хяналтын товчхон
        </h2>
        <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
          <div className="rounded-xl border border-border bg-muted px-3 py-2">
            Дундаж гүйцэтгэл: 83%
          </div>
          <div className="rounded-xl border border-border bg-muted px-3 py-2">
            Зөрчилтэй сурагч: 3
          </div>
          <div className="rounded-xl border border-border bg-muted px-3 py-2">
            Нийт сурагч: 42
          </div>
        </div>
      </div>
    </section>
  );
}
