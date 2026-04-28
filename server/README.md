# 🖥️ Didaugio Backend Server

A robust Node.js/Express backend API server for managing travel experiences, bookings, and business operations. Built with Prisma ORM, PostgreSQL, and integrated with AI services.

> **Version:** 1.0.0  
> **Author:** Nguyen Hong Phu  
> **Runtime:** Node.js with Babel (ES6+)  
> **Database:** PostgreSQL + Prisma ORM  
> **Authentication:** JWT (JSON Web Tokens)

---

## 🌟 Features

- **Authentication & Authorization** - JWT-based auth with role-based access control (RBAC)
- **Business Management** - Create and manage tourism businesses and offerings
- **Booking System** - Complete booking lifecycle with payment integration
- **AI-Powered Features** - Google Gemini API integration for smart recommendations
- **Image Management** - Cloudinary integration for photo uploads
- **Email Notifications** - Automated emails for confirmations and alerts
- **Location Services** - Geospatial queries and routing (OSRM integration)
- **QR Code Generation** - Dynamic QR codes for bookings
- **Rate Limiting** - API rate limiting for security and stability
- **Logging** - Comprehensive logging with Winston
- **Security** - Helmet, CORS, input validation with Zod

---

## 🏗️ Backend Architecture

### Layered Architecture (N-Tier)

```
Request Flow:
  Incoming HTTP Request (POST /api/bookings)
           ↓
  Express Route (routes/bookingRoutes.js)
           ↓
  Request Validation (zod schema)
           ↓
  Authentication Middleware (verify JWT)
           ↓
  Authorization Middleware (check role/permission)
           ↓
  Controller (controllers/bookingController.js)
           ↓
  Service Layer (services/bookingService.js) ← Business Logic
           ↓
  Prisma ORM (Database Queries)
           ↓
  PostgreSQL Database
           ↓
  Response (JSON)
```

### Layer Responsibilities

**Route Layer** (`src/routes/`)

- Maps HTTP methods/paths to controllers
- Defines request parameters

**Controller Layer** (`src/controllers/`)

- **Responsibility:**
  - Extract data from request (body, params, query)
  - Call appropriate service method
  - Format response
  - Return HTTP status & data

**Example Controller:**

```javascript
// src/controllers/bookingController.js
export class BookingController {
  async createBooking(req, res) {
    try {
      const { placeId, date, quantity, userId } = req.body;

      // Validation
      if (!placeId || !date || !quantity) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Call service
      const booking = await bookingService.createBooking({
        placeId,
        date,
        quantity,
        userId: req.user.id, // From auth middleware
      });

      // Return response
      return res.status(201).json({
        success: true,
        data: booking,
        message: "Booking created successfully",
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getBookings(req, res) {
    try {
      const bookings = await bookingService.getUserBookings(req.user.id);
      return res.status(200).json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}
```

**Service Layer** (`src/services/`)

- **Responsibility:**
  - Business logic
  - Data transformation
  - Call Prisma models (database)
  - Call external services (email, AI, payment)
  - Input validation

**Example Service:**

