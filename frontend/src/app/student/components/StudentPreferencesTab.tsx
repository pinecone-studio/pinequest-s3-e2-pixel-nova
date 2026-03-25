import { Settings, Tv } from "lucide-react";
import { cardClass } from "../styles";

export default function StudentPreferencesTab() {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className={cardClass}>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Settings className="w-4 h-4" />
          Тохиргоо
        </h2>
        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2">
            <span>Мэдэгдэл</span>
            <span className="text-xs font-semibold text-foreground">
              Асаалттай
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2">
            <span>Авто хадгалалт</span>
            <span className="text-xs font-semibold text-foreground">
              30 сек
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2">
            <span>Төвлөрөх горим</span>
            <span className="text-xs font-semibold text-foreground">
              Идэвхтэй
            </span>
          </div>
        </div>
      </div>
      <div className={cardClass}>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Tv className="w-4 h-4" />
          Дэлгэц
        </h2>
        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2">
            <span>Харагдац</span>
            <span className="text-xs font-semibold text-foreground">
              Автомат
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2">
            <span>Фонт</span>
            <span className="text-xs font-semibold text-foreground">Дунд</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2">
            <span>Анимаци</span>
            <span className="text-xs font-semibold text-foreground">
              Зөөлөн
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
