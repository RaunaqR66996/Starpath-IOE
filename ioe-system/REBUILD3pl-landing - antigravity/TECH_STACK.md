# Technology Stack - BlueShip 3PL Platform

**Last Updated:** December 2024  
**Project:** BlueShip Supply Chain Management Platform  
**Status:** Production-Ready Full-Stack Application

---

## 📋 Executive Summary

BlueShip is a comprehensive **3PL (Third-Party Logistics) Supply Chain Management Platform** built with modern, enterprise-grade technologies. The platform features AI-powered optimization, real-time tracking, 3D warehouse visualization, and seamless ERPNext integration.

**Core Architecture:** Next.js 15 (React 19) + TypeScript + PostgreSQL + Prisma ORM + AI/ML Integration

---

## 🎯 Frontend Stack

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | `15.2.4` | React framework with App Router, SSR, SSG, API Routes |
| **React** | `19.0.0` | UI library with concurrent features, Server Components |
| **TypeScript** | `5.7.2` | Type-safe development with strict mode |

**Key Features:**
- ✅ App Router architecture (file-based routing)
- ✅ Server Components & Client Components
- ✅ API Routes (backend endpoints)
- ✅ Image optimization
- ✅ Edge runtime support
- ✅ Streaming SSR

### Styling & UI Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | `3.4.17` | Utility-first CSS framework |
| **PostCSS** | `8.5.0` | CSS processing |
| **Autoprefixer** | `10.4.20` | Vendor prefix automation |
| **tailwindcss-animate** | `1.0.7` | Animation utilities |

**UI Component Libraries:**

| Library | Components | Purpose |
|---------|-----------|---------|
| **shadcn/ui** | 50+ components | Enterprise component library |
| **Radix UI** | 20+ primitives | Accessible, headless UI primitives |
| **Lucide React** | 500+ icons | Icon library |

**Radix UI Components Used:**
- Accordion, Alert Dialog, Avatar, Checkbox, Collapsible
- Context Menu, Dialog, Dropdown Menu, Hover Card
- Label, Menubar, Navigation Menu, Popover
- Progress, Radio Group, Scroll Area, Select
- Separator, Slider, Switch, Tabs, Toast, Toggle, Tooltip

### State Management & Data Fetching

| Technology | Version | Purpose |
|------------|---------|---------|
| **TanStack Query** | `5.90.2` | Server state management, caching, data fetching |
| **Zustand** | `5.0.8` | Client-side state management |
| **React Hook Form** | `7.54.2` | Form state management |
| **Zod** | `3.25.76` | Schema validation for forms and APIs |

### 3D Visualization & Graphics

| Technology | Version | Purpose |
|------------|---------|---------|
| **Three.js** | `0.180.0` | 3D graphics library |
| **React Three Fiber** | `9.4.0` | React renderer for Three.js |
| **@react-three/drei** | `10.7.6` | Useful helpers for R3F |
| **@types/three** | `0.180.0` | TypeScript definitions |

**Use Cases:**
- 3D warehouse visualization
- Load optimization visualization
- Interactive 3D models

### Maps & Geospatial

| Technology | Version | Purpose |
|------------|---------|---------|
| **Mapbox GL JS** | `3.13.0` | Interactive maps |
| **react-map-gl** | `8.0.4` | React wrapper for Mapbox |
| **@mapbox/mapbox-gl-language** | `1.0.1` | Multi-language map support |

**Features:**
- Real-time vehicle tracking
- Route visualization
- Location-based services

### Data Visualization

| Technology | Version | Purpose |
|------------|---------|---------|
| **Recharts** | `2.14.1` | Chart library built on D3 |
| **Framer Motion** | `12.23.22` | Animation library for React |

**Chart Types:**
- Line charts (trends)
- Bar charts (comparisons)
- Pie charts (distributions)
- Area charts (volume)

### Forms & Validation

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Hook Form** | `7.54.2` | Form state management |
| **@hookform/resolvers** | `3.9.1` | Validation resolver integrations |
| **Zod** | `3.25.76` | Schema validation |
| **input-otp** | `1.4.1` | OTP input component |

### Utilities & Helpers

| Technology | Version | Purpose |
|------------|---------|---------|
| **clsx** | `2.1.1` | Conditional className utility |
| **tailwind-merge** | `2.5.4` | Merge Tailwind classes |
| **class-variance-authority** | `0.7.1` | Component variant management |
| **date-fns** | `4.1.0` | Date manipulation |
| **cmdk** | `1.0.4` | Command menu component |
| **sonner** | `1.7.2` | Toast notifications |
| **react-hot-toast** | `2.6.0` | Toast notifications (alternative) |
| **vaul** | `1.1.2` | Drawer component |
| **embla-carousel-react** | `8.5.1` | Carousel component |
| **react-resizable-panels** | `3.0.6` | Resizable panel layouts |