```javascript
// src/services/bookingService.js
export class BookingService {
  async createBooking(bookingData) {
    // Validation
    if (bookingData.quantity < 1) {
      throw new Error("Quantity must be at least 1");
    }

    // Check place exists and available
    const place = await prisma.place.findUnique({
      where: { id: bookingData.placeId },
    });
    if (!place) throw new Error("Place not found");

    // Check availability
    const conflicts = await prisma.booking.findMany({
      where: {
        placeId: bookingData.placeId,
        date: bookingData.date,
        status: { in: ["confirmed", "pending"] },
      },
    });

    if (conflicts.length >= place.maxCapacity) {
      throw new Error("No availability on this date");
    }

    // Calculate price
    const totalPrice = place.pricePerPerson * bookingData.quantity;

    // Create booking in database
    const booking = await prisma.booking.create({
      data: {
        ...bookingData,
        totalPrice,
        status: "pending",
        createdAt: new Date(),
      },
      include: {
        place: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });

    // Send confirmation email
    await mailerService.sendBookingConfirmation(booking);

    // Generate QR code
    const qrCode = await qrcodeService.generate(booking.id);

    // Update booking with QR code
    await prisma.booking.update({
      where: { id: booking.id },
      data: { qrCode },
    });

    return booking;
  }

  async getUserBookings(userId) {
    return prisma.booking.findMany({
      where: { userId },
      include: { place: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async cancelBooking(bookingId, userId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new Error("Booking not found");
    if (booking.userId !== userId) throw new Error("Unauthorized");
    if (!["pending", "confirmed"].includes(booking.status)) {
      throw new Error("Cannot cancel this booking");
    }

    // Process refund
    const refund = await paymentService.refund(booking.paymentId);

    // Update booking status
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "cancelled",
        refundedAt: new Date(),
        refundAmount: booking.totalPrice,
      },
    });

    // Send cancellation email
    await mailerService.sendCancellationEmail(updated);

    return updated;
  }
}
```

**Model/Prisma Layer** (`prisma/schema.prisma`)

- Database schema definitions
- Relationships
- Constraints

**Example Schema:**

```prisma
model Booking {
  id            String   @id @default(cuid())
  userId        String
  placeId       String
  date          DateTime
  quantity      Int
  totalPrice    Float
  status        BookingStatus @default(PENDING)
  paymentId     String?
  refundAmount  Float?
  qrCode        String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  refundedAt    DateTime?

  // Relations
  user          User     @relation(fields: [userId], references: [id])
  place         Place    @relation(fields: [placeId], references: [id])

  @@index([userId])
  @@index([placeId])
}

enum BookingStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
}
```

---

## 🔌 API Endpoints - Detailed Examples

### Authentication Endpoints

**POST /api/auth/register**

```javascript
// Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+84987654321"
}

// Response (201):
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2026-04-15T10:00:00Z"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}

// Error (400):
{
  "success": false,
  "error": "Email already registered"
}
```

**POST /api/auth/login**

```javascript
// Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

// Response (200):
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**POST /api/auth/refresh**

```javascript
// Request:
{
  "refreshToken": "eyJhbGc..."
}

// Response (200):
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "expiresIn": 900 // seconds
}

// Error (401):
{
  "success": false,
  "error": "Invalid refresh token"
}
```

### Bookings Endpoints

**GET /api/bookings**

```javascript
// Query params: ?status=confirmed&limit=10&offset=0
// Headers: Authorization: Bearer <token>

