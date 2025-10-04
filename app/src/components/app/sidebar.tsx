import { useState } from "react";
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ChevronDoubleLeftIcon from "@heroicons/react/24/solid/ChevronDoubleLeftIcon";
import ChevronDoubleRightIcon from "@heroicons/react/24/solid/ChevronDoubleRightIcon";
import { useAuth } from "@/hooks/useAuth";
import { isRoleHigherOrEqualThan } from "@/types";

export default function AppSidebar() {

  const { t } = useTranslation("app");

  const [expanded, setExpanded] = useState(false);

  const {
    organization,
  } = useAuth();

  function SidebarMenuItem({ to, content, disabled = false }: { to: string, content: string, disabled?: boolean }) {
    return (
      <li>
        <Link
          to={to}
          onClick={() => setExpanded(false)}
          title={content}
          className={cn(
            'group relative flex items-center gap-2 rounded-sm px-4 py-2 font-medium hover:bg-background',
            disabled && 'opacity-50 pointer-events-none',
          )}
        >
          {content}
        </Link>
      </li>
    )
  }

  return (
    <>
      <aside className={cn(
        'shrink-0 flex w-80 flex-col overflow-x-visible overflow-y-hidden bg-card -mr-80 lg:mr-0 -translate-x-full lg:translate-x-0 transition-opacity transition-transform duration-300 ease-in-out transform z-20 shadow-lg lg:shadow-none',
        expanded ? 'translate-x-0' : ''
      )}>
        <nav className="px-4 py-6">
          <ul className="flex flex-col gap-1.5">
            <h3 className="mb-1 ml-3 text-sm font-medium text-bodydark2">{t('menu.title.menu')}</h3>
            <hr />
            <SidebarMenuItem to="/app" content={t('menu.home')} />
            <SidebarMenuItem to="/app/controller" content={t('menu.controller')} />
            <SidebarMenuItem to="/app/discover" content={t('menu.discover')} />
            <h3 className="mt-5 mb-1 ml-3 text-sm font-medium text-bodydark2">{t('menu.title.organization')}</h3>
            <hr />
            <SidebarMenuItem to="/app/organization" content={t('menu.organization')} />
            <SidebarMenuItem to="/app/songs" content={t('menu.songs')} />
            <SidebarMenuItem to="/app/themes" content={t('menu.themes')} />
            <SidebarMenuItem to="/app/sessions" content={t('menu.sessions')} disabled={!isRoleHigherOrEqualThan(organization?.role, 'admin')} />
            <h3 className="mt-5 mb-1 ml-3 text-sm font-medium text-bodydark2">{t('menu.title.account')}</h3>
            <hr />
            <SidebarMenuItem to="/app/profile" content={t('menu.profile')} />
          </ul>
          <Button variant="outline" className="fixed bottom-2 right-2 lg:hidden" onClick={() => setExpanded(false)}>
            <ChevronDoubleLeftIcon className="size-3" />
          </Button>
        </nav>
      </aside>
      <Button variant="outline" className="fixed left-2 bottom-2 z-10 shadow-md lg:hidden" onClick={() => setExpanded(true)}>
        <ChevronDoubleRightIcon className="size-3" />
      </Button>
      {expanded && <div className="fixed inset-0 bg-black opacity-50 z-10 lg:hidden" onClick={() => setExpanded(false)} />}
    </>
  )
}
