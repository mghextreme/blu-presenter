import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import CommandLineIcon from "@heroicons/react/24/solid/CommandLineIcon";

type Shortcut = {
  keys: string[]
  altKeys?: string[]
  label: string
}

function Kbd({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <kbd className="inline-flex h-6 min-w-6 select-none items-center justify-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

export function ShortcutsDialogButton() {

  const { t } = useTranslation("controller");

  // Keep in sync with the hotkeys registered in controller.provider.tsx
  const shortcuts: Shortcut[] = [
    { keys: ['←'], altKeys: ['Page Up'], label: t('shortcuts.previous') },
    { keys: ['→'], altKeys: ['Page Down'], label: t('shortcuts.next') },
    { keys: ['Ctrl', '←'], altKeys: ['Ctrl', 'Page Up'], label: t('shortcuts.previousScheduleItem') },
    { keys: ['Ctrl', '→'], altKeys: ['Ctrl', 'Page Down'], label: t('shortcuts.nextScheduleItem') },
    { keys: ['Ctrl', 'B'], label: t('shortcuts.blank') },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" title={t('shortcuts.title')} aria-label={t('shortcuts.title')}>
          <CommandLineIcon className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{t('shortcuts.title')}</DialogTitle>
        </DialogHeader>
        <table className="w-full text-sm">
          <tbody>
            {shortcuts.map((shortcut, ix) => (
              <tr key={ix} className="border-b last:border-b-0">
                <td className="py-2 pe-4 align-middle">{shortcut.label}</td>
                <td className="py-2 pe-4 align-middle" colSpan={shortcut.altKeys ? 1 : 2}>
                  <span className="flex items-center justify-center gap-1 whitespace-nowrap">
                    {shortcut.keys.map((key) => <Kbd key={key}>{key}</Kbd>)}
                  </span>
                </td>
                {shortcut.altKeys && (
                  <td className="py-2 align-middle ">
                    <span className="flex items-center justify-center gap-1 whitespace-nowrap">
                      {shortcut.altKeys.map((key) => <Kbd key={key}>{key}</Kbd>)}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </DialogContent>
    </Dialog>
  );
}
