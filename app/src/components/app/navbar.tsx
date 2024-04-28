import ThemeToggler from "@/components/ui/theme-toggler";

export default function AppNavbar() {
  return (
    <header className="sticky top-0 z-999 flex w-full drop-shadow-1 bg-card">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 xl:px-6">
        <div>
          Breadcrumbs...
        </div>
        <div>
          <ThemeToggler></ThemeToggler>
        </div>
      </div>
    </header>
  )
}
