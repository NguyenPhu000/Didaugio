import { Link } from "react-router-dom";
import { Button } from "@/components/ui";
import { useTranslation } from "react-i18next";

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-muted">404</h1>
        <h2 className="text-2xl font-bold text-foreground mt-4">
          {t("notFound.title")}
        </h2>
        <p className="text-muted-foreground mt-2">
          {t("notFound.description")}
        </p>
        <Link to="/" className="inline-block mt-6">
          <Button>{t("notFound.backHome")}</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
