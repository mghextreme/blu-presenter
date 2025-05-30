import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import LanguageToggler from "@/components/ui/language-toggler";
import ThemeToggler from "@/components/ui/theme-toggler";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function Welcome() {
  const { t } = useTranslation("home");

  return (
    <div className="min-h-screen">
      <nav className="flex flex-col space-y-0 items-center justify-between px-8 py-4 shadow-sm md:flex-row">
        <div className="text-2xl"><Link to="/">BluPresenter</Link></div>
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
      <div className="flex flex-col items-center justify-center py-48 px-4 bg-gray-200 dark:bg-gray-900">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 text-center">
          {t('hero.title')}
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl text-center">
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
      <div className="flex flex-col items-center py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-medium mb-12">{t('features.title')}</h2>
        <div className="w-full max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6 sm:gap-y-10">
          <Card className="bg-transparent border-none gap-0 shadow-none">
            <CardHeader className="text-xl font-medium justify-center">{t('features.free.title')}</CardHeader>
            <CardContent>{t('features.free.description')}</CardContent>
          </Card>
          <Card className="bg-transparent border-none gap-0 shadow-none">
            <CardHeader className="text-xl font-medium justify-center">{t('features.openSource.title')}</CardHeader>
            <CardContent>{t('features.openSource.description')}</CardContent>
          </Card>
          <Card className="bg-transparent border-none gap-0 shadow-none">
            <CardHeader className="text-xl font-medium justify-center">{t('features.noInstallation.title')}</CardHeader>
            <CardContent>{t('features.noInstallation.description')}</CardContent>
          </Card>
          <Card className="bg-transparent border-none gap-0 shadow-none">
            <CardHeader className="text-xl font-medium justify-center">{t('features.anywhere.title')}</CardHeader>
            <CardContent>{t('features.anywhere.description')}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