### Icons & Design

| Technology | Version | Purpose |
|------------|---------|---------|
| **Lucide React** | `0.454.0` | Primary icon library |
| **@tabler/icons-react** | `3.35.0` | Additional icon set |

### Themes

| Technology | Version | Purpose |
|------------|---------|---------|
| **next-themes** | `0.4.4` | Dark/light mode support |

---

## 🔧 Backend Stack

### Runtime & Server

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | Latest LTS | JavaScript runtime |
| **Express.js** | `4.19.2` | Custom server (optional) |
| **Next.js API Routes** | Built-in | Serverless API endpoints |

### Database & ORM

| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | Latest | Primary production database |
| **Prisma ORM** | `6.18.0` | Type-safe database client |
| **@prisma/client** | `6.18.0` | Prisma client runtime |
| **pg** | `8.16.3` | PostgreSQL driver |
| **oracledb** | `6.9.0` | Oracle database driver (for ERPNext) |

**Features:**
- Type-safe database queries
- Migrations
- Connection pooling
- Transaction support

### Authentication & Security

| Technology | Version | Purpose |
|------------|---------|---------|
| **JWT** | - | Token-based authentication |
| **bcryptjs** | `3.0.2` | Password hashing |
| **Supabase Auth** | `2.76.1` | Authentication service (optional) |
| **@supabase/auth-helpers-nextjs** | `0.10.0` | Next.js auth helpers |
| **@supabase/auth-helpers-react** | `0.5.0` | React auth helpers |
| **@supabase/ssr** | `0.7.0` | SSR auth support |

**Security Middleware:**
- **Helmet** (`7.1.0`) - Security headers
- **CORS** (`2.8.5`) - Cross-origin resource sharing
- **express-rate-limit** (`7.2.0`) - Rate limiting

### API & Integration

| Technology | Version | Purpose |
|------------|---------|---------|
| **GraphQL** | `16.11.0` | Query language (optional) |
| **@graphql-tools/schema** | `10.0.24` | GraphQL schema utilities |
| **graphql-tag** | `2.12.6` | GraphQL query parsing |
| **REST APIs** | - | Primary API architecture |

### Real-time Communication

| Technology | Version | Purpose |
|------------|---------|---------|
| **Socket.io** | `4.7.5` | Real-time bidirectional communication |
| **socket.io-client** | `4.7.5` | Client-side Socket.io |

**Use Cases:**
- Live shipment tracking
- Real-time notifications
- Collaborative features

### Message Queue & Event Streaming

| Technology | Version | Purpose |
|------------|---------|---------|
| **KafkaJS** | `2.2.4` | Apache Kafka client |

**Use Cases:**
- Event-driven architecture
- Microservices communication
- Event streaming

### Caching

| Technology | Version | Purpose |
|------------|---------|---------|
| **ioredis** | `5.8.2` | Redis client |

**Use Cases:**
- Session storage
- API response caching
- Rate limiting

### File Processing

| Technology | Version | Purpose |
|------------|---------|---------|
| **csv-parser** | `3.2.0` | CSV file parsing |
| **jspdf** | `3.0.4` | PDF generation |
| **jspdf-autotable** | `5.0.2` | PDF table generation |

---

## 🤖 AI & Machine Learning

### AI Frameworks

| Technology | Version | Purpose |
|------------|---------|---------|
| **OpenAI SDK** | `4.73.1` | GPT-4, GPT-3.5 integration |
| **@ai-sdk/openai** | `2.0.77` | Vercel AI SDK for OpenAI |
| **@ai-sdk/react** | `2.0.106` | React hooks for AI SDK |
| **ai** | `5.0.106` | Vercel AI SDK core |

### LangChain Integration

| Technology | Version | Purpose |
|------------|---------|---------|
| **LangChain** | `0.3.30` | AI application framework |
| **@langchain/core** | `0.3.66` | Core LangChain functionality |
| **@langchain/openai** | `0.6.2` | OpenAI integration for LangChain |

### Multi-Provider AI

| Technology | Version | Purpose |
|------------|---------|---------|
| **@google/generative-ai** | `0.24.1` | Google Gemini integration |

