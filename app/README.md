# 📱 Didaugio Mobile App

A modern React Native mobile application built with [Expo](https://expo.dev/) for discovering and booking travel experiences and local attractions.

> **Version:** 1.0.0  
> **Framework:** React Native 0.81 + Expo SDK 54  
> **Styling:** NativeWind (TailwindCSS)  
> **State Management:** Zustand + TanStack Query  
> **Navigation:** Expo Router 6

---

## 🌟 Features

- **Explore Places** - Discover local attractions and travel destinations
- **Interactive Map** - View places on an interactive map with location-based search
- **AI Trip Planner** - Get AI-powered travel itinerary recommendations
- **Booking Management** - Reserve experiences and track your bookings
- **Saved Places** - Bookmark your favorite places for later
- **User Profile** - Manage your account and booking history
- **Authentication** - Secure login with Google Sign-In
- **Push Notifications** - Real-time updates on booking status and bookings

---

## 🏗️ Project Structure

```
app/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.jsx               # Root layout - wraps all screens
│   ├── index.jsx                 # Entry point - redirects based on auth state
│   ├── feedback.jsx              # User feedback screen
│   │
│   ├── (auth)/                   # Auth stack group (no tab bar)
│   │   ├── _layout.jsx           # Auth layout - no header/tabs
│   │   ├── login.jsx             # Login screen with Google OAuth
│   │   ├── register.jsx          # Registration screen
│   │   └── reset-password.jsx    # Password reset flow
│   │
│   ├── (tabs)/                   # Main app stack with tab navigation
│   │   ├── _layout.jsx           # Bottom tab navigator setup
│   │   ├── explore.jsx           # Home tab - browse places
│   │   ├── map.jsx               # Map tab - location-based view
│   │   ├── ai-planner.jsx        # AI planner tab - itinerary generator
│   │   ├── saved.jsx             # Saved places tab
│   │   └── profile.jsx           # User profile tab
│   │
│   ├── booking/
│   │   ├── [id].jsx              # Booking details screen
│   │   ├── create.jsx            # Create booking flow
│   │   └── payment.jsx           # Payment screen
│   │
│   ├── place/
│   │   ├── [id].jsx              # Place detail screen
│   │   ├── reviews.jsx           # Reviews listing
│   │   └── photos.jsx            # Photo gallery
│   │
│   ├── trip/
│   │   ├── [id].jsx              # Trip details
│   │   └── itinerary.jsx         # Itinerary view
│   │
│   └── profile/
│       ├── edit.jsx              # Edit profile
│       ├── settings.jsx          # User settings
│       └── bookings.jsx          # My bookings
│
├── src/
│   ├── api/                      # API client configuration
│   │   ├── index.js              # Axios instance with interceptors
│   │   ├── useAPI.js             # React Query hooks for API calls
│   │   ├── auth.js               # Auth endpoints
│   │   ├── places.js             # Places endpoints
│   │   ├── bookings.js           # Booking endpoints
│   │   └── ai.js                 # AI service endpoints
│   │
│   ├── components/               # Reusable  UI components
│   │   ├── layout/               # Layout components
│   │   │   ├── Header.jsx
│   │   │   ├── BottomSheet.jsx
│   │   │   └── Drawer.jsx
│   │   ├── cards/                # Card components
│   │   │   ├── PlaceCard.jsx
│   │   │   ├── BookingCard.jsx
│   │   │   └── ReviewCard.jsx
│   │   ├── forms/                # Form inputs
│   │   │   ├── LoginForm.jsx
│   │   │   ├── BookingForm.jsx
│   │   │   └── ReviewForm.jsx
│   │   └── common/               # Shared components
│   │       ├── Button.jsx
│   │       ├── Modal.jsx
│   │       ├── Loading.jsx
│   │       └── ErrorBoundary.jsx
│   │
│   ├── constants/                # App-wide constants
│   │   ├── colors.js             # Color palette
│   │   ├── spacing.js            # Spacing system
│   │   ├── endpoints.js          # API endpoints
│   │   └── errors.js             # Error messages (i18n ready)
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useFontLoader.js       # Load custom fonts (Afacad, Be Vietnam Pro)
│   │   ├── useI18n.js             # Internationalization (Vietnamese/English)
│   │   ├── useTheme.js            # Light/dark mode
│   │   ├── useOffline.js          # Offline mode detection
│   │   ├── useHaptics.js          # Haptic feedback
│   │   ├── useAuth.js             # Auth state + actions
│   │   └── useGeolocation.js      # Location tracking
│   │
│   ├── lib/                      # Third-party library wrappers
│   │   ├── mapbox.js             # Map configuration
│   │   ├── notifications.js      # Push notification setup
│   │   ├── storage.js            # AsyncStorage helpers
│   │   └── deeplinks.js          # Deep linking config
│   │
│   ├── modules/                  # Feature modules (vertical slices)
│   │   ├── map/
│   │   │   ├── components/       # Map-specific components
│   │   │   ├── hooks/            # useMapRouting, useMapGestures
│   │   │   │   └── __tests__/    # Map hook tests
│   │   │   ├── store.js          # Map state (Zustand)
│   │   │   └── api.js            # Map API calls
│   │   │
│   │   ├── booking/
│   │   │   ├── components/
│   │   │   ├── hooks/            # useBooking, useBookingForm
│   │   │   ├── store.js
│   │   │   └── api.js
│   │   │
│   │   ├── ai-planner/
│   │   │   ├── components/
│   │   │   ├── hooks/            # useAIPlanner, useItinerary
│   │   │   ├── store.js
│   │   │   └── api.js
│   │   │
│   │   └── profile/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── store.js
│   │       └── api.js
│   │
│   ├── providers/                # Context providers
│   │   ├── AuthProvider.jsx      # Auth context wrapper
│   │   ├── ThemeProvider.jsx     # Theme context
│   │   └── RootProvider.jsx      # Combines all providers
│   │
│   ├── stores/                   # Zustand state management
│   │   ├── authStore.js          # User auth state
│   │   ├── aiContextStore.js     # AI planner context
│   │   ├── aiPlannerStore.js     # AI planner state
│   │   ├── mapStore.js           # Map UI state
│   │   └── uiStore.js            # Global UI state (modals, sheets)
│   │
│   ├── utils/                    # Helper functions
│   │   ├── formatters.js         # Format dates, currency
│   │   ├── validators.js         # Input validation
│   │   ├── geolocation.js        # Location helpers
│   │   └── environment.js        # Env variable handling
│   │
│   └── __tests__/               # Integration tests
│       ├── routing.test.js
│       └── api.contract.test.js
│
├── assets/
│   ├── fonts/                    # Custom fonts
│   │   ├── Afacad-Regular.ttf
│   │   └── BeVietnamPro-Regular.ttf
│   ├── images/                   # App images
│   └── icons/                    # Custom icons
│
├── android/                      # Android native code
├── ios/                          # iOS native code (if using prebuild)
│
├── app.json                      # Expo manifest
├── app.config.js                 # Runtime configuration (env-based)
├── babel.config.js               # Babel + NativeWind setup
├── metro.config.js               # Metro bundler config
├── tailwind.config.js            # Tailwind design tokens
├── jsconfig.json                 # Path aliases (@/components, @/hooks)
├── .env.example                  # Environment template
└── package.json                  # Dependencies
```

### Directory Concepts

**Vertical Slice (Feature Modules):** Each major feature (`booking/`, `map/`, `ai-planner/`) contains:

- `components/` - UI components specific to that feature
- `hooks/` - Custom hooks (e.g., `useBooking()`, `useMapRouting()`)
- `store.js` - Zustand store (state isolated per feature)
- `api.js` - API service calls
- `__tests__/` - Unit & integration tests for that feature

**State Hierarchy:**

- **Global:** `authStore` (user session), `uiStore` (modals, navigation)
- **Feature:** `mapStore`, `aiPlannerStore`, `bookingStore`
- **Local:** Component state for UI toggles

---

## � State Management Architecture

### Zustand Stores

**Pattern:** Each store manages a specific feature domain.

**Example - Auth Store** (`src/stores/authStore.js`):

```javascript
import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),

  // Thunks (async actions)
  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    set({ user: data.user, token: data.token, isAuthenticated: true });
  },
}));

export default useAuthStore;
```

**Usage in Components:**

```jsx
import useAuthStore from "@/stores/authStore";

export function ProfileScreen() {
  const { user, logout } = useAuthStore();

  return (
    <View>
      <Text>{user.name}</Text>
      <Button onPress={logout} title="Logout" />
    </View>
  );
}
```

### Zustand + React Query Integration

**Pattern:** Use React Query for server state, Zustand for UI state.

```javascript
// API hook (React Query)
export const useGetPlaces = (filters) => {
  return useQuery({
    queryKey: ["places", filters],
    queryFn: () => api.get("/places", { params: filters }),
  });
};

// UI state (Zustand)
const useMapStore = create((set) => ({
  selectedPlace: null,
  setSelectedPlace: (place) => set({ selectedPlace: place }),
}));

// Feature hook combining both
export const useMapPlaces = () => {
  const { data: places, isLoading } = useGetPlaces();
  const { selectedPlace, setSelectedPlace } = useMapStore();

  return { places, selectedPlace, setSelectedPlace, isLoading };
};
```

### Global Stores

- `authStore` - User session, auth tokens
- `uiStore` - Modal visibility, toast messages, loading states
- `mapStore` - Map center, zoom, markers
- `aiContextStore` - AI conversation context
- `aiPlannerStore` - Trip itinerary state

---

## 🎣 Custom Hooks Patterns

### Feature-Specific Hooks

**useAuth** - Auth state & actions:

```javascript
const { user, isAuthenticated, login, logout } = useAuth();
```

**useGeolocation** - Current location:

```javascript
const { latitude, longitude, error, loading } = useGeolocation({
  enableHighAccuracy: true,
});
```

**useI18n** - Multi-language:

```javascript
const { t, language, setLanguage } = useI18n();
// Usage: t('home.welcome') // "Chào mừng"
```

**useTheme** - Light/dark mode:

```javascript
const { isDark, toggleTheme, colors } = useTheme();
```

**useOffline** - Offline detection:

```javascript
const { isOnline, wasOnline } = useOffline();
// Sync data when comes back online
```

### API Hooks with React Query

```javascript
// src/hooks/usePlaces.js
export function usePlaces(filters = {}) {
  return useQuery({
    queryKey: ["places", filters],
    queryFn: async () => {
      const response = await api.get("/places", { params: filters });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// src/hooks/useCreateBooking.js
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingData) => api.post("/bookings", bookingData),
    onSuccess: () => {
      queryClient.invalidateQueries(["bookings"]);
    },
    onError: (error) => {
      showToast(error.response?.data?.message || "Booking failed");
    },
  });
}
```

---

## 🔌 API Integration & Data Flow

### Request Flow

```
Component
  ↓ useQuery/useMutation
  ↓ Custom Hook (useGetPlaces, useCreateBooking)
  ↓ React Query
  ↓ API Service (src/api/)
  ↓ Axios (with interceptors)
  ↓ Backend API
```

### API Service Setup

```javascript
// src/api/index.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

// Request interceptor - add auth token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors, refresh tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - attempt refresh
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      // ...refresh logic
    }
    return Promise.reject(error);
  },
);

export default api;
```

### API Modules

**Places API:**

```javascript
// src/api/places.js
export const placesAPI = {
  list: (filters) => api.get("/places", { params: filters }),
  getById: (id) => api.get(`/places/${id}`),
  search: (query) => api.get("/places/search", { params: { q: query } }),
  getNearby: (lat, lng, radius) =>
    api.get("/places/nearby", {
      params: { latitude: lat, longitude: lng, radius },
    }),
};
```

**Bookings API:**

```javascript
// src/api/bookings.js
export const bookingsAPI = {
  list: () => api.get("/bookings"),
  create: (data) => api.post("/bookings", data),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.delete(`/bookings/${id}`),
  updatePaymentStatus: (id, status) =>
    api.patch(`/bookings/${id}/payment`, { status }),
};
```

---

## 🧭 Navigation Architecture

### File-Based Routing (Expo Router)

**Route Groups** organize navigation stacks:

**Auth Stack** - No tab bar, redirectable:

```
(auth)/
├── login.jsx
├── register.jsx
└── reset-password.jsx
```

**Main Stack** - With bottom tab bar:

```
(tabs)/
├── explore.jsx
├── map.jsx
├── ai-planner.jsx
├── saved.jsx
└── profile.jsx
```

**Nested Routes:**

```
place/
└── [id].jsx          // Screen for /place/123

booking/
├── [id].jsx          // Screen for /booking/456
└── create.jsx        // Screen for /booking/create
```

### Navigation Flow

```
App Launch
  ↓ index.jsx (checks auth)
  ↓ If unauthenticated → (auth)/login.jsx
  ↓ If authenticated → (tabs)/ (main app)
  ↓ User can navigate between tabs or nested screens
  ↓ Logout → redirect back to (auth)/login.jsx
```

### Deep Linking Example

```javascript
// Enable opening app from links: didaugio://place/123
const linking = {
  prefixes: ["didaugio://", "https://didaugio.com"],
  config: {
    screens: {
      "place/[id]": "place/:id",
      "booking/[id]": "booking/:id",
      "trip/[id]": "trip/:id",
    },
  },
};
```

---

## 🔐 Authentication Flow

### Login Flow

```
User enters email/password
  ↓ Taps "Sign In"
  ↓ useCreateBooking() mutation called (or useLogin)
  ↓ API posts to /auth/login
  ↓ Backend validates, returns JWT tokens
  ↓ useAuthStore.setToken() saves token
  ↓ Axios interceptor adds token to future requests
  ↓ Navigation redirects to (tabs)/ (authenticated)
  ↓ AsyncStorage persists tokens
```

### Token Refresh

```
API returns 401 (Unauthorized)
  ↓ Response interceptor caught error
  ↓ Retrieve refreshToken from AsyncStorage
  ↓ POST /auth/refresh with refreshToken
  ↓ Backend returns new accessToken
  ↓ Retry original request with new token
  ↓ If refresh fails → logout user, redirect to login
```

### Logout

```
User taps "Logout"
  ↓ useAuthStore.logout() clears state
  ↓ AsyncStorage.removeItem('authToken')
  ↓ Navigation redirects to (auth)/login.jsx
  ↓ All API calls require re-authentication
```

---

## 📱 Component Patterns

### Screen Component Template

```jsx
// src/app/(tabs)/explore.jsx
import { View, Text, FlatList } from "react-native";
import { usePlaces } from "@/hooks/index";
import PlaceCard from "@/components/cards/PlaceCard";

export default function ExploreScreen() {
  const { data: places, isLoading, error } = usePlaces();

  if (isLoading)
    return (
      <View className="flex-1 justify-center">
        <Text>Loading...</Text>
      </View>
    );
  if (error)
    return (
      <View>
        <Text>Error: {error.message}</Text>
      </View>
    );

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={places}
        renderItem={({ item }) => <PlaceCard place={item} />}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}
```

### Reusable Component Template

```jsx
// src/components/cards/PlaceCard.jsx
import { View, Image, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "expo-router";

export default function PlaceCard({ place }) {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate("place", { id: place.id });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="m-4 rounded-lg overflow-hidden bg-white shadow-sm"
    >
      <Image source={{ uri: place.image }} className="h-48 w-full" />
      <View className="p-3">
        <Text className="text-lg font-bold">{place.name}</Text>
        <Text className="text-gray-600">{place.location}</Text>
        <Text className="text-orange-500 font-bold mt-2">
          {place.rating} ⭐
        </Text>
      </View>
    </TouchableOpacity>
  );
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)

```javascript
// src/utils/__tests__/formatters.test.js
import { formatCurrency, formatDate } from "../formatters";

describe("formatters", () => {
  it("formats currency correctly", () => {
    expect(formatCurrency(1000000)).toBe("1,000,000₫");
  });

  it("formats dates in Vietnamese", () => {
    const date = new Date("2026-04-15");
    expect(formatDate(date)).toBe("15/04/2026");
  });
});
```

### API Contract Tests

```javascript
// src/api/__tests__/routingApi.contract.test.js
describe("Routing API Contract", () => {
  it("returns expected schema for getRoutes", async () => {
    const response = await api.get("/routes/calculate", {
      params: { origin: [0, 0], destination: [1, 1] },
    });

    expect(response.data).toHaveProperty("distance");
    expect(response.data).toHaveProperty("duration");
    expect(response.data.paths).toBeInstanceOf(Array);
  });
});
```

---

### Prerequisites

- **Node.js:** v18+ ([Download](https://nodejs.org/))
- **npm:** v9+ or **yarn**
- **Expo CLI:** Installed globally

### Installation

1. **Navigate to the app directory:**

   ```bash
   cd app
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the `app` directory:

   ```
   EXPO_PUBLIC_API_URL=http://your-server-url:5000
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-client-id
   ```

4. **Start the development server:**
   ```bash
   npm run start
   ```

---

## 📱 Running the App

### iOS

```bash
npm run ios
```

### Android

```bash
npm run android
```

### Web

```bash
npm run web
```

### Expo Go (Instant Preview)

```bash
npm run dev
```

Open Expo Go app on your phone and scan the QR code shown in terminal.

---

## 🧪 Testing

Run the test suite:

```bash
npm run test
```

Run specific tests:

```bash
npm run test:routing-contract
```

---

## 🏗️ Build & Deploy

### Build for production:

**iOS:**

```bash
eas build --platform ios
```

**Android:**

```bash
eas build --platform android
```

**Web:**

```bash
npm run build
```

For detailed build instructions, use EAS CLI:

```bash
eas build --help
```

---

## 📦 Key Dependencies

| Package                                     | Purpose                       |
| ------------------------------------------- | ----------------------------- |
| `expo`                                      | React Native framework        |
| `expo-router`                               | File-based routing            |
| `react-query`                               | Server state management       |
| `zustand`                                   | Client state store            |
| `nativewind`                                | Tailwind CSS for React Native |
| `axios`                                     | HTTP client                   |
| `expo-location`                             | Geolocation API               |
| `expo-notifications`                        | Push notifications            |
| `@react-native-google-signin/google-signin` | Google authentication         |

---

## 🔌 API Integration

The app connects to the backend API at the URL specified in `.env` (default: `http://localhost:5000`).

**Key API modules:**

- `src/api/` - All API client configurations
- `src/modules/` - Feature-specific API calls with hooks

---

## 🎨 Styling

The mobile app uses **NativeWind** for styling, which brings Tailwind CSS to React Native:

```jsx
import { View, Text } from "react-native";

export function Card() {
  return (
    <View className="p-4 bg-white rounded-lg shadow">
      <Text className="text-lg font-bold">Hello</Text>
    </View>
  );
}
```

For custom styling, update `tailwind.config.js`.

---

## 📚 Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Router Guide](https://expo.github.io/router/introduction)
- [NativeWind Documentation](https://www.nativewind.dev/)

---

## 🔐 Authentication

The app uses Google Sign-In for authentication. Users must have a valid Google account to log in.

- Auth state is managed via Zustand store
- JWT tokens are stored in Expo Secure Store
- Token refresh is handled automatically

---

## 🐛 Troubleshooting

### Metro Port Conflict

If port 8083 is already in use:

```bash
npm start -- --port 8084
```

### Cache Issues

Clear Metro cache:

```bash
npm start -- --clear
```

### Android Build Issues

Check local.properties:

```bash
echo sdk.dir=$ANDROID_SDK_ROOT > android/local.properties
```

---

## � Best Practices & Development Guidelines

### Code Organization

1. **Vertical Slicing** - Each feature module contains components, hooks, stores, and tests together
2. **Absolute Imports** - Always use `@/` prefix for imports:

   ```jsx
   // ❌ Avoid relative paths
   import { useAuth } from "../../../hooks/useAuth";

   // ✅ Use absolute paths
   import { useAuth } from "@/hooks/useAuth";
   ```

3. **Naming Conventions**:
   - Components: PascalCase (`PlaceCard.jsx`)
   - Hooks: camelCase with "use" prefix (`usePlaces.js`)
   - Stores: Zustand store files (`authStore.js`)
   - Constants: UPPER_SNAKE_CASE (`API_ENDPOINTS`)
   - Types: PascalCase (`type User = {...}`)

### State Management Rules

**Use Zustand for:**

- Authentication state (user, tokens, permissions)
- Global UI state (modals, bottom sheets, theme)
- Feature-specific state (map center, selected place)

**Use React Query for:**

- Server state (places, bookings, reviews)
- Caching and synchronization
- Pagination and filtering
- Real-time updates

**Use Component State for:**

- Form inputs and validation
- Animation/transition states
- Local UI toggles

### Performance Optimization

1. **Memoization** - Wrap expensive components with React.memo:

   ```jsx
   const PlaceCard = React.memo(
     ({ place, onPress }) => {
       return <Pressable onPress={onPress}>...</Pressable>;
     },
     (prevProps, nextProps) => {
       return prevProps.place.id === nextProps.place.id;
     },
   );
   ```

2. **Query Cache** - Set appropriate staleTime:

   ```jsx
   staleTime: 5 * 60 * 1000,  // 5 minutes
   gcTime: 10 * 60 * 1000,    // 10 minutes
   ```

3. **List Rendering** - Optimize FlatList:

   ```jsx
   <FlatList
     data={places}
     renderItem={({ item }) => <PlaceCard place={item} />}
     keyExtractor={(item) => item.id}
     maxToRenderPerBatch={10}
     updateCellsBatchingPeriod={50}
     removeClippedSubviews={true}
   />
   ```

4. **Image Optimization** - Use proper image sizing
5. **Bundle Size** - Monitor with `npx expo-analyze`

### Testing Strategy

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- places.test.js

# Watch mode (development)
npm run test -- --watch
```

Test files should be co-located with source:

```
src/
├── hooks/
│   ├── usePlaces.js
│   └── __tests__/
│       └── usePlaces.test.js
├── api/
│   ├── places.js
│   └── __tests__/
│       └── places.contract.test.js
```

### Debugging Tips

1. **Breakpoints** - Add `debugger;` statement to pause execution
2. **Console Logging** - Use structured logging:

   ```javascript
   console.debug("[PlaceCard]", { placeId: place.id, rating: place.rating });
   console.error("[API Error]", { endpoint, status, message: error.message });
   ```

3. **React DevTools** - Inspect component tree and props
4. **Redux DevTools** - Monitor Zustand store changes
5. **Network Inspector** - Inspect API requests in debugger

---

## �📄 License

ISC License

---

## 👥 Contributors

- **Author:** Didaugio Team

---

## 📞 Support

For issues and feature requests, please create an issue in the main repository.
