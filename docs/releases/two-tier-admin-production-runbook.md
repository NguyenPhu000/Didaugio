# Runbook production hành chính hai tầng

Runbook này không tự cấp quyền deploy. Chỉ thực hiện sau R3 với backup đã thử restore, release owner cụ thể và cửa sổ rollback được thống nhất.

## Trước cutover

1. Ghi lại commit ứng dụng, checksum migration, tag/commit nguồn và người phê duyệt.
2. Tạo backup production; restore thử sang môi trường tách biệt và ghi thời gian phục hồi.
3. Xác nhận PostGIS, dung lượng, dashboard/alert cho active release, cache hit/miss, mapped/unresolved Place và traffic V1/V2.
4. Chạy toàn bộ rehearsal trên bản restore: migration → import inactive → audit → active release → backfill → audit → API/web/mobile UAT.
5. Giới hạn feature flag ở Cần Thơ; tỉnh thứ hai mặc định tắt.

Thiết lập server mặc định chỉ mở Cần Thơ. Khi R2/R3 cho phép tỉnh thứ hai, khai báo allowlist code string, ví dụ:

```powershell
$env:ENABLED_PROVINCE_CODES='92,01'
```

Không đặt biến này thì hệ thống chỉ trả và chấp nhận tỉnh `92`.

## Thứ tự triển khai

```powershell
$env:DATABASE_URL='postgresql://...production...'
$env:VN_ADMIN_SOURCE_DIR='D:\approved\vietnamese-provinces-database-v3.1.0'
npm run migrate:deploy
npm run admin-data:import
npm run admin-data:audit
```

Review output, sau đó active release bằng phê duyệt hai lớp:

```powershell
$env:ADMIN_DATA_ACTIVATION_APPROVED='true'
npm run admin-data:import -- --activate
npm run admin-location:backfill
npm run admin-location:audit -- --csv=artifacts\production-place-location.csv
```

Deploy theo thứ tự: server V2 → web → mobile theo staged rollout. Theo dõi lỗi 4xx/5xx, mapping exceptions, release ID và cache. Chỉ mở tỉnh thứ hai sau thời gian quan sát Cần Thơ được R3 chấp thuận.

## Rollback

1. Dừng rollout client/feature flag; giữ nguyên schema mở rộng.
2. Chuyển active release về release trước đã audit (thao tác có review và transaction; không xóa release), sau đó chạy lại `admin-location:backfill` cho release cũ để reconcile toàn bộ Place.
3. Chỉ trong rollback của lần triển khai đầu tiên, khi database có đúng một administrative release, có thể xóa canonical codes và exception:

```powershell
$env:ADMIN_LOCATION_ROLLBACK_APPROVED='true'
npm run admin-location:backfill -- --rollback
```

Lệnh `--rollback` cố ý từ chối chạy nếu đã có nhiều release để tránh xóa mapping của release trước.

4. Khôi phục traffic về V1/luồng Cần Thơ tương thích. Không drop `district_id`, `ward_id`, bảng legacy hay dữ liệu nguồn trong incident rollback.
5. Nếu migration/schema gây sự cố không thể cô lập, dùng backup đã thử restore theo quy trình vận hành DB; ghi đầy đủ RTO/RPO và incident timeline.

## R4

Giữ compatibility tối thiểu 30 ngày. Việc bỏ cột/bảng legacy là migration phá hủy riêng, chỉ lập sau báo cáo dependency/traffic và phê duyệt R4; không nằm trong rollout này.
