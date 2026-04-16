# 🌐 Didaugio Web Dashboard

A modern, responsive web application built with React and Vite for managing travel experiences, business operations, and user accounts. Designed for tourism businesses and administrators.

> **Version:** 0.0.0  
> **Framework:** React 19.2 + Vite  
> **Styling:** Tailwind CSS + Radix UI  
> **Build Tool:** Vite  
> **Testing:** Vitest

---

## 🌟 Features

- **Business Dashboard** - Manage tourism businesses and offerings
- **Booking Management** - Track and process customer bookings
- **Analytics & Reports** - Business statistics and performance metrics
- **Place Management** - Create and manage travel destinations
- **Map Integration** - Interactive maps with MapLibre GL
- **User Management** - Admin controls for users and businesses
- **Real-time Data** - Live updates on bookings and analytics
- **Responsive Design** - Mobile-friendly, works on all devices
- **Dark Mode** - Built-in light/dark theme support
- **Authentication** - Google OAuth and JWT-based auth

---

## 💻 Architecture Deep Dive

### Component Architecture

**Smart (Container) Components** vs **Dumb (Presentational) Components**

```jsx
// Dumb Component - Pure UI, no logic
// src/components/ui/Button.jsx
export function Button({
  variant = "primary",
  size = "md",
  disabled = false,
  children,
  onClick,
}) {
  const baseStyles = "font-medium rounded transition";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

```jsx
// Smart Component - Handles logic and state
// src/pages/BookingsPage.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import BookingList from "@/components/BookingList";
import BookingFilters from "@/components/BookingFilters";
import { bookingsAPI } from "@/apis/bookings";

export default function BookingsPage() {
  const [filters, setFilters] = useState({
    status: "all",
    sortBy: "date",
    limit: 20,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["bookings", filters],
    queryFn: () => bookingsAPI.list(filters),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      <BookingFilters filters={filters} onChange={setFilters} />
      <BookingList bookings={data} />
    </div>
  );
}
```

### File Structure for Pages

```
src/pages/
├── admin/
│   ├── UserManagePage.jsx
│   ├── RoleManagePage.jsx
│   └── PermissionManagePage.jsx
├── business/
│   ├── DashboardPage.jsx       # Main business dashboard
│   ├── OfferingsPage.jsx       # Manage offerings (services)
│   ├── BookingsPage.jsx        # View bookings
│   ├── StatsPage.jsx           # Analytics
│   └── SettingsPage.jsx        # Business settings
├── auth/
│   ├── LoginPage.jsx
│   └── RegisterPage.jsx
├── booking/
│   ├── BookingsPage.jsx        # List bookings
│   ├── BookingDetailPage.jsx   # Booking details
│   └── CheckoutPage.jsx        # Booking checkout
├── ProfilePage.jsx
├── DashboardPage.jsx
└── NotFoundPage.jsx
```

---

## 🎣 Custom Hooks Ecosystem

### Data Fetching Hooks (React Query)

```javascript
// src/hooks/useBookings.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsAPI } from "@/apis/bookings";

export function useBookings(filters = {}) {
  return useQuery({
    queryKey: ["bookings", filters],
    queryFn: () => bookingsAPI.list(filters),
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true, // Smooth pagination
  });
}

export function useBookingDetail(id) {
  return useQuery({
    queryKey: ["bookings", id],
    queryFn: () => bookingsAPI.getById(id),
    enabled: !!id, // Don't fetch if no id
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => bookingsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["bookings"]);
    },
    onError: (error) => {
      console.error("Booking creation failed:", error);
    },
  });
}

export function useUpdateBooking(id) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => bookingsAPI.update(id, data),
    onSuccess: (updatedBooking) => {
      queryClient.setQueryData(["bookings", id], updatedBooking);
      queryClient.invalidateQueries(["bookings"]);
    },
  });
}

