# Category Management UI Components

## 📋 Tổng quan

Giao diện quản lý danh mục với thiết kế **Card Grid Layout** - hiện đại, responsive và dễ sử dụng.

## 🎨 Design Features

### Layout

- **Card Grid Layout** với responsive breakpoints
- **4 cột** trên desktop (xl)
- **3 cột** trên laptop (lg)
- **2 cột** trên tablet (sm)
- **1 cột** trên mobile

### Visual Effects

- Hover effects với shadow & scale animations
- Color accent bar ở top mỗi card
- Gradient overlay on hover
- Icon animations (scale & rotate)
- Smooth transitions

### Components Structure

```
CategoryManagementPage
├── CategoryStats              // Stats cards (4 metrics)
├── Filters & Search Card
│   ├── Search Input
│   ├── Status Tabs (All/Active/Hidden)
│   ├── Sort Dropdown
│   └── View Mode Toggle (Grid/List)
├── CategoryCardList
│   ├── CategoryCard (multiple)
│   │   ├── Color Accent Bar
│   │   ├── Icon with color background
│   │   ├── Name & Description
│   │   ├── Stats Badges (Level, Branches, Places)
│   │   ├── Sub-categories Section (expandable)
│   │   └── Actions Menu (Edit, Add Child, Delete)
│   └── CategoryCardListSkeleton (loading state)
├── CategoryPagination
└── CategoryFormDialog
```

## 📦 Components

### 1. CategoryCard

**File:** `CategoryCard.jsx`

Card component hiển thị từng category với đầy đủ thông tin:

- Icon với màu sắc custom
- Tên, mô tả
- Stats: Level, số nhánh con, số địa điểm
- Sub-categories có thể expand/collapse
- Actions menu (3 dots)

**Props:**

```javascript
{
  category: Object,      // Category data
  onEdit: Function,      // Edit handler
  onDelete: Function,    // Delete handler
  onAddChild: Function,  // Add child handler
  onViewDetails: Function // View details handler
}
```

### 2. CategoryCardList

**File:** `CategoryCardList.jsx`

Grid container hiển thị danh sách categories:

- Responsive grid layout
- Loading skeleton
- Empty state
- Error state

**Props:**

```javascript
{
  categories: Array,     // Array of categories
  loading: Boolean,      // Loading state
  error: String,         // Error message
  onEdit: Function,
  onDelete: Function,
  onAddChild: Function,
  onViewDetails: Function
}
```

### 3. CategoryStats

**File:** `CategoryStats.jsx`

4 stats cards hiển thị metrics:

- Tổng danh mục
- Đang hiển thị
- Đã ẩn
- Tổng địa điểm

**Props:**

```javascript
{
  categories: Array; // Array of categories để tính stats
}
```

### 4. CategoryPagination

**File:** `CategoryPagination.jsx`

Pagination component:

- Page numbers với ellipsis
- Previous/Next buttons
- Results count
- Smooth scroll to top

**Props:**

```javascript
{
  currentPage: Number,
  totalPages: Number,
  totalItems: Number,
  onPageChange: Function
}
```

### 5. CategoryEmptyState

**File:** `CategoryEmptyState.jsx`

Empty state khi chưa có category:

- Gradient icon
- Call-to-action button
- Tips section

**Props:**

```javascript
{
  onCreateFirst: Function; // Handler cho "Create First" button
}
```

### 6. CategoryCardSkeleton

**File:** `CategoryCardSkeleton.jsx`

Loading skeletons:

- Single skeleton: `CategoryCardSkeleton`
- Multiple skeletons: `CategoryCardListSkeleton`

**Props:**

```javascript
{
  count: Number; // Number of skeletons (default: 8)
}
```

## 🎯 Features

### Filtering & Search

- **Search**: Tìm theo tên category (real-time)
- **Status Filter**: All / Active / Hidden
- **Sort**: Custom Order / Name A-Z / Newest
- **Results Count**: Hiển thị số kết quả tìm được

### Pagination

- 12 items per page
- Smart page numbers với ellipsis
- Smooth scroll to top on page change

### Responsive Design

```css
// Breakpoints
xs: < 640px   → 1 column
sm: ≥ 640px   → 2 columns
lg: ≥ 1024px  → 3 columns
xl: ≥ 1280px  → 4 columns
```

### Color System

- Mỗi category có color riêng
- Accent bar ở top card
- Icon background với opacity 20%
- Shadow với color 30%
- Level badge với color border

## 🔧 Usage Example

```jsx
import CategoryManagementPage from "@/pages/admin/CategoryManagementPage";

// In your router
<Route path="/admin/categories" element={<CategoryManagementPage />} />;
```

## 🎨 Customization

### Colors

Màu sắc được lấy từ `category.color`:

```javascript
style={{
  backgroundColor: `${category.color}20`,  // Icon bg
  color: category.color,                   // Icon color
  borderColor: category.color              // Level badge
}}
```

### Grid Layout

Thay đổi số cột trong `CategoryCardList.jsx`:

```jsx
className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
```

### Items Per Page

Thay đổi trong `CategoryManagementPage.jsx`:

```javascript
const itemsPerPage = 12; // Change this value
```

## 📱 Mobile Optimization

- Touch-friendly buttons & cards
- Responsive typography
- Stack filters vertically on mobile
- Single column layout
- Optimized touch targets (min 44px)

## ♿ Accessibility

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus states
- Screen reader friendly

## 🚀 Performance

- Memoized filtering & sorting
- Pagination reduces DOM nodes
- Lazy loading với skeleton
- Optimized re-renders
- Smooth animations (GPU-accelerated)

## 🐛 Known Limitations

- View Mode Toggle (Grid/List) chưa implement List view
- Drag & drop reordering chưa có
- Bulk actions chưa có
- Export/Import chưa có

## 📝 TODO

- [ ] Implement List View mode
- [ ] Add drag-and-drop reordering
- [ ] Add bulk actions (delete, hide, show)
- [ ] Add export to CSV/JSON
- [ ] Add import from file
- [ ] Add category duplication feature
- [ ] Add advanced filters (by level, by color)

---

**Created with ❤️ for didaugio project**
