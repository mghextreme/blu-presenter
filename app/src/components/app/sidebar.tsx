import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export default function AppSidebar() {

  const { t } = useTranslation("app");

  return (
    <aside className="flex h-screen w-80 flex-col overflow-y-hidden bg-card">
      <div className="flex items-center justify-between px-6 py-5">
        <Link to="/app">
          <span className="text-2xl">Blu Presenter</span>
        </Link>
      </div>
      <div className="no-scrollbar flex flex-col overflow-y-auto">
        <nav className="mt-5 px-4 py-4 lg:mt-9 lg:px-6">
          <div>
            <h3 className="mb-4 ml-4 text-sm font-medium text-bodydark2">MENU</h3>

            <ul className="mb-6 flex flex-col gap-1.5">
              <li>
                <Link to={'/app/controller'} className="group relative flex items-center gap-2 rounded-sm px-4 py-2 font-medium hover:bg-background">
                  {t('menu.controller')}
                </Link>
              </li>
              <li>
                <Link to={'/app/songs'} className="group relative flex items-center gap-2 rounded-sm px-4 py-2 font-medium hover:bg-background">
                  {t('menu.songs')}
                </Link>
              </li>
              <li>
                <Link to={'/app/profile'} className="group relative flex items-center gap-2 rounded-sm px-4 py-2 font-medium hover:bg-background">
                  {t('menu.profile')}
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </aside>
  )
}