export function useCancelBooking(id) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => bookingsAPI.delete(id),
    onSuccess: () => {
      queryClient.removeQueries(["bookings", id]);
      queryClient.invalidateQueries(["bookings"]);
    },
  });
}
```

### State Management Hooks

```javascript
// src/hooks/useAuth.js
import { useContext } from "react";
import { AuthContext } from "@/providers/AuthProvider";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// Usage:
// const { user, isAuthenticated, login, logout } = useAuth();
```

### Form Hooks

```javascript
// src/hooks/useForm.js
import { useState, useCallback } from "react";

export function useForm(initialValues, onSubmit) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        setErrors({ submit: error.message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, onSubmit],
  );

  return { values, errors, isSubmitting, handleChange, handleSubmit };
}

// More detailed form handling with React Hook Form:
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const bookingSchema = z.object({
  date: z.date().min(new Date()),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

export function useBookingForm(onSubmit) {
  const form = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      date: new Date(),
      quantity: 1,
      notes: "",
    },
  });

  return form;
}
```

### UI State Hooks

```javascript
// src/hooks/useSidebar.js
import { useState } from "react";

export function useSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);
  const open = () => setIsOpen(true);

  return { isOpen, toggle, close, open };
}
```

---

## 🔌 API Integration Pattern

### Structured API Services

```javascript
// src/apis/bookings.js
import api from "@/lib/apiClient";

export const bookingsAPI = {
  // List all bookings with filters
  list: async (filters = {}) => {
    const { data } = await api.get("/bookings", {
      params: {
        status: filters.status || null,
        limit: filters.limit || 20,
        offset: filters.offset || 0,
      },
    });
    return data;
  },

  // Get single booking
  getById: async (id) => {
    const { data } = await api.get(`/bookings/${id}`);
    return data;
  },

  // Create booking
  create: async (bookingData) => {
    const { data } = await api.post("/bookings", bookingData);
    return data;
  },

  // Update booking
  update: async (id, updates) => {
    const { data } = await api.patch(`/bookings/${id}`, updates);
    return data;
  },

  // Cancel booking
  delete: async (id) => {
    const { data } = await api.delete(`/bookings/${id}`);
    return data;
  },

  // Get booking statistics
  getStats: async () => {
    const { data } = await api.get("/bookings/stats");
    return data;
  },
};

