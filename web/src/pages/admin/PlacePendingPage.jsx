import PlaceListPage from "./PlaceListPage";

const PlacePendingPage = () => {
  return (
    <PlaceListPage
      initialStatus="pending"
      lockStatusFilter
      moderationMode
      allowCreate={false}
      pageTitle="HÀNG ĐỢI DUYỆT ĐỊA ĐIỂM"
      pageMeta="DANH SÁCH ĐỊA ĐIỂM CHỜ PHÊ DUYỆT"
    />
  );
};

export default PlacePendingPage;