// Response (200):
{
  "success": true,
  "data": [
    {
      "id": "booking_456",
      "placeId": "place_123",
      "date": "2026-05-01",
      "quantity": 2,
      "totalPrice": 500000,
      "status": "confirmed",
      "place": {
        "id": "place_123",
        "name": "Ha Long Bay Cruise",
        "image": "https://..."
      }
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0
  }
}
```

**POST /api/bookings**

```javascript
// Request:
{
  "placeId": "place_123",
  "date": "2026-05-01",
  "quantity": 2,
  "notes": "Early pick-up preferred"
}

// Response (201):
{
  "success": true,
  "data": {
    "id": "booking_789",
    "placeId": "place_123",
    "date": "2026-05-01",
    "quantity": 2,
    "totalPrice": 500000,
    "status": "pending",
    "qrCode": "data:image/png;base64,...",
    "createdAt": "2026-04-15T10:00:00Z"
  }
}
```

**DELETE /api/bookings/:id**

```javascript
// Response (200):
{
  "success": true,
  "message": "Booking cancelled",
  "refundAmount": 500000
}
```

### Places Endpoints

**GET /api/places**

```javascript
// Query: ?category=beach&limit=20&offset=0&lat=10.0&lng=106.0&radius=5

// Response (200):
{
  "success": true,
  "data": [
    {
      "id": "place_123",
      "name": "Ha Long Bay",
      "description": "World heritage site...",
      "category": "beach",
      "location": {
        "latitude": 20.9108,
        "longitude": 107.1843,
        "address": "Ha Long, Quang Ninh"
      },
      "images": ["https://..."],
      "rating": 4.8,
      "reviews": 256,
      "pricePerPerson": 250000,
      "operatingHours": {
        "open": "08:00",
        "close": "17:00"
      }
    }
  ],
  "nearby": true // if radius query used
}
```

**GET /api/places/:id**

```javascript
// Response (200):
{
  "success": true,
  "data": {
    "id": "place_123",
    "name": "Ha Long Bay",
    "description": "...",
    "category": "beach",
    "location": { /* ... */ },
    "images": ["https://..."],
    "rating": 4.8,
    "reviews": [
      {
        "id": "review_1",
        "userId": "user_123",
        "userName": "John Doe",
        "rating": 5,
        "text": "Amazing experience!",
        "createdAt": "2026-04-10T..."
      }
    ],
    "amenities": ["WiFi", "Parking", "Restaurant"],
    "availability": {
      "2026-05-01": { "available": true, "spots": 5 },
      "2026-05-02": { "available": false, "spots": 0 }
    }
  }
}
```

### Business Endpoints

**POST /api/business**

```javascript
// Request (requires auth):
{
  "name": "Adventure Tours VN",
  "description": "Local tour company",
  "category": "tours",
  "address": "Da Nang, Vietnam",
  "phone": "+84501234567",
  "taxId": "1234567890",
  "ownerName": "Nguyễn Văn A"
}

// Response (201):
{
  "success": true,
  "data": {
    "id": "business_123",
    "name": "Adventure Tours VN",
    "status": "pending_approval",
    "createdAt": "2026-04-15T10:00:00Z"
  }
}
```

**GET /api/business/:id/dashboard**

```javascript
// Business owner dashboard - analytics

// Response (200):
{
  "success": true,
  "data": {
    "totalBookings": 125,
    "totalRevenue": 50000000,
    "averageRating": 4.7,
    "thisMonthBookings": 32,
    "thisMonthRevenue": 12000000,
    "topPlace": {
      "name": "Ha Long Bay",
      "bookings": 45
    },
    "recentBookings": [
      {
        "id": "booking_456",
        "placeId": "place_123",
        "userName": "John Doe",
        "quantity": 2,
        "totalPrice": 500000,
        "date": "2026-05-01"
      }
    ]
  }
}
```

---

## 🛡️ Middleware Architecture

### Authentication Middleware

```javascript
// src/middlewares/auth.js
import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};
```

### Authorization Middleware

```javascript
// src/middlewares/authorize.js
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden - insufficient permissions",
      });
    }

    next();
  };
};

// Usage in routes:
// router.post(
//   '/business',
//   authMiddleware,
//   authorize('business_owner', 'admin'),
//   bookingController.createBusiness
// );
```

### Validation Middleware

```javascript
// src/middlewares/validate.js
import { z } from "zod";

export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      req.validated = validated;
      next();
    } catch (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
    }
  };
};

// Schema example:
const createBookingSchema = z.object({
  body: z.object({
    placeId: z.string().min(1),
    date: z.coerce.date(),
    quantity: z.number().int().positive(),
  }),
});
```

### Error Handling Middleware

```javascript
// src/middlewares/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  // Log error
  logger.error(`[${req.method}] ${req.url} - ${message}`);

  // Send response
  return res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Applied last in middleware chain:
// app.use(errorHandler);
```

---

## 🗄️ Database Schema Overview

### Core Models

```prisma
// User - Authentication & Profile
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  passwordHash    String
  name            String
  phone           String?
  avatar          String?
  role            UserRole  @default(USER)      // USER, BUSINESS_OWNER, ADMIN
  emailVerified   Boolean   @default(false)
  createdAt       DateTime  @default(now())

  // Relations
  bookings        Booking[]
  business        Business?
  reviews         Review[]
}

