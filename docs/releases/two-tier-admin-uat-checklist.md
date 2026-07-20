# Checklist UAT hành chính hai tầng

Người review: Product, QA và Technical Owner. Chạy trước tại Cần Thơ (`92`), sau đó lặp lại với đúng một tỉnh thứ hai được Product chọn.

## API và dữ liệu

- [ ] Database/audit có đủ 34 tỉnh/thành và public API chỉ trả các tỉnh nằm trong rollout allowlist, mã dạng string.
- [ ] Production mặc định chỉ hiển thị Cần Thơ; staging UAT đặt `ENABLED_PROVINCE_CODES=92,<second-code>`.
- [ ] Danh sách phường/xã chỉ chứa đơn vị thuộc tỉnh đã chọn.
- [ ] Search bỏ được tiền tố `phường`, `xã`, `đặc khu` và dấu tiếng Việt nhưng không trộn tỉnh.
- [ ] Lookup tọa độ trả `ambiguous` khi có nhiều polygon; không chọn nearest.
- [ ] Place V2 bắt buộc `provinceCode`, lọc đúng `wardCode`, không trả Place có exception mở.
- [ ] Tạo Place chỉ có tỉnh (không ward) thành công.
- [ ] Tạo/cập nhật ward khác tỉnh bị từ chối.
- [ ] Tọa độ ngoài ward được chọn bị từ chối.

## Web/admin

- [ ] Tạo và sửa một Place Cần Thơ bằng Province → Ward.
- [ ] Tạo và sửa một Place ở tỉnh thứ hai.
- [ ] Search ward hoạt động với danh sách dài; hiển thị đúng `phường/xã/đặc khu`.
- [ ] Preview và payload giữ nguyên code string, kể cả code có số 0 đầu.
- [ ] Luồng chọn tọa độ Cần Thơ cũ không ghi đè lựa chọn canonical.
- [ ] Các màn hình bản đồ hiện hữu không thay đổi trong đợt này.

## Mobile

- [ ] Profile tải tỉnh/ward từ API nội bộ và persist `{provinceCode,datasetReleaseId}`.
- [ ] Chuyển tỉnh xóa ward cũ.
- [ ] Offline/error state không làm mất lựa chọn đã lưu.
- [ ] Không có request tới `34tinhthanh.com`.

## Gate

- [ ] R1 đã ký, exception Cần Thơ đã được xử lý/withhold.
- [ ] R2 có chữ ký Product + QA và lưu screenshot/log/test output.
- [ ] Chưa bật tỉnh thứ hai cho production trước khi metric Cần Thơ ổn định.
