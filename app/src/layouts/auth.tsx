import {
  Link,
  Outlet,
  useLocation,
} from "react-router-dom";

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import ThemeToggler from "@/components/ui/theme-toggler";
import { useEffect, useState } from "react";
import LanguageToggler from "@/components/ui/language-toggler";

export default function AuthLayout() {

  const location = useLocation();

  const [isLogin, setIsLogin] = useState<boolean>(false);
  useEffect(() => {
    setIsLogin(location.pathname == '/login');
  }, [location])

  return (
    <div className="container relative hidden h-screen overflow-hidden flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-card">
      <div className="absolute right-4 top-4 md:right-8 md:top-8 flex justify-end">
        <Link
          to={isLogin ? '/signup' : '/login'}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            ""
          )}
        >
          {isLogin ? 'Sign Up' : 'Login'}
        </Link>
        <LanguageToggler variant="ghost"></LanguageToggler>
        <ThemeToggler variant="ghost"></ThemeToggler>
      </div>
      <div className="relative hidden h-full flex-col p-10 text-foreground lg:flex dark:border-r">
        <div className="absolute inset-0 bg-background" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          Blu Presenter
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