// src/apis/places.js
export const placesAPI = {
  list: async (filters = {}) => {
    const { data } = await api.get("/places", { params: filters });
    return data;
  },

  search: async (query) => {
    const { data } = await api.get("/places/search", {
      params: { q: query },
    });
    return data;
  },

  getNearby: async (latitude, longitude, radius = 5) => {
    const { data } = await api.get("/places/nearby", {
      params: { latitude, longitude, radius },
    });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/places/${id}`);
    return data;
  },
};
```

### API Client Setup

```javascript
// src/lib/apiClient.js
import axios from "axios";
import { getAuthToken, setAuthToken, clearAuthToken } from "@/lib/storage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 10000,
});

// Request Interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor - Handle errors, refresh tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refreshToken },
        );

        await setAuthToken(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        clearAuthToken();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Toast error message
    const message = error.response?.data?.message || error.message;
    console.error("API Error:", message);

    return Promise.reject(error);
  },
);

export default api;
```

---

## 🧑‍💻 Form Handling

### React Hook Form + Zod Integration

```jsx
// src/components/forms/BookingForm.jsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateBooking } from "@/hooks/useBookings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const bookingSchema = z.object({
  date: z.string().min(1, "Date is required"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  notes: z.string().optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to terms",
  }),
});

export default function BookingForm({ placeId, onSuccess }) {
  const { mutate: createBooking, isPending } = useCreateBooking();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(bookingSchema),
  });

  const onSubmit = async (data) => {
    createBooking(
      { ...data, placeId },
      {
        onSuccess: () => {
          reset();
          onSuccess?.();
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>Date</label>
        <Input type="date" {...register("date")} />
        {errors.date && (
          <span className="text-red-600">{errors.date.message}</span>
        )}
      </div>

      <div>
        <label>Number of People</label>
        <Input type="number" min="1" {...register("quantity")} />
        {errors.quantity && (
          <span className="text-red-600">{errors.quantity.message}</span>
        )}
      </div>

      <div>
        <label>Notes</label>
        <textarea
          {...register("notes")}
          className="w-full border rounded p-2"
        />
      </div>

      <label className="flex items-center">
        <input type="checkbox" {...register("agreeToTerms")} />
        <span className="ml-2">I agree to terms</span>
      </label>
      {errors.agreeToTerms && (
        <span className="text-red-600">{errors.agreeToTerms.message}</span>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Booking..." : "Confirm Booking"}
      </Button>
    </form>
  );
}
```

---

## 📊 Dashboard Components

### Dashboard Page Structure

```jsx
// src/pages/business/DashboardPage.jsx
import { useQuery } from "@tanstack/react-query";
import StatCard from "@/components/dashboard/StatCard";
import BookingChart from "@/components/dashboard/BookingChart";
import RevenueChart from "@/components/dashboard/RevenueChart";
import RecentBookingsTable from "@/components/dashboard/RecentBookingsTable";
import { dashboardAPI } from "@/apis/dashboard";

export default function BusinessDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["business-stats"],
    queryFn: () => dashboardAPI.getStats(),
    refetchInterval: 30000, // Refresh every 30s
  });

  if (isLoading) return <div>Loading dashboard...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Bookings"
          value={stats.totalBookings}
          trend="+12%"
        />
        <StatCard
          label="Revenue"
          value={`₫${stats.totalRevenue.toLocaleString()}`}
          trend="+8%"
        />
        <StatCard
          label="Average Rating"
          value={stats.averageRating}
          trend="+0.2"
        />
        <StatCard
          label="This Month"
          value={stats.thisMonthBookings}
          trend="-5%"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BookingChart bookings={stats.bookingTrend} />
        <RevenueChart revenue={stats.revenueTrend} />
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Recent Bookings</h2>
        <RecentBookingsTable bookings={stats.recentBookings} />
      </div>
    </div>
  );
}
```

---

## 🧪 Testing Strategy

### Component Testing (Vitest + React Testing Library)

```javascript
// src/components/__tests__/BookingForm.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BookingForm from "../BookingForm";
import { vi } from "vitest";

describe("BookingForm", () => {
  it("renders form fields", () => {
    render(<BookingForm placeId="place_123" onSuccess={() => {}} />);

    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/number of people/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirm booking/i }),
    ).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    render(<BookingForm placeId="place_123" onSuccess={() => {}} />);

    const submitButton = screen.getByRole("button", {
      name: /confirm booking/i,
    });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/date is required/i)).toBeInTheDocument();
    });
  });

  it("submits form with valid data", async () => {
    const onSuccess = vi.fn();
    render(<BookingForm placeId="place_123" onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText(/date/i), "2026-05-01");
    await userEvent.type(screen.getByLabelText(/number of people/i), "2");
    await userEvent.click(screen.getByRole("checkbox"));

    const submitButton = screen.getByRole("button", {
      name: /confirm booking/i,
    });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
```

### API Hook Testing

```javascript
// src/hooks/__tests__/useBookings.test.js
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBookings } from "../useBookings";
import { vi } from "vitest";
import * as bookingsAPI from "@/apis/bookings";

vi.mock("@/apis/bookings");

describe("useBookings", () => {
  it("fetches bookings", async () => {
    const mockBookings = [
      { id: "1", name: "Booking 1" },
      { id: "2", name: "Booking 2" },
    ];

    bookingsAPI.bookingsAPI.list.mockResolvedValue(mockBookings);

    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useBookings(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockBookings);
  });
});
```

---

## 🔐 Authentication Flow

### Auth Context & Provider

```jsx
// src/providers/AuthProvider.jsx
import { createContext, useState, useEffect } from "react";
import { getAuthToken, setAuthToken, clearAuthToken } from "@/lib/storage";
import api from "@/lib/apiClient";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in (token exists)
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await getAuthToken();
        if (token) {
          // Verify token validity
          const { data } = await api.get("/auth/me");
          setUser(data);
        }
      } catch (error) {
        clearAuthToken();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    await setAuthToken(data.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearAuthToken();
      setUser(null);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

### Protected Routes

```jsx
// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute({ children, requiredRole = null }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}
```

---

├── src/
│ ├── main.jsx # Application entry point
│ ├── App.jsx # Root component
│ ├── index.css # Global styles
│ │
│ ├── components/ # Reusable components
│ │ ├── ui/ # Radix UI components (shadcn/ui)
│ │ ├── layout/ # Layout components
│ │ │ ├── Sidebar.jsx
│ │ │ ├── Header.jsx
│ │ │ └── ...
│ │ ├── forms/ # Form components
│ │ ├── charts/ # Chart components
│ │ └── ...
│ │
│ ├── pages/ # Page components
│ │ ├── Dashboard.jsx
│ │ ├── Bookings.jsx
│ │ ├── Places.jsx
│ │ ├── Business.jsx
│ │ ├── Analytics.jsx
│ │ ├── Profile.jsx
│ │ └── ...
│ │
│ ├── contexts/ # React contexts
│ │ ├── AuthContext.jsx
│ │ ├── ThemeContext.jsx
│ │ └── ...
│ │
│ ├── hooks/ # Custom React hooks
│ ├── services/ # API services
│ ├── lib/ # Utility functions
│ ├── constants/ # App constants
│ ├── stores/ # State management
│ └── utils/ # Helper functions
│
├── public/ # Static assets
├── tests/ # Test files
├── vite.config.js # Vite configuration
├── vitest.config.js # Vitest configuration
├── tailwind.config.js # Tailwind CSS config
├── jsconfig.json # JS path aliases
├── components.json # shadcn/ui config
├── eslint.config.js # ESLint configuration
└── package.json # Dependencies

````

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** v18+ ([Download](https://nodejs.org/))
- **npm:** v9+ or **yarn**

### Installation

1. **Navigate to web directory:**
   ```bash
   cd web
````

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file:

   ```env
   VITE_API_URL=http://localhost:5000
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   ```

4. **Start development server:**

   ```bash
   npm run dev
   ```

   Opens at `http://localhost:5173`

---

## 🔧 Available Scripts

| Command               | Description                         |
| --------------------- | ----------------------------------- |
| `npm run dev`         | Start Vite dev server (HMR enabled) |
| `npm run build`       | Build for production                |
| `npm run preview`     | Preview production build locally    |
| `npm run lint`        | Run ESLint on source files          |
| `npm run test`        | Run test suite once                 |
| `npm run test:watch`  | Run tests in watch mode             |
| `npm run shadcn:add`  | Add new shadcn/ui component         |
| `npm run shadcn:init` | Initialize shadcn/ui project        |

---

## 📦 Installation & Setup

### Add UI Components

Using shadcn/ui preset components:

```bash
npm run shadcn:add button
npm run shadcn:add card
npm run shadcn:add modal
```

Available components via Radix UI and shadcn/ui.

---

## 🎨 Styling

### Tailwind CSS

Main styling approach using utility-first CSS:

```jsx
function Button() {
  return (
    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
      Click me
    </button>
  );
}
```

### Radix UI Components

Pre-built accessible components:

```jsx
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function Modal() {
  return (
    <Dialog>
      <DialogContent>
        <Button>Close</Button>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📊 Charts & Analytics

Uses **Chart.js** for data visualization:

```jsx
import { Line, Bar, Pie } from "react-chartjs-2";

export function EnhancedChart() {
  return <Bar data={chartData} options={chartOptions} />;
}
```

---

## 🗺️ Map Integration

**MapLibre GL** for interactive maps:

```jsx
import MapLibreGL from "maplibre-gl";

export function MapView() {
  // Map implementation
}
```

**Turf.js** for geospatial calculations.

---

## 🔐 Authentication

### Google OAuth

1. Sign in via Google button
2. Get OAuth token
3. Exchange for API JWT token
4. Store tokens in localStorage/session

Managed in `AuthContext` with middleware interception.

### JWT Tokens

- Stored securely in localStorage
- Included in all API requests
- Auto-refreshed on expiry

---

## 🔌 API Integration

**Base URL:** `http://localhost:5000/api`

Services in `src/services/`:

```javascript
// Example API service
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor adds auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const bookingApi = {
  list: () => api.get("/bookings"),
  create: (data) => api.post("/bookings", data),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  delete: (id) => api.delete(`/bookings/${id}`),
};
```

---

## 🎯 Key Pages

### Dashboard

Main overview with key metrics and widgets

### Bookings

- List all bookings with filters
- Booking details and status
- Refund management

### Places

- CRUD for travel destinations
- Photo management
- Pricing and availability

### Business

- Business profile management
- Statistics and analytics
- Admin controls

### Analytics

- Revenue charts
- Booking trends
- Customer insights

### Profile

- User account settings
- Preferences
- Security settings

---

## 🧪 Testing

### Run Tests

```bash
npm run test
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage

```bash
npm run test -- --coverage
```

Test files use **Vitest** and **React Testing Library**.

---

## 🏗️ Build & Deploy

### Production Build

```bash
npm run build
```

Creates optimized bundle in `dist/` directory.

### Preview

```bash
npm run preview
```

Local preview of production build.

### Docker

```bash
docker build -t didaugio-web .
docker run -p 80:80 didaugio-web
```

---

## 📦 Key Dependencies

| Package               | Purpose                  |
| --------------------- | ------------------------ |
| `react`               | UI library               |
| `react-dom`           | React DOM rendering      |
| `react-router-dom`    | Client routing           |
| `axios`               | HTTP client              |
| `tailwindcss`         | Utility CSS framework    |
| `radix-ui/*`          | Accessible UI primitives |
| `chart.js`            | Data visualization       |
| `maplibre-gl`         | Interactive maps         |
| `framer-motion`       | Animations               |
| `lucide-react`        | Icon library             |
| `@hookform/resolvers` | Form validation          |
| `zod`                 | Schema validation        |
| `clsx`                | Utility for classNames   |
| `vite`                | Build tool               |
| `vitest`              | Test runner              |

---

## 🎨 UI Component Library

**shadcn/ui** components included:

- Accordions
- Avatars
- Buttons
- Cards
- Checkboxes
- Dialogs
- Dropdowns
- Forms
- Progress
- Selects
- Tabs
- Tooltips
- And more...

Browse available components:

```bash
npm run shadcn:add --help
```

---

## 🔒 Security

- **CORS** properly configured
- **XSS Protection** via React escaping
- **CSRF Protection** via JWT tokens
- **Input Validation** with Zod
- **Rate Limiting** from backend
- **Secure Storage** of sensitive data
- **HTTPS** in production

---

## 📚 Documentation

- [React Docs](https://react.dev/)
- [Vite Documentation](https://vite.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [Radix UI Docs](https://www.radix-ui.com/)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Chart.js Docs](https://www.chartjs.org/)
- [MapLibre GL Docs](https://maplibre.org/)
- [Framer Motion](https://www.framer.com/motion/)

---

## 🐛 Troubleshooting

### Port 5173 Already in Use

```bash
npm run dev -- --port 3000
```

### API Connection Fails

- Verify `VITE_API_URL` in `.env.local`
- Check backend server is running
- Check CORS configuration

### Module Not Found

```bash
npm install
npm run build
```

### HMR Issues (Hot Module Reload)

```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

---

## � Development Best Practices & Guidelines

### Code Organization & Naming

1. **File Naming**:

   ```
   src/
   ├── pages/
   │   └── BookingsPage.jsx          # Page components (PascalCase)
   ├── components/
   │   ├── BookingList.jsx           # Functional components
   │   ├── layout/
   │   │   └── Sidebar.jsx
   │   └── ui/
   │       └── button.jsx            # shadcn/ui components (lowercase)
   ├── hooks/
   │   ├── useBookings.js            # Custom hooks (use* prefix)
   │   └── useForm.js
   ├── apis/
   │   └── bookings.js               # API services
   ├── stores/
   │   └── uiStore.js                # State stores
   ├── lib/
   │   └── apiClient.js              # Utilities & helpers
   └── types/
       └── index.d.ts                # TypeScript definitions
   ```

2. **Import Order** - Follow consistent import order:

   ```jsx
   // 1. External dependencies
   import React, { useState } from 'react';
   import { useQuery } from '@tanstack/react-query';

   // 2. Internal absolute imports
   import { useAuth } from '@/hooks/useAuth';
   import { Button } from '@/components/ui/button';

   // 3. Types
   import type { Booking } from '@/types';

   // 4. Styles (if any)
   import './BookingList.css';
   ```

### Component Patterns

**1. Presentational (Dumb) Components:**

```jsx
// No hooks, no business logic, pure UI
export function BookingCard({ booking, onCancel }) {
  return (
    <Card>
      <h3>{booking.place.name}</h3>
      <p>Date: {booking.date}</p>
      <Button onClick={onCancel}>Cancel</Button>
    </Card>
  );
}
```

**2. Container (Smart) Components:**

```jsx
// Contains logic, data fetching, state management
export default function BookingsList() {
  const { data: bookings, isLoading } = useBookings();
  const { mutate: cancelBooking } = useCancelBooking();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onCancel={() => cancelBooking(booking.id)}
        />
      ))}
    </div>
  );
}
```

**3. Custom Hook Pattern:**

```jsx
// Extract complex logic into custom hooks
export function useBookingForm(onSuccess) {
  const form = useForm({ resolver: zodResolver(schema) });
  const { mutate } = useCreateBooking();

  const onSubmit = (data) => {
    mutate(data, { onSuccess });
  };

  return { form, onSubmit };
}

// Usage in component
export function BookingForm({ onSuccess }) {
  const { form, onSubmit } = useBookingForm(onSuccess);
  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

### Error Handling

```jsx
// Global Error Boundary
import { useRouteError } from "react-router-dom";

export function ErrorFallback() {
  const error = useRouteError();

  return (
    <div className="p-6">
      <h1>Something went wrong</h1>
      <p>{error?.message}</p>
      <a href="/">Go Home</a>
    </div>
  );
}

// API Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message;
    toast.error(message);
    return Promise.reject(error);
  },
);
```

### State Management Best Practices

**Use React Query for:**

- Server state (API data)
- Caching & synchronization
- Pagination, filtering

**Use Context for:**

- User auth
- Theme preferences
- Language selection

**Use Local State for:**

- Form inputs
- UI toggles (modal open/close)
- Animation states

```jsx
// ❌ Wrong - using Context for server data
const PlacesContext = createContext();

// ✅ Correct - use React Query
export function usePlaces() {
  return useQuery({
    queryKey: ["places"],
    queryFn: () => placesAPI.list(),
  });
}
```

### Form Handling

```jsx
// Use React Hook Form + Zod for validation
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  email: z.string().email(),
  quantity: z.number().positive(),
});

export function MyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} />
      {errors.email && <span>{errors.email.message}</span>}
    </form>
  );
}
```

### Performance Optimization

1. **Code Splitting**:

   ```jsx
   const BookingsList = React.lazy(() => import("./BookingsList"));

   <Suspense fallback={<div>Loading...</div>}>
     <BookingsList />
   </Suspense>;
   ```

2. **Memoization**:

   ```jsx
   // Memoize expensive components
   const BookingCard = React.memo(({ booking }) => {
     return <div>{booking.name}</div>;
   });

   // Memoize callbacks
   const handleClick = useCallback(() => {
     // ...
   }, [dependency]);
   ```

3. **Query Caching**:

   ```jsx
   useQuery({
     queryKey: ["bookings"],
     queryFn: () => api.get("/bookings"),
     staleTime: 5 * 60 * 1000, // 5 minutes
     gcTime: 10 * 60 * 1000, // 10 minutes
     keepPreviousData: true, // Smooth pagination
   });
   ```

4. **Image Optimization**:
   ```jsx
   // Use responsive images
   <img
     src={url}
     srcSet={`${url}?w=400 400w, ${url}?w=800 800w`}
     sizes="(max-width: 600px) 400px, 800px"
     alt="..."
   />
   ```

### Testing Strategy

**Unit Tests:**

```javascript
// Button.test.jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    await userEvent.click(screen.getByText("Click"));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

**Hook Tests:**

```javascript
// useBookings.test.js
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBookings } from "./useBookings";

it("fetches bookings", async () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const { result } = renderHook(() => useBookings(), { wrapper });

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });
});
```

### Accessibility (a11y)

```jsx
// ❌ Not accessible
<div onClick={handleClick}>Book Now</div>

// ✅ Accessible
<button onClick={handleClick} aria-label="Book now">
  Book Now
</button>

// Image alt text
<img src="place.jpg" alt="Ha Long Bay from above" />

// Form labels
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ARIA attributes
<div role="alert" aria-live="polite">
  Booking confirmed!
</div>
```

### Debugging Tips

1. **React DevTools Browser Extension**:
   - Inspect component tree
   - View props and state
   - Profile performance

2. **React Query DevTools**:

   ```jsx
   import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

   <QueryClientProvider client={queryClient}>
     <App />
     <ReactQueryDevtools initialIsOpen={false} />
   </QueryClientProvider>;
   ```

3. **Console Logging**:

   ```javascript
   // Use labeled console logs
   console.log("[BookingForm] Values:", values);
   console.error("[BookingAPI] Error:", error);
   console.debug("[Cache] Query invalidated", queryKey);
   ```

4. **Network Tab**:
   - Inspect API requests/responses
   - Monitor request headers (auth token)
   - Check response status codes

---

## 📋 Development Workflow

1. **Create branch for feature**:

   ```bash
   git checkout -b feature/booking-list
   ```

2. **Development**:

   ```bash
   npm run dev
   npm run lint
   npm run test
   ```

3. **Before commit**:

   ```bash
   npm run lint -- --fix
   npm run test
   npm run build
   ```

4. **Commit with clear message**:

   ```bash
   git commit -m "feat(booking): add booking list page with filters"
   ```

5. **Push and create PR**:
   ```bash
   git push origin feature/booking-list
   ```

---

## �📄 License

Proprietary - All Rights Reserved

---

## 👥 Contributors

- **Didaugio Team**

---

## 📞 Support

For issues, feature requests, documentation, or feedback, please open an issue in the main repository or contact the development team.

---

## 🔄 Development Workflow

1. Create feature branch: `git checkout -b feature/name`
2. Make changes and test: `npm run test`
3. Lint and format: `npm run lint`
4. Build for preview: `npm run build && npm run preview`
5. Commit and push
6. Create pull request

---

## 📋 Performance Tips

- Use lazy loading for routes: `React.lazy()`
- Optimize images and assets
- Monitor bundle size: `npm run build` output
- Profile with React DevTools
- Check Lighthouse scores in production

---

## 🌍 Multi-language Support

The app is built to support multiple languages. Configuration in `src/i18n/` (if applicable).

Currently supported: **Vietnamese**, **English**