**AI Features:**
- Load optimization algorithms
- Route planning assistance
- Predictive analytics
- Natural language queries
- AI-powered insights

---

## 📦 Enterprise Integration

### ERP Integration

| Technology | Version | Purpose |
|------------|---------|---------|
| **ERPNext** | Latest | Open-source ERP system |
| **Webhooks** | - | Event-driven sync |
| **REST APIs** | - | API-based integration |

**Integration Features:**
- Warehouse sync
- Inventory sync
- Order synchronization
- Customer data sync
- Item master data sync

### SAP Integration

| Technology | Version | Purpose |
|------------|---------|---------|
| **@sap/cloud-sdk-core** | `1.17.2` | SAP Cloud SDK core |
| **@sap/cloud-sdk-vdm-business-partner-service** | `2.1.0` | SAP Business Partner service |

---

## 🧪 Testing Stack

### Unit Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| **Jest** | `29.7.0` | JavaScript testing framework |
| **jest-environment-jsdom** | `29.7.0` | DOM environment for Jest |
| **@testing-library/react** | `16.1.0` | React component testing |
| **@testing-library/jest-dom** | `6.6.3` | Custom Jest matchers |
| **@testing-library/user-event** | `14.5.2` | User interaction simulation |
| **node-mocks-http** | `1.15.1` | HTTP mock objects |

### End-to-End Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| **Playwright** | `1.48.0` | E2E testing framework |

### Performance Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| **k6** | - | Load testing tool |

---

## 🔍 Monitoring & Observability

| Technology | Version | Purpose |
|------------|---------|---------|
| **Sentry** | `10.25.0` | Error tracking and monitoring |
| **Pino** | `10.1.0` | Structured logging |
| **pino-http** | `11.0.0` | HTTP request logging |
| **prom-client** | `15.1.3` | Prometheus metrics |

**Monitoring Features:**
- Error tracking
- Performance monitoring
- User session replay
- Real-time alerts

---

## 🛠️ Development Tools

### Build Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **TypeScript** | `5.7.2` | Type checking |
| **ESLint** | `9.17.0` | Code linting |
| **eslint-config-next** | `15.2.4` | Next.js ESLint config |
| **@typescript-eslint/parser** | `8.9.0` | TypeScript ESLint parser |
| **@typescript-eslint/eslint-plugin** | `8.9.0` | TypeScript ESLint rules |

### Development Utilities

| Technology | Version | Purpose |
|------------|---------|---------|
| **tsx** | `4.20.6` | TypeScript execution |
| **ts-node** | `10.9.2` | TypeScript Node.js execution |
| **dotenv-cli** | `11.0.0` | Environment variable management |
| **detect-port** | `2.1.0` | Port detection utility |
| **module-alias** | `2.2.3` | Module path aliasing |

### Type Definitions

| Technology | Version | Purpose |
|------------|---------|---------|
| **@types/node** | `24.0.15` | Node.js types |
| **@types/react** | `19.0.2` | React types |
| **@types/react-dom** | `19.0.2` | React DOM types |
| **@types/express** | `4.17.21` | Express types |
| **@types/jest** | `29.5.12` | Jest types |
| **@types/bcryptjs** | `2.4.6` | bcryptjs types |
| **@types/compression** | `1.7.5` | compression types |
| **@types/cors** | `2.8.17` | CORS types |

---

## 🐳 Deployment & Infrastructure

### Containerization

| Technology | Version | Purpose |
|------------|---------|---------|
| **Docker** | Latest | Containerization |
| **Docker Compose** | Latest | Multi-container orchestration |

### Deployment Platforms

- **Vercel** - Primary deployment (Next.js optimized)
- **Docker** - Container-based deployment
- **Kubernetes** - Orchestration (configs available)

### Infrastructure Services

| Service | Purpose |
|---------|---------|
| **PostgreSQL** | Production database |
| **Redis** | Caching and sessions |
| **Supabase** | Optional backend services |

---

## 📊 Key Features Enabled by Stack

### ✅ Production-Ready Features

- **Type Safety**: Full TypeScript coverage (100%)
- **Performance**: Next.js optimization, code splitting, image optimization
- **Security**: JWT auth, rate limiting, CSRF protection, Helmet headers
- **Monitoring**: Sentry error tracking, structured logging (Pino), Prometheus metrics
- **Testing**: Unit tests (Jest), E2E tests (Playwright), Performance tests (k6)
- **Scalability**: Multi-tenant architecture, caching (Redis), connection pooling

### ✅ Advanced Features

