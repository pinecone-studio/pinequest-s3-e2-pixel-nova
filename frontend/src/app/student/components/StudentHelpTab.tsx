import { HelpCircle, Phone } from "lucide-react";
import { cardClass } from "../styles";

const tips = [
  {
    title: "Шалгалт эхлүүлэх",
    desc: "Өрөөний кодыг зөв оруулаад шалгах товч дарж шалгалтаа эхлүүлнэ.",
  },
  {
    title: "Хуулалтын эсрэг дүрэм",
    desc: "Таб солих, хуулалт/буулгалт хийх нь зөрчилд тооцогдоно.",
  },
  {
    title: "Дүнгийн тайлан",
    desc: "Дүнгийн таб дээр гүйцэтгэлийн түүх болон AI санал харагдана.",
  },
];

export default function StudentHelpTab() {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className={cardClass}>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <HelpCircle className="w-4 h-4" />
          Тусламж ба зөвлөмж
        </h2>
        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          {tips.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-muted px-3 py-2"
            >
              <div className="font-semibold text-foreground">{item.title}</div>
              <div className="text-xs text-muted-foreground">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={cardClass}>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Phone className="w-4 h-4" />
          Холбоо барих
        </h2>
        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          <div className="rounded-xl border border-border bg-muted px-3 py-2">
            Тусламжийн имэйл: support@educore.mn
          </div>
          <div className="rounded-xl border border-border bg-muted px-3 py-2">
            Лавлах: 7700-1122
          </div>
          <div className="rounded-xl border border-border bg-muted px-3 py-2">
            Асуулт илгээх: “Мэдэгдэл” хэсгээр дамжуулж болно.
          </div>
        </div>
      </div>
    </section>
  );
}