// Place - Tourism Destination
model Place {
  id              String    @id @default(cuid())
  businessId      String
  name            String
  description     String
  category        String    // beach, mountain, culture, etc.
  rating          Float     @default(0)

  location        Location  @relation(fields: [locationId])
  locationId      String

  images          String[]  // URLs
  pricePerPerson  Float
  maxCapacity     Int

  amenities       String[]  // WiFi, Parking, etc.
  operatingHours  Json      // { open: "08:00", close: "17:00" }

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  business        Business  @relation(fields: [businessId])
  bookings        Booking[]
  reviews         Review[]

  @@index([businessId])
}

// Booking - Reservation
model Booking {
  id              String    @id @default(cuid())
  userId          String
  placeId         String
  date            DateTime
  quantity        Int
  totalPrice      Float
  status          BookingStatus @default(PENDING)

  paymentId       String?
  refundAmount    Float?
  qrCode          String?

  notes           String?
  createdAt       DateTime  @default(now())

  // Relations
  user            User      @relation(fields: [userId])
  place           Place     @relation(fields: [placeId])

  @@index([userId])
  @@index([placeId])
}

// Location - Geospatial
model Location {
  id              String    @id @default(cuid())
  address         String
  latitude        Float
  longitude       Float
  city            String
  district        String

  places          Place[]

  @@index([latitude, longitude])
}
```

---

## 🤖 External Service Integration

### Gemini AI Service

```javascript
// src/services/geminiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_KEY);

export const geminiService = {
  async generateItinerary(tripData) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Create a 5-day itinerary for a trip to ${tripData.destination}
      with interests: ${tripData.interests.join(", ")}
      Budget: ${tripData.budget} USD
      Travelers: ${tripData.travelers}
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  },

  async recommendPlaces(userPreferences) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Recommend 5 places for someone who enjoys:
      ${userPreferences.interests.join(", ")}
      In region: ${userPreferences.region}
      Budget per place: $${userPreferences.budgetPerPlace}
      Return as JSON array with id, name, reason
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  },
};
```

### Email Service (Nodemailer)

```javascript
// src/services/mailerService.js
export const mailerService = {
  async sendBookingConfirmation(booking) {
    const mailOptions = {
      to: booking.user.email,
      subject: `Booking Confirmed - ${booking.place.name}`,
      html: `
        <h2>Booking Confirmed!</h2>
        <p>Place: ${booking.place.name}</p>
        <p>Date: ${booking.date}</p>
        <p>Quantity: ${booking.quantity}</p>
        <p>Total: ${booking.totalPrice.toLocaleString()}₫</p>
        <p><img src="${booking.qrCode}" alt="QR Code"></p>
      `,
    };

    return transport.sendMail(mailOptions);
  },
};
```

### Image Storage (Cloudinary)

```javascript
// src/services/mediaService.js
export const mediaService = {
  async uploadPlaceImage(file, placeId) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `places/${placeId}`,
      resource_type: "auto",
      public_id: `${Date.now()}`,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  },
};
```

---

├── src/
│ ├── server.js # Express app entry point
│ ├── config/ # Configuration files
│ │ ├── database.js # Database connection
│ │ ├── cloudinary.js # Image storage config
│ │ └── email.js # Email service config
│ ├── controllers/ # Request handlers
│ │ ├── authController.js # Authentication
│ │ ├── bookingController.js # Booking management
│ │ ├── businessController.js # Business operations
│ │ └── ...
│ ├── routes/ # API route definitions
│ │ ├── authRoutes.js
│ │ ├── bookingRoutes.js
│ │ ├── businessRoutes.js
│ │ └── ...
│ ├── services/ # Business logic
│ │ ├── authService.js
│ │ ├── bookingService.js
│ │ ├── aiService.js # Gemini API
│ │ └── ...
│ ├── models/ # Database models (Prisma schemas)
│ ├── middlewares/ # Express middlewares
│ │ ├── auth.js # JWT verification
│ │ ├── errorHandler.js # Error handling
│ │ └── ...
│ ├── lib/ # Utility libraries
│ ├── utils/ # Helper functions
│ └── scripts/ # Database scripts
│
├── prisma/
│ ├── schema.prisma # Prisma data model
│ └── migrations/ # Database migrations
│
├── public/ # Static files
├── tests/ # Test files
├── osrm/ # OSRM routing service (Docker)
│ └── docker-compose.yml
├── .env.example # Environment template
├── package.json # Dependencies
└── Dockerfile # Docker configuration

````

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** v18+ ([Download](https://nodejs.org/))
- **npm:** v9+ or **yarn**
- **PostgreSQL:** v12+ ([Download](https://www.postgresql.org/))
- **Docker** (optional, for OSRM routing service)

### Installation

1. **Navigate to server directory:**
   ```bash
   cd server
