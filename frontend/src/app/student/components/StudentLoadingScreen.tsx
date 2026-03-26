type StudentLoadingScreenProps = {
  usersLoading: boolean;
  onReload: () => void;
};

export default function StudentLoadingScreen({
  usersLoading,
  onReload,
}: StudentLoadingScreenProps) {
  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center px-6 text-sm text-muted-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="text-base font-semibold text-foreground">
          Өгөгдөл ачаалж байна...
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Хэрэв удаан үргэлжилбэл backend ажиллаж байгаа эсэхийг шалгана уу.
        </div>
        {!usersLoading && (
          <div className="mt-4 text-xs text-muted-foreground">
            Хэрэглэгчийн мэдээлэл авч чадсангүй.
          </div>
        )}
        <button
          className="mt-4 rounded-xl border border-border bg-muted px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/70"
          onClick={onReload}
        >
          Дахин ачаалах
        </button>
      </div>
    </div>
  );
}
