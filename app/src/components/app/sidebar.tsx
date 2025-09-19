import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export default function AppSidebar() {

  const { t } = useTranslation("app");

  return (
    <aside className="flex h-screen w-80 flex-col overflow-y-hidden bg-card">
      <div className="flex items-center justify-between px-6 py-5">
        <Link to="/app">
          <span className="text-2xl">BluPresenter</span>
        </Link>
      </div>
      <div className="no-scrollbar flex flex-col overflow-y-auto">
        <nav className="mt-5 px-4 py-6">
          <ul className="flex flex-col gap-1.5">
            <h3 className="mb-1 ml-3 text-sm font-medium text-bodydark2">{t('menu.title.menu')}</h3>
            <hr />
            <li>
              <Link to={'/app'} className="group relative flex items-center gap-2 rounded-sm px-4 py-2 font-medium hover:bg-background">
                {t('menu.home')}
              </Link>
            </li>
            <li>
              <Link to={'/app/controller'} className="group relative flex items-center gap-2 rounded-sm px-4 py-2 font-medium hover:bg-background">
                {t('menu.controller')}
              </Link>
            </li>
            <li>
              <Link to={'/app/discover'} className="group relative flex items-center gap-2 rounded-sm px-4 py-2 font-medium hover:bg-background">
                {t('menu.discover')}
              </Link>
            </li>
            <h3 className="mt-5 mb-1 ml-3 text-sm font-medium text-bodydark2">{t('menu.title.organization')}</h3>
            <hr />
            <li>
              <Link to={'/app/organization'} className="group relative flex items-center gap-2 rounded-sm px-4 py-2 font-medium hover:bg-background">
                {t('menu.organization')}
              </Link>
            </li>
            <li>
              <Link to={'/app/songs'} className="group relative flex items-center gap-2 rounded-sm px-4 py-2 font-medium hover:bg-background">
                {t('menu.songs')}
              </Link>
            </li>
            <li>
              <Link to={'/app/themes'} className="group relative flex items-center gap-2 rounded-sm px-4 py-2 font-medium hover:bg-background">
                {t('menu.themes')}
              </Link>
            </li>
            <h3 className="mt-5 mb-1 ml-3 text-sm font-medium text-bodydark2">{t('menu.title.account')}</h3>
            <hr />
            <li>
              <Link to={'/app/profile'} className="group relative flex items-center gap-2 rounded-sm px-4 py-2 font-medium hover:bg-background">
                {t('menu.profile')}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  )
}
