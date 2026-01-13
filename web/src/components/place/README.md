# 📍 Place Module - Frontend

Module quản lý địa điểm cho dự án Đi Đâu Giờ.

## 🎯 Tính năng

- ✅ Multi-step wizard để tạo/chỉnh sửa địa điểm
- ✅ Upload và quản lý hình ảnh (tối đa 10 ảnh)
- ✅ Chọn vị trí trên bản đồ
- ✅ Quản lý giờ mở cửa theo từng ngày
- ✅ Chọn mức giá và khoảng giá
- ✅ Gán tags cho địa điểm
- ✅ Preview trước khi submit
- ✅ Validation đầy đủ

## 📁 Cấu trúc

```
web/src/
├── services/
│   ├── placeService.js       # API calls cho Place
│   ├── districtService.js    # API calls cho District
│   └── wardService.js        # API calls cho Ward
├── stores/
│   └── placeStore.js         # Zustand store cho Place
├── pages/
│   └── admin/
│       └── PlaceWizardPage.jsx  # Main wizard page
└── components/
    └── place/
        ├── CategorySelector.jsx      # Component chọn danh mục
        ├── MapPicker.jsx            # Component chọn vị trí bản đồ
        ├── ImageUploader.jsx        # Component upload hình ảnh
        ├── OpeningHoursEditor.jsx   # Component quản lý giờ mở cửa
        ├── PriceRangeSlider.jsx     # Component chọn mức giá
        ├── StepBasicInfo.jsx        # Step 1: Thông tin cơ bản
        ├── StepDetails.jsx          # Step 2: Chi tiết
        ├── StepPreview.jsx          # Step 3: Preview & Submit
        └── README.md
```

## 🚀 Cách sử dụng

### 1. Import Store

```jsx
import usePlaceStore from "@/stores/placeStore";

function MyComponent() {
  const { places, loading, fetchPlaces, createPlace } = usePlaceStore();
  
  // Fetch places
  useEffect(() => {
    fetchPlaces({ status: "approved", limit: 10 });
  }, []);
  
  return (
    // Your JSX
  );
}
```

### 2. Sử dụng Wizard

Wizard đã được tích hợp sẵn trong `PlaceWizardPage.jsx`. Để sử dụng:

```jsx
import { PlaceWizardPage } from "@/pages";

// Trong routes
<Route path="/admin/places/new" element={<PlaceWizardPage />} />
<Route path="/admin/places/edit/:id" element={<PlaceWizardPage />} />
```

### 3. Sử dụng từng Component riêng lẻ

```jsx
import { 
  CategorySelector, 
  MapPicker, 
  ImageUploader,
  OpeningHoursEditor,
  PriceRangeSlider 
} from "@/components/place";

function CustomForm() {
  const [categoryId, setCategoryId] = useState(null);
  const [images, setImages] = useState([]);
  
  return (
    <div>
      <CategorySelector 
        value={categoryId} 
        onChange={setCategoryId} 
      />
      
      <ImageUploader 
        images={images} 
        onChange={setImages} 
      />
    </div>
  );
}
```

## 📋 Wizard Flow

### Step 1: Thông tin cơ bản
- Tên địa điểm (bắt buộc)
- Slug (bắt buộc, auto-generate từ tên)
- Danh mục (bắt buộc)
- Quận/Huyện (bắt buộc)
- Phường/Xã (tùy chọn)
- Địa chỉ (bắt buộc)
- Mô tả ngắn (tùy chọn)

### Step 2: Chi tiết
- **Tab Mô tả**: Mô tả chi tiết về địa điểm
- **Tab Hình ảnh & Vị trí**: 
  - Upload hình ảnh (tối đa 10 ảnh)
  - Chọn vị trí trên bản đồ
- **Tab Liên hệ**:
  - Số điện thoại
  - Email
  - Website
  - Facebook

### Step 3: Preview & Submit
- **Tab Preview**: Xem trước thông tin địa điểm
- **Tab Tags & Giá**:
  - Chọn mức giá (Bình dân / Trung bình / Sang trọng)
  - Nhập khoảng giá cụ thể (tùy chọn)
  - Gán tags (gợi ý theo danh mục)
- **Tab Giờ mở cửa**:
  - Thêm khung giờ theo từng ngày
  - Áp dụng cho tất cả các ngày
  - Mở cửa 24/7

## 🎨 Customization

### Tùy chỉnh số lượng steps

Trong `PlaceWizardPage.jsx`:

```jsx
const steps = [
  { number: 1, title: "Step 1", component: StepBasicInfo },
  { number: 2, title: "Step 2", component: StepDetails },
  { number: 3, title: "Step 3", component: StepPreview },
  // Thêm step mới ở đây
];
```

### Tùy chỉnh validation

Mỗi step có hàm `validate()` riêng. Ví dụ trong `StepBasicInfo.jsx`:

