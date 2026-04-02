import LoadingScreen from "@/components/ui/loading-screen";

type StudentLoadingScreenProps = {
  usersLoading: boolean;
  onReload: () => void;
};

export default function StudentLoadingScreen({
  usersLoading,
  onReload,
}: StudentLoadingScreenProps) {
  return (
    <LoadingScreen
      fullScreen
      title={usersLoading ? "Сурагчийн орчныг бэлдэж байна" : "Өгөгдөл ачаалж чадсангүй"}
      subtitle={
        usersLoading
          ? "Шалгалт, оноо, мэдэгдлийн мэдээллийг шинэчилж байна. Түр хүлээнэ үү."
          : "Серверийн холболтоо шалгаад дахин ачаалж үзнэ үү."
      }
      className="after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(180deg,transparent,rgba(5,8,22,0.38))]"
    >
      <button
        className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-2xl border border-white/12 bg-white/6 px-4 py-2 text-sm font-semibold text-white/80 backdrop-blur transition hover:bg-white/10"
        onClick={onReload}
        type="button"
      >
        Дахин ачаалах
      </button>
    </LoadingScreen>
  );
}
