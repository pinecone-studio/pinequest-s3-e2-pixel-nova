import { cardClass } from "../styles";

export default function SettingsTab() {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className={cardClass}>
        <h2 className="text-sm font-semibold">Хэрэглэгчийн тохиргоо</h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="rounded-xl border border-border bg-muted px-3 py-2">
            И-мэйл: teacher@examguard.ai
          </div>
          <div className="rounded-xl border border-border bg-muted px-3 py-2">
            Багц: Pro · AI аналитик идэвхтэй
          </div>
        </div>
      </div>
      <div className={cardClass}>
        <h2 className="text-sm font-semibold">Тохиргоо</h2>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <div>Шалгалтын сануулга: Идэвхтэй</div>
          <div>Дүн автоматаар экспортлох: Долоо хоног бүр</div>
          <div>Хууран мэхлэх анхааруулга: Дунд</div>
        </div>
      </div>
    </section>
  );
}
