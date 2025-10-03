import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useBroadcast } from "@/hooks/useBroadcast";
import SignalIcon from "@heroicons/react/24/solid/SignalIcon";
import SignalSlashIcon from "@heroicons/react/24/solid/SignalSlashIcon";

export function BroadcastBadge() {

  const { t } = useTranslation("controller");

  const {
    session,
  } = useBroadcast();

  return (
    <div
      className={cn(
        "hidden md:inline-flex items-center justify-center h-9 px-4 py-2 has-[>svg]:px-3 rounded-md text-sm transition-all [&_svg:not([class*='size-'])]:size-4 outline-none bg-background dark:bg-input/30 border dark:border-input shadow-xs opacity-50",
        session && session.id && "opacity-100 border-green-500 bg-green-500 text-green-100 dark:border-green-700 dark:bg-green-700 dark:text-green-200",
      )}
      title={session && session.id ? t('session.active') : t('session.inactive')}
    >
      {session && session.id ? <SignalIcon /> : <SignalSlashIcon />}
    </div>
  );
}