```jsx
const validate = () => {
  const newErrors = {};
  
  if (!wizardData.name?.trim()) {
    newErrors.name = "Vui lòng nhập tên địa điểm";
  }
  
  // Thêm validation khác...
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

## 🔧 API Service

### placeService.js

```jsx
import { placeService } from "@/services";

// Get all places
const places = await placeService.getAllPlaces({ 
  status: "approved",
  categoryId: 1,
  page: 1,
  limit: 10 
});

// Get place by ID
const place = await placeService.getPlaceById(1);

// Create place
const newPlace = await placeService.createPlace({
  name: "Quán Cafe ABC",
  slug: "quan-cafe-abc",
  categoryId: 1,
  // ... other fields
});

// Update place
const updatedPlace = await placeService.updatePlace(1, {
  name: "New Name"
});

// Delete place
await placeService.deletePlace(1);

// Check slug exists
const exists = await placeService.checkSlugExists("quan-cafe-abc");

// Get nearby places
const nearby = await placeService.getNearbyPlaces(
  10.0345852,  // latitude
  105.7200532, // longitude
  5,           // radius (km)
  10           // limit
);

// Get featured places
const featured = await placeService.getFeaturedPlaces(10);
```

## 📊 Store State

### Wizard State

```jsx
const {
  wizardData,        // Object chứa tất cả data của wizard
  currentStep,       // Step hiện tại (1, 2, 3)
  totalSteps,        // Tổng số steps
  
  // Actions
  updateWizardData,  // Update wizard data
  nextStep,          // Chuyển sang step tiếp theo
  prevStep,          // Quay lại step trước
  setCurrentStep,    // Set step cụ thể
  resetWizard,       // Reset wizard về mặc định
  loadPlaceIntoWizard, // Load place vào wizard (edit mode)
} = usePlaceStore();
```

### wizardData Structure

```js
{
  // Step 1
  name: "",
  slug: "",
  categoryId: null,
  districtId: null,
  wardId: null,
  address: "",
  shortDescription: "",
  
  // Step 2
  description: "",
  latitude: null,
  longitude: null,
  phone: "",
  email: "",
  website: "",
  facebook: "",
  images: [],
  
  // Step 3
  tagIds: [],
  priceRange: null,
  priceFrom: null,
  priceTo: null,
  openingHours: [],
  amenities: {},
  
  status: "draft"
}
```

## 🎯 Constants

```jsx
import { 
  PLACE_STATUS,
  PRICE_RANGE,
  DAY_OF_WEEK,
  DAY_OF_WEEK_NAMES,
  PLACE_IMAGE_LIMITS 
} from "@/config/constants";

// Place Status
PLACE_STATUS.DRAFT      // "draft"
PLACE_STATUS.PENDING    // "pending"
PLACE_STATUS.APPROVED   // "approved"
PLACE_STATUS.REJECTED   // "rejected"
PLACE_STATUS.HIDDEN     // "hidden"

// Price Range
PRICE_RANGE.CHEAP       // "cheap"
PRICE_RANGE.MEDIUM      // "medium"
PRICE_RANGE.EXPENSIVE   // "expensive"

// Days of Week
DAY_OF_WEEK.MONDAY      // 1
DAY_OF_WEEK_NAMES[1]    // "Thứ 2"

// Image Limits
PLACE_IMAGE_LIMITS.MAX_IMAGES    // 10
PLACE_IMAGE_LIMITS.MAX_FILE_SIZE // 5MB
```

## 🐛 Troubleshooting

### Lỗi: "Cannot read property 'id' of undefined"

Đảm bảo rằng bạn đã fetch categories và tags trước:

```jsx
const { categories, fetchCategories } = useCategoryStore();
const { tags, fetchTags } = useTagStore();

useEffect(() => {
  if (categories.length === 0) fetchCategories();
  if (tags.length === 0) fetchTags();
}, []);
```

### Lỗi: Map không hiển thị

Map hiện tại là placeholder. Để tích hợp Leaflet/Google Maps:

```jsx
// Install
npm install leaflet react-leaflet

// Trong MapPicker.jsx
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
```

### Lỗi: Slug đã tồn tại

Wizard tự động kiểm tra slug khi người dùng nhập. Nếu slug đã tồn tại, hiển thị error message.

## 📝 Todo / Improvements

- [ ] Tích hợp Leaflet/Google Maps thực tế
- [ ] Upload ảnh lên cloud storage (Cloudinary/S3)
- [ ] Drag & drop để sắp xếp ảnh
- [ ] Rich text editor cho mô tả
- [ ] Preview ảnh fullscreen
- [ ] Bulk upload ảnh
- [ ] Autocomplete địa chỉ
- [ ] Validation nâng cao hơn

## 📞 Support

Nếu có vấn đề, liên hệ team dev hoặc tạo issue trên GitHub.
