import { useEffect, useRef, useState, type MouseEvent } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

export type CopyCodeHandler = (code: string) => boolean | Promise<boolean>;

const COPY_FEEDBACK_MS = 1600;

type RoomCodeCopyButtonProps = {
  code: string;
  onCopyCode?: CopyCodeHandler;
  className?: string;
  iconClassName?: string;
};

export default function RoomCodeCopyButton({
  code,
  onCopyCode,
  className = "",
  iconClassName = "size-4",
}: RoomCodeCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  if (!onCopyCode) return null;

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    const success = await onCopyCode(code);
    if (!success) return;

    setCopied(true);
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      setCopied(false);
    }, COPY_FEEDBACK_MS);
  };

  return (
    <button
      type="button"
      title={copied ? "Хуулагдлаа" : "Өрөөний код хуулах"}
      aria-label={copied ? "Хуулагдлаа" : "Өрөөний код хуулах"}
      onClick={handleClick}
      className={`grid place-items-center transition ${
        copied
          ? "text-[#22b454] hover:text-[#22b454]"
          : "text-slate-500 hover:text-[#355cde]"
      } ${className}`}
    >
      {copied ? (
        <CheckIcon className={iconClassName} />
      ) : (
        <CopyIcon className={iconClassName} />
      )}
    </button>
  );
}
