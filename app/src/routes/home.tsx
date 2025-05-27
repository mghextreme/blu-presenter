import { Button } from "@/components/ui/button";
import LanguageToggler from "@/components/ui/language-toggler";
import ThemeToggler from "@/components/ui/theme-toggler";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function Welcome() {
  const { t } = useTranslation("home");

  return (
    <div className="min-h-screen">
      <nav className="flex flex-col space-y-0 items-center justify-between px-8 py-4 shadow-sm md:flex-row">
        <div className="text-2xl"><Link to="/">Blu Presenter</Link></div>
        <div className="space-x-2 mt-4 md:mt-0">
          <LanguageToggler></LanguageToggler>
          <ThemeToggler></ThemeToggler>
          <Link to="/login">
            <Button variant="outline">{t('button.login')}</Button>
          </Link>
          <Link to="/signup">
            <Button>{t('button.signUp')}</Button>
          </Link>
        </div>
      </nav>
      <div className="flex flex-col items-center justify-center mt-24 px-4">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 text-center">
          {t('hero.title')}
        </h1>
        <p className="text-lg text-blue-700 mb-8 max-w-xl text-center">
          {t('hero.description')}
        </p>
        <div className="space-x-4">
          <Link to="/login">
            <Button variant="outline" size="lg">{t('button.login')}</Button>
          </Link>
          <Link to="/signup">
            <Button size="lg">{t('button.signUp')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