- **3D Warehouse Visualization**: Three.js + React Three Fiber
- **AI-Powered Optimization**: LangChain + OpenAI GPT-4
- **Real-time Updates**: Socket.io for live tracking
- **Interactive Maps**: Mapbox GL for route visualization
- **Advanced Forms**: React Hook Form + Zod validation
- **Professional UI**: shadcn/ui + Radix UI components

### ✅ Developer Experience

- **Hot Reload**: Next.js dev server
- **Type Safety**: TypeScript + Prisma generated types
- **Component Library**: 50+ pre-built components
- **Code Quality**: ESLint + TypeScript strict mode
- **Testing**: Comprehensive test suite setup

---

## 🎯 Architecture Patterns

### Frontend Architecture

- **Component-Based**: Modular React components
- **Server Components**: Next.js 15 Server Components for SEO/performance
- **Client Components**: Interactive UI with client-side state
- **Workspace Pattern**: ERPNext-style navigation structure
- **DocType Pattern**: Generic form/list components for data entities

### Backend Architecture

- **API Routes**: Next.js API routes (serverless functions)
- **ORM Pattern**: Prisma for database abstraction
- **RESTful APIs**: Standard REST endpoints
- **Event-Driven**: Webhook architecture for ERPNext sync
- **Microservices-Ready**: KafkaJS for event streaming

### Data Flow

```
ERPNext → Webhooks → API Routes → Prisma ORM → PostgreSQL
                ↓
         Real-time Updates (Socket.io)
                ↓
         Frontend (React + TanStack Query)
```

---

## 📈 Version Status (December 2024)

### ✅ Latest Stable Versions

| Technology | Version | Status |
|------------|---------|--------|
| Next.js | 15.2.4 | ✅ Latest |
| React | 19.0.0 | ✅ Latest Major |
| TypeScript | 5.7.2 | ✅ Latest Stable |
| Prisma | 6.18.0 | ✅ Latest Stable |
| Tailwind CSS | 3.4.17 | ✅ Latest Stable |
| Node.js | Latest LTS | ✅ Recommended |

### 📦 Total Package Count

- **Production Dependencies**: 100+ packages
- **Development Dependencies**: 30+ packages
- **Total**: 130+ packages

---

## 🔄 Build & Scripts

### Key npm Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:next         # Start Next.js dev server

# Building
npm run build            # Production build
npm run build:with-db    # Build with Prisma generation

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate:deploy # Deploy migrations
npm run db:seed          # Seed database
npm run db:health        # Check database health

# Testing
npm run test             # Run all tests
npm run test:unit        # Unit tests only
npm run test:e2e         # End-to-end tests
npm run test:performance # Performance tests
npm run test:all         # Comprehensive test suite

# Quality
npm run lint             # Lint code
npm run lint:fix         # Fix linting issues
npm run security:scan    # Security audit

# Docker
npm run docker:build     # Build Docker image
npm run docker:dev       # Start Docker containers
```

---

## 🎨 UI/UX Standards

### Design System

- **Color Palette**: ERPNext-inspired professional colors
- **Typography**: Inter font family
- **Spacing**: Consistent Tailwind spacing scale
- **Components**: shadcn/ui component library
- **Accessibility**: WCAG 2.1 compliant (Radix UI)

### Responsive Design

- Mobile-first approach
- Breakpoints: sm, md, lg, xl, 2xl
- Touch-friendly interactions
- Responsive tables and forms

---

## 🔐 Security Features

- JWT-based authentication
- Password hashing (bcryptjs)
- Rate limiting (express-rate-limit)
- Security headers (Helmet)
- CORS configuration
- Input validation (Zod)
- SQL injection prevention (Prisma)
- XSS protection
- CSRF protection

---

## 📝 Summary

This technology stack provides:

✅ **Modern & Latest**: All major dependencies are up-to-date  
✅ **Type-Safe**: Full TypeScript coverage  
✅ **Scalable**: Microservices-ready architecture  
✅ **Secure**: Enterprise-grade security  
✅ **Performant**: Optimized for speed  
✅ **Maintainable**: Clean code, comprehensive testing  
✅ **Production-Ready**: Monitoring, logging, error tracking  

**The stack is optimized for:**
- Supply chain and logistics operations
- Real-time tracking and updates
- AI-powered optimization
- Enterprise ERP integration
- 3D visualization and interactive maps
- Professional, accessible UI/UX

---

**Last Updated:** December 2024  
**Maintained By:** BlueShip Development Team

