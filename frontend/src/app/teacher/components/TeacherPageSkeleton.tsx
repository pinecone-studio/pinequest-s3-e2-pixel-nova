import LoadingScreen from "@/components/ui/loading-screen";
import { contentCanvasClass } from "../styles";

export default function TeacherPageSkeleton() {
  return (
    <section aria-label="Teacher page loading" className={contentCanvasClass}>
      <LoadingScreen
        title="Багшийн самбарыг бэлдэж байна"
        subtitle="Шалгалт, хуваарь, гүйцэтгэлийн мэдээллийг синк хийж байна."
        compact
      />
    </section>
  );
}