````

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file from the template:

   ```bash
   cp .env.example .env
   ```

   Configure required variables:

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/didaugio
   JWT_SECRET=your-secret-key
   GOOGLE_GENERATIVE_AI_KEY=your-gemini-api-key
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   NODE_ENV=development
   PORT=5000
   ```

4. **Set up database:**

   ```bash
   npm run migrate:dev
   npm run generate
   ```

5. **Start the server:**

   ```bash
   npm run start
   ```

   Server runs on `http://localhost:5000`

---

## 🔧 Available Scripts

| Command                  | Description                          |
| ------------------------ | ------------------------------------ |
| `npm run start`          | Start server with nodemon (dev mode) |
| `npm run migrate:dev`    | Create and apply migrations          |
| `npm run migrate:deploy` | Deploy migrations to production      |
| `npm run generate`       | Generate Prisma client               |
| `npm run studio`         | Open Prisma Studio (DB GUI)          |

---

## 📊 Database Management

### Prisma Studio

Interactive database management interface:

```bash
npm run studio
```

Opens at `http://localhost:5555`

### Database Migrations

Create a new migration:

```bash
npm run migrate:dev -- --name migration_name
```

View migration status:

```bash
npx prisma migrate status
```

---

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout

### Bookings

- `GET /api/bookings` - List user's bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Business

- `GET /api/business` - List all businesses
- `POST /api/business` - Create business (auth required)
- `GET /api/business/:id` - Get business details
- `PUT /api/business/:id` - Update business

### Places

- `GET /api/places` - List places
- `POST /api/places` - Create place
- `GET /api/places/:id` - Get place details

For complete API documentation, see [API_REFERENCE.md](../docs/API_REFERENCE.md)

---

## 🔐 Authentication

The server uses JWT (JSON Web Tokens) for authentication:

1. User authenticates with `/api/auth/login`
2. Server returns `accessToken` and `refreshToken`
3. Client includes token in `Authorization: Bearer <token>` header
4. Server validates token with `authMiddleware`

**Token Expiry:**

- Access Token: 15 minutes
- Refresh Token: 7 days

---

## 🤖 AI Services

### Gemini API Integration

The server integrates Google's Generative AI (Gemini) for:

- Smart trip recommendations
- Itinerary generation
- Natural language place queries

Configuration in `src/config/`, used in `src/services/aiService.js`

---

## 📸 Image Management

Images are uploaded and stored on **Cloudinary**:

- User avatars
- Place photos
- Business logos

Upload endpoint: `POST /api/upload`
Uses `multer` for file handling and `multer-storage-cloudinary` for storage.

---

## 📧 Email Service

Automated emails via **Nodemailer**:

- Account confirmation
- Booking confirmations
- Password reset
- Notifications

Configure SMTP credentials in `.env`

---

## 🗺️ Location Services

### OSRM (Open Source Routing Machine)

Optional Docker-based routing service for:

- Route calculation
- Distance matrix
- Isochrone generation

Start OSRM:

```bash
cd osrm
docker-compose up -d
```

---

## 🧪 Testing

Run test suite:

```bash
npm test
```

Test files location: `tests/`

**Key test suites:**

- `test_auth_*.js` - Authentication tests
- `test_booking_*.js` - Booking system tests
- `test_business_*.js` - Business module tests

---

## 🔒 Security Features

