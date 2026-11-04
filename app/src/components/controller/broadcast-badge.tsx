import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useBroadcast } from "@/hooks/useBroadcast";
import { useControllerPanels } from "@/hooks/useControllerPanels";
import { Button } from "@/components/ui/button";
import SignalIcon from "@heroicons/react/24/solid/SignalIcon";
import SignalSlashIcon from "@heroicons/react/24/solid/SignalSlashIcon";

export function BroadcastBadge() {

  const { t } = useTranslation("controller");

  const {
    session,
  } = useBroadcast();

  const openBroadcastSettings = useControllerPanels((s) => s.openBroadcastSettings);

  return (
    <Button
      variant="outline"
      className={cn(
        "hidden md:inline-flex opacity-50 transition-all",
        session && session.id && "opacity-100 border-green-500 bg-green-500 text-green-100 dark:border-green-700 dark:bg-green-700 dark:text-green-200",
      )}
      title={session && session.id ? t('session.active') : t('session.inactive')}
      onClick={() => openBroadcastSettings()}
    >
      {session && session.id ? <SignalIcon /> : <SignalSlashIcon />}
    </Button>
  );
}
