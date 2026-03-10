# King of the Market (KOM) Backend API

A complete backend API for the **King of the Market** car marketplace in Bahrain.

## Uptime Monitoring

`GET /health` — lightweight endpoint (no DB, always HTTP 200) used to keep the Fly.io machine warm on the free plan.
Configure UptimeRobot to ping `https://api.kotm.app/health` every 5 minutes.
This endpoint must remain public (no auth required). This API supports two frontends: a mobile app (iOS/Android) and a web dashboard for admin moderation.

## Features

- **User Types**: Individual and Showroom sellers
- **Listing Types**: Cars, Plate Numbers, and Car Parts
- **Authentication**: JWT-based with access/refresh tokens
- **Media Upload**: S3-compatible presigned URL uploads (Cloudflare R2)
- **Payment Integration**: Listing fee (3 BHD) with webhook support
- **Moderation**: Admin review workflow for all listings
- **Notifications**: Push notifications via FCM/APNs
- **RBAC**: Role-based access control (SUPER_ADMIN, ADMIN, USER)

## Tech Stack

- **Framework**: NestJS v10 (Node.js + TypeScript)
- **Database**: PostgreSQL on Neon
- **ORM**: Prisma
- **Authentication**: Passport JWT
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI
- **Storage**: AWS S3 / Cloudflare R2

## Prerequisites

- Node.js >= 18
- pnpm (recommended) or npm
- PostgreSQL database (Neon serverless)
- S3-compatible storage (Cloudflare R2 or AWS S3)

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd kom-backend
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/kom?sslmode=require"

# JWT Secrets (generate secure random strings)
JWT_ACCESS_SECRET="your-access-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"

# S3/R2 Storage
S3_REGION="auto"
S3_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="kom-media"

# Super Admin (created on seed)
SUPER_ADMIN_EMAIL="info@kotm.app"
SUPER_ADMIN_PASSWORD="SecurePassword123!"

# Optional
NODE_ENV="development"
PORT=3000
```

### 3. Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed initial data (Super Admin + settings)
pnpm prisma db seed
```

### 4. Run the Application

```bash
# Development
pnpm run start:dev

# Production
pnpm run build
pnpm run start:prod
```

## API Documentation

Once running, access the Swagger documentation at:
- **Local**: http://localhost:3000/docs
- **API Base**: http://localhost:3000/api/v1

## API Endpoints

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login user |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Logout user |
| GET | `/me` | Get current user |

### Users (`/api/v1/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get user profile |
| PATCH | `/profile` | Update profile |
| GET | `/:id/public` | Get public profile |

### Listings (`/api/v1/listings`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create draft listing |
| GET | `/` | Get public listings |
| GET | `/my` | Get user's listings |
| GET | `/:id` | Get listing by ID |
| PATCH | `/:id` | Update listing |
| DELETE | `/:id` | Delete listing |
| POST | `/:id/submit` | Submit for review |

### Media (`/api/v1/media`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/presigned-url` | Get upload URL |
| POST | `/finalize` | Finalize upload |

### Payments (`/api/v1/payments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/listing-fee` | Initiate payment |
| POST | `/webhook` | Payment webhook |
| POST | `/:id/mark-paid` | Manual payment (Admin) |

### Moderation (`/api/v1/moderation`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pending` | Get pending listings |
| POST | `/:id/approve` | Approve listing |
| POST | `/:id/reject` | Reject listing |

### Reports (`/api/v1/reports`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create report |
| GET | `/` | Get reports (Admin) |
| PATCH | `/:id/resolve` | Resolve report |

### Admin (`/api/v1/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admins` | Create admin |
| GET | `/admins` | List admins |
| PATCH | `/admins/:id/permissions` | Update permissions |
| DELETE | `/admins/:id/deactivate` | Deactivate admin |
| GET | `/users` | List all users |
| POST | `/users/:id/ban` | Ban user |
| POST | `/users/:id/unban` | Unban user |
| GET | `/settings` | Get settings |
| PATCH | `/settings` | Update setting |
| GET | `/audit-logs` | Get audit logs |
| GET | `/dashboard/stats` | Dashboard stats |

### Health (`/api/v1/health`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Full health check |
| GET | `/live` | Liveness probe |
| GET | `/ready` | Readiness probe |

## Listing Workflow

1. **Create Draft**: User creates a listing (status: `DRAFT`)
2. **Add Media**: Upload images via presigned URLs
3. **Submit**: User submits listing for review (status: `PENDING_REVIEW`)
4. **Payment**: User pays listing fee (3 BHD)
5. **Review**: Admin approves or rejects
6. **Active**: Listing goes live (status: `ACTIVE`)

## User Roles

| Role | Permissions |
|------|-------------|
| `SUPER_ADMIN` | Full system access |
| `ADMIN` | Review listings, manage users (based on permissions) |
| `USER_INDIVIDUAL` | Create/manage own listings |
| `USER_SHOWROOM` | Create/manage own listings, showroom profile |

## Project Structure

```
src/
├── common/           # Shared utilities
│   ├── decorators/   # Custom decorators
│   ├── dto/          # Common DTOs
│   ├── filters/      # Exception filters
│   ├── guards/       # Auth guards
│   └── interceptors/ # Response interceptors
├── config/           # Configuration
├── modules/          # Feature modules
│   ├── admin/        # Admin management
│   ├── auth/         # Authentication
│   ├── health/       # Health checks
│   ├── listings/     # Car/Plate/Part listings
│   ├── media/        # File uploads
│   ├── moderation/   # Content moderation
│   ├── notifications/# Push notifications
│   ├── payments/     # Payment processing
│   ├── reports/      # User reports
│   └── users/        # User management
├── prisma/           # Database
│   ├── schema.prisma
│   └── seed.ts
├── app.module.ts
└── main.ts
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_ACCESS_SECRET` | Access token secret | Yes |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes |
| `S3_ENDPOINT` | S3/R2 endpoint URL | Yes |
| `S3_ACCESS_KEY_ID` | S3/R2 access key | Yes |
| `S3_SECRET_ACCESS_KEY` | S3/R2 secret key | Yes |
| `S3_BUCKET_NAME` | Media bucket name | Yes |
| `S3_REGION` | S3 region (or "auto" for R2) | Yes |
| `SUPER_ADMIN_EMAIL` | Super admin email | Yes |
| `SUPER_ADMIN_PASSWORD` | Super admin password | Yes |
| `PORT` | Server port | No (default: 3000) |
| `NODE_ENV` | Environment | No (default: development) |

## Scripts

```bash
# Development
pnpm run start:dev      # Start with hot reload

# Build
pnpm run build          # Compile TypeScript

# Production
pnpm run start:prod     # Start compiled app

# Database
pnpm prisma generate    # Generate client
pnpm prisma migrate dev # Run migrations
pnpm prisma db seed     # Seed data
pnpm prisma studio      # GUI for database

# Linting
pnpm run lint           # Run ESLint
pnpm run format         # Run Prettier
```

## License

Private - King of the Market © 2024