| Feature          | Implementation               |
| ---------------- | ---------------------------- |
| HTTPS            | Express + Helmet headers     |
| CORS             | Whitelist allowed origins    |
| Rate Limiting    | `express-rate-limit`         |
| Input Validation | Zod schema validation        |
| Password Hashing | bcrypt (rounds: 10)          |
| SQL Injection    | Prisma parameterized queries |
| XSS Protection   | Helmet CSP headers           |

---

## 📦 Key Dependencies

| Package                 | Purpose               |
| ----------------------- | --------------------- |
| `express`               | Web framework         |
| `prisma`                | ORM                   |
| `@prisma/client`        | Prisma client         |
| `jsonwebtoken`          | JWT auth              |
| `bcrypt`                | Password hashing      |
| `axios`                 | HTTP client           |
| `dotenv`                | Environment variables |
| `helmet`                | Security headers      |
| `cors`                  | CORS middleware       |
| `express-rate-limit`    | API rate limiting     |
| `cloudinary`            | Image hosting         |
| `nodemailer`            | Email service         |
| `@google/generative-ai` | Gemini AI             |
| `winston`               | Logging               |
| `zod`                   | Schema validation     |

---

## 📚 Documentation

- [Express Documentation](https://expressjs.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [JWT Guide](https://jwt.io/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Cloudinary API](https://cloudinary.com/documentation)
- [Google Generative AI](https://ai.google.dev/)

---

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Verify DATABASE_URL in .env
# Check PostgreSQL is running
psql -U <user> -d <database>
```

### Migration Issues

```bash
# Reset database (development only!)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

### Port Already in Use

```bash
# Change PORT in .env or use:
PORT=3001 npm run start
```

### Prisma Client Out of Sync

```bash
npm run generate
```

---

## � Development Best Practices

### Code Organization

1. **Layered Architecture** - Keep responsibilities separated:
   - Routes handle HTTP
   - Controllers parse requests
   - Services contain business logic
   - Prisma handles database

2. **Single Responsibility** - Each function does one thing:

   ```javascript
   // ❌ Too much responsibility
   async function processBooking(bookingData) {
     // Validate
     // Calculate price
     // Create in DB
     // Send email
     // Generate QR
   }

   // ✅ Separated concerns
   async function createBooking(bookingData) {
     validateBookingData(bookingData);
     const price = calculatePrice(bookingData);
     const booking = await prisma.booking.create(...);
     return booking;
   }

   // Called in controller
   const booking = await bookingService.createBooking(data);
   await mailerService.sendConfirmation(booking);
   await qrcodeService.generate(booking.id);
   ```

3. **Error Handling** - Custom error classes:

   ```javascript
   // src/lib/errors.js
   class BusinessError extends Error {
     constructor(message, status = 400) {
       super(message);
       this.status = status;
     }
   }

   class NotFoundError extends BusinessError {
     constructor(resource) {
       super(`${resource} not found`, 404);
     }
   }

   // Usage
   if (!place) throw new NotFoundError("Place");
   if (!booking) throw new NotFoundError("Booking");
   ```

### Request/Response Pattern

```javascript
// Standard response format
{
  success: true,
  data: { /* actual data */ },
  message: "Operation successful"
}

{
  success: false,
  error: "Error message",
  details: { /* validation errors */ }
}

// In controller:
return res.status(200).json({
  success: true,
  data: result,
  message: 'Resource created'
});

// Error responses
return res.status(400).json({
  success: false,
  error: 'Validation failed',
  details: validationErrors
});
```

### Validation Pattern

```javascript
// Use Zod for schema validation
const createBookingSchema = z.object({
  placeId: z.string().min(1, "Place ID required"),
  date: z.coerce.date().min(new Date(), "Date must be in future"),
  quantity: z.number().int().positive("Quantity must be positive"),
  notes: z.string().optional(),
});

// In controller
const validated = createBookingSchema.parse(req.body);
const booking = await bookingService.createBooking(validated);
```

### Logging Strategy

```javascript
// src/lib/logger.js
import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Usage
logger.info("Booking created", { bookingId, userId });
logger.error("Payment failed", { error: err.message, bookingId });
logger.debug("Cache hit", { cacheKey });
```

### Database Query Optimization

```javascript
// ❌ N+1 query problem
const bookings = await prisma.booking.findMany();
for (const booking of bookings) {
  booking.place = await prisma.place.findUnique(/* ... */); // Repeated queries!
}

// ✅ Use include/select
const bookings = await prisma.booking.findMany({
  include: {
    place: true,
    user: { select: { id: true, email: true, name: true } },
  },
});

// ✅ Use where for filtering, not in-memory
const recentBookings = await prisma.booking.findMany({
  where: {
    createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  },
});
```

### API Rate Limiting

```javascript
// Implement rate limiting per endpoint
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many login attempts",
  standardHeaders: true,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});

// Apply to routes
router.post("/login", authLimiter, loginController);
router.get("/places", apiLimiter, placesController.getAll);
```

---

## 🔍 Testing Approach

### Test Files Location

```
server/
├── tests/
│   ├── test_auth_*.js
│   ├── test_booking_*.js
│   ├── test_business_*.js
│   └── test_api_focused_contracts.js
```

### Testing Strategy

**Unit Tests** - Test individual functions:

```javascript
// test_utils.js
describe("utils", () => {
  it("formats currency correctly", () => {
    expect(formatCurrency(1000000)).toBe("1,000,000₫");
  });
});
```

**Integration Tests** - Test API endpoints:

```javascript
// test_booking_contracts.js
describe("Booking API", () => {
  it("POST /bookings creates booking", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        placeId: "place_123",
        date: "2026-05-01",
        quantity: 2,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
  });
});
```

**Contract Tests** - Test API contracts:

```javascript
// Ensures response schema matches
expect(response.body).toMatchObject({
  success: Boolean,
  data: {
    id: String,
    totalPrice: Number,
    status: String,
  },
});
```

---

## 📊 Performance Considerations

### Query Performance

1. **Indexing** - Add indexes to frequently queried fields:

   ```prisma
   model Booking {
     id String @id
     userId String
     createdAt DateTime @default(now())

     @@index([userId])
     @@index([createdAt])
   }
   ```

2. **Pagination** - Always paginate large datasets:

   ```javascript
   const limit = Math.min(req.query.limit || 20, 100);
   const offset = req.query.offset || 0;

   const [data, total] = await Promise.all([
     prisma.booking.findMany({ take: limit, skip: offset }),
     prisma.booking.count(),
   ]);
   ```

3. **Caching** - Use node-cache for frequently accessed data:

   ```javascript
   const cache = new NodeCache({ stdTTL: 600 });

   export async function getPlace(id) {
     const cached = cache.get(`place:${id}`);
     if (cached) return cached;

     const place = await prisma.place.findUnique({ where: { id } });
     cache.set(`place:${id}`, place);
     return place;
   }
   ```

### Connection Pooling

Configure PostgreSQL connection pool in `.env`:

```env
DATABASE_URL="postgresql://user:pass@localhost/db?schema=public"
```

Prisma automatically handles pooling. Monitor with:

```bash
npm run studio # Prisma Studio shows active connections
```

---

## 🔐 Security Best Practices

### Input Validation

```javascript
// Always validate input with Zod
const userSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password too short"),
  name: z.string().min(3).max(100),
});
```

### Password Security

```javascript
import bcrypt from "bcrypt";

// Hashing
const hash = await bcrypt.hash(password, 10); // 10 rounds

// Verification
const isValid = await bcrypt.compare(password, hash);
```

### JWT Secret Management

```bash
# Generate strong secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Store in .env
JWT_SECRET=your-generated-secret-here
```

### HTTPS & SSL (Production)

```javascript
// Use Helmet for security headers
import helmet from "helmet";
app.use(helmet());

// CORS - whitelist origins
import cors from "cors";
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
```

---

## �📄 License

ISC License

---

## 👥 Contributors

- **Lead Developer:** Nguyen Hong Phu

---

## 📞 Support

For issues, feature requests, or documentation updates, please open an issue in the main repository.
