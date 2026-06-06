import { useTranslation } from "react-i18next";
import PlaceListPage from "./PlaceListPage";

const PlacePendingPage = () => {
  const { t } = useTranslation();
  return (
    <PlaceListPage
      initialStatus="pending"
      lockStatusFilter
      moderationMode
      allowCreate={false}
      pageTitle={t("admin.placePending.title")}
      pageMeta={t("admin.placePending.subtitle")}
    />
  );
};

export default PlacePendingPage;
