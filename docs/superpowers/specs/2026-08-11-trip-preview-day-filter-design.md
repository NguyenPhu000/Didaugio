# Trip preview theo ngày

## Mục tiêu

Map preview và bottom sheet phải luôn thể hiện cùng một ngày của hành trình. Tất cả ngày có địa điểm đều hiển thị trong tab, gồm cả ngày quá hạn. Người dùng chỉ bắt đầu dẫn đường vào đúng ngày của hành trình.

## Nguồn dữ liệu và quy tắc ngày

- Dùng `trip.startDate` và `destination.dayNumber` làm nguồn duy nhất để xác định ngày lịch.
- So sánh theo ngày cục bộ của thiết bị, không theo thời điểm UTC. Ngày được mở lúc 00:00 địa phương.
- Một ngày hợp lệ phải có ít nhất một destination hợp lệ trong trip.
- Mọi ngày có destination được tạo thành tab. Ngày trước hôm nay mang trạng thái quá hạn.
- Ưu tiên chọn hôm nay. Nếu hôm nay không có chặng thì chọn ngày tương lai gần nhất. Nếu không còn ngày tương lai thì chọn ngày quá hạn gần nhất.
- Trip không có `startDate` giữ nguyên preview hiện có để không chặn dữ liệu cũ.
- Ngày quá hạn vẫn dựng đầy đủ route, marker, stops, segments và tổng quan để người dùng xem lại đúng lộ trình của ngày đó.

## Luồng dữ liệu

1. Helper thuần tạo `previewDays` từ các destination đã sắp xếp theo `dayNumber` và thứ tự trong ngày.
2. State `selectedDayNumber` chọn một phần tử trong `previewDays`.
3. Hook preview nhận ngày đang chọn, chỉ dựng stops, segments, totals, warning và route cho ngày đó.
4. Map canvas dùng stops và route đã lọc. Marker được đánh lại `1..N` trong phạm vi ngày đang chọn.
5. Bottom sheet dùng cùng stops và segments. Mỗi tab chỉ tham chiếu đúng dayNumber đã có trong trip.

## Tương tác bottom sheet

- Tab ngang, có nhãn `Ngày N` và ngày lịch. Tab đang chọn dùng nền than, chữ trắng. Tab ngày quá hạn có nhãn `Đã hết hạn` rõ ràng. Tab tương lai dùng nền trắng, viền xám đậm và chữ than.
- Tab hiện khi ngày đó có địa điểm, không phụ thuộc ngày đã qua hay chưa.
- Dòng tổng quan, cảnh báo, danh sách chặng và CTA chỉ tính cho tab đang chọn.
- Ngày tương lai vẫn hiển thị map và danh sách để xem trước. Nút `Bắt đầu` tại điểm đầu và CTA dẫn đường bị vô hiệu hóa, với nội dung có thể bắt đầu từ ngày tương ứng.
- Ngày quá hạn vẫn hiển thị map và danh sách của chính ngày đó. Nút `Bắt đầu` và CTA bị vô hiệu hóa. Sheet hiển thị thông báo `Hành trình ngày dd/MM đã quá hạn`, CTA hiển thị `Đã hết hạn`.
- Ngày hôm nay giữ nguyên hành vi bắt đầu dẫn đường.

## Trạng thái lỗi và biên

- Destination không có dayNumber được gom vào ngày 1 để giữ tương thích dữ liệu cũ.
- Không có destination cho ngày đã chọn thì chọn lại ngày hợp lệ gần nhất.
- Trip chỉ có ngày quá hạn vẫn chọn ngày quá hạn gần nhất và giữ sheet xem lại lộ trình thay vì tạo trạng thái rỗng.

## Kiểm thử

- Helper: giữ ngày quá khứ, hôm nay và tương lai, gắn đúng trạng thái ngày, chọn tab mặc định, và fallback khi thiếu startDate.
- Preview: đổi tab thay route, stops, tổng khoảng cách, tổng thời lượng và marker đánh số theo đúng ngày.
- CTA: ngày hôm nay được bắt đầu, ngày tương lai bị khóa, ngày quá hạn bị khóa và có nội dung rõ ràng.

## Ngoài phạm vi

- Không đổi cấu trúc dữ liệu trip trên server.
- Không thêm thư viện, store toàn cục hoặc API mới.
- Không đổi kiểu marker hoặc layout bottom sheet ngoài phần tab và trạng thái khóa theo ngày.
