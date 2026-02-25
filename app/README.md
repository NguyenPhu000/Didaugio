# Đi Đâu Giờ? Mobile App (Expo SDK 54)

Scaffold bước đầu cho app mobile theo server hiện tại.

## Stack

- Expo SDK 54
- Expo Router
- React Query
- Zustand
- Axios

## Cấu trúc chính

```text
app/
  app/                    # routes (expo-router)
  src/
    api/                  # client + endpoint constants
    constants/            # api base url config
    modules/              # module-based api/hooks
    providers/            # App + Query provider
    stores/               # auth/session store
```

## 1) Cài dependencies

```bash
npm install
```

## 2) Cấu hình ENV

Tạo `.env` từ `.env.example`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.13:8081/api
```

Gợi ý URL:

- Android Emulator: `http://10.0.2.2:8081/api`
- Thiết bị thật: LAN IP của máy chạy server.

## 3) Chạy app

```bash
npm run start
```

Tùy nền tảng:

```bash
npm run android
npm run ios
npm run web
```

## 4) Smoke test kết nối server

Màn `Bản đồ` (route `/(tabs)/map`) đã gọi:

- `GET /api/app/home`

Nếu lỗi, kiểm tra:

- server đang chạy ở port `8081`
- env API URL đúng LAN IP/host
- thiết bị và máy server cùng mạng

## 5) API đã map sẵn trong scaffold

- Auth: `src/modules/auth/api/authApi.js`
- Home map: `src/modules/map/api/mapApi.js`
- Saved places: `src/modules/saved/api/savedApi.js`
- Feedback: `src/modules/feedback/api/feedbackApi.js`

## 6) Bước tiếp theo đề xuất

- Bổ sung màn đăng nhập + refresh token interceptor.
- Hoàn thiện UI theo design spec (onboarding, map overlay, place detail, booking CTA).
- Tách thêm module `place`, `services`, `profile`, `ai-planner` với hooks/query keys riêng.
