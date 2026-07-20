# Biên bản staging dữ liệu hành chính hai tầng

Tài liệu này là mẫu bằng chứng cho các gate R0–R2. Không được đánh dấu đạt nếu lệnh chưa chạy trên staging PostGIS và chưa đính kèm output thực tế.

## Phạm vi đợt này

- Triển khai mô hình `Tỉnh/Thành phố → Phường/Xã/Đặc khu` và ưu tiên Cần Thơ.
- Nguồn pin: `ThangLeQuoc/vietnamese-provinces-database`, tag `v3.1.0`, commit `21419f261aba49dc475e66290f83d4b6d3af4546`.
- AI Audio Guide, TTS, 3D globe và mọi thay đổi UI/API ranh giới bản đồ được hoãn.
- Không có runtime HTTP tới GitHub hay `34tinhthanh.com`; runtime chỉ đọc database ứng dụng.

## R0 — nguồn và import

| Kiểm tra | Kỳ vọng | Bằng chứng staging |
|---|---:|---|
| Province | 34 | Chưa chạy |
| Second-tier unit | 3.321 | Chưa chạy |
| Ward / commune / special region | 697 / 2.611 / 13 | Chưa chạy |
| Cần Thơ (`92`) | 103 đơn vị | Chưa chạy |
| Hash 4 artifact và manifest | Khớp manifest | Chưa chạy |
| Parent, code unique, SRID 4326, geometry valid | 100% | Chưa chạy |

Kiểm tra snapshot không cần DB:

```powershell
$env:VN_ADMIN_SOURCE_DIR='D:\path\vietnamese-provinces-database-v3.1.0'
npm run admin-data:audit -- --source-only
```

Import staging/canonical ở trạng thái chưa active:

```powershell
$env:DATABASE_URL='postgresql://...staging...'
$env:VN_ADMIN_SOURCE_DIR='D:\path\vietnamese-provinces-database-v3.1.0'
npm run migrate:deploy
npm run admin-data:import
npm run admin-data:audit
```

Chỉ active sau khi Product và Technical Owner ký R0:

```powershell
$env:ADMIN_DATA_ACTIVATION_APPROVED='true'
npm run admin-data:import -- --activate
```

## R1 — backfill Cần Thơ

```powershell
npm run admin-location:backfill
npm run admin-location:audit -- --csv=artifacts\can-tho-place-location.csv
```

Đính kèm: tổng Place đang hoạt động, số mapped, danh sách `zero_match`, `multiple_matches`, `invalid_coordinate`, `outside_province`, mẫu đối chiếu tọa độ và kết quả rollback drill. Mọi exception mở phải được sửa hoặc chủ động loại khỏi discovery; không tự gán nearest ward.

## R2 — UAT

Đính kèm output test server/app, web build, ảnh UAT Cần Thơ và một tỉnh thứ hai, cùng bằng chứng không còn traffic `34tinhthanh.com`. Trạng thái hiện tại của tài liệu: **chờ staging và review chung**, không phải giấy phép production.
