# BikeHub - Bike Service Management System

A comprehensive inventory and service management system for bike service centers built with Next.js 16, Neon PostgreSQL, Better Auth, and Drizzle ORM.

## Features

### 🔐 Staff Authentication
- Email and password-based staff login with Better Auth
- Secure session management
- Per-staff member data isolation

### 📦 Inventory Management
- Track bike parts and supplies with SKU codes
- Real-time stock level monitoring
- Low stock alerts and warnings
- Supplier information management
- Automatic minimum stock thresholds

### 🔧 Service Management
- Create and manage service offerings
- Track service records with customer bikes
- Service status tracking (pending, in-progress, completed)
- Technician assignment
- Detailed service history

### 👥 Customer Management
- Store customer information (name, email, phone, address)
- Link bikes to customers
- Track customer service history
- Multiple bikes per customer

### 📄 Invoice Generation
- Create invoices from service records
- Professional PDF invoice downloads
- Invoice status tracking (pending, paid, cancelled)
- Itemized billing details
- Custom invoice numbering

### 📊 Dashboard
- Quick statistics overview
- Low stock alerts
- Recent service activity
- Total revenue tracking
- Customer and service overview

## Project Structure

```
/app
  /inventory        - Inventory management pages
  /services         - Service and service records management
  /customers        - Customer and bike management
  /invoices         - Invoice management and PDF generation
  /actions          - Server actions for data operations
  /api/auth         - Better Auth handler
  /sign-in          - Staff login page
  /sign-up          - Staff registration page
  page.tsx          - Dashboard
  layout.tsx        - Root layout with metadata
  globals.css       - Global styles and theme colors

/components
  sidebar.tsx       - Navigation sidebar
  auth-form.tsx     - Login/registration form
  /ui               - shadcn/ui components

/lib
  auth.ts           - Better Auth configuration
  auth-client.ts    - Better Auth client
  /db
    index.ts        - Drizzle database client
    schema.ts       - Database schema
  utils.ts          - Utility functions
```

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Database**: Neon PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth
- **PDF Generation**: jsPDF + html2canvas
- **Icons**: Lucide React

## Database Schema

### Core Tables
- **user** - Staff accounts (Better Auth)
- **session** - Staff sessions (Better Auth)
- **account** - OAuth providers (Better Auth)
- **verification** - Email verification (Better Auth)

### Business Tables
- **customers** - Customer records
- **bikes** - Customer bikes
- **parts** - Inventory parts
- **services** - Service offerings
- **service_records** - Service history
- **service_record_items** - Items used in services
- **invoices** - Generated invoices
- **invoice_items** - Invoice line items

## Color Scheme

- **Primary**: #ff650a (Orange)
- **Accent**: #020202 (Dark/Black)
- **Secondary**: #f6f6f6 (Light Gray)

## Getting Started

### Prerequisites
- Node.js 18+ with pnpm
- Neon PostgreSQL database
- Better Auth secret key

### Installation

1. **Clone and install dependencies**
   ```bash
   pnpm install
   ```

2. **Set environment variables**
   ```bash
   DATABASE_URL=your_neon_connection_string
   BETTER_AUTH_SECRET=your_secret_key (generate with: openssl rand -base64 32)
   BETTER_AUTH_URL=your_deployment_url (optional)
   ```

3. **Run development server**
   ```bash
   pnpm dev
   ```

4. **Access the application**
   - Open http://localhost:3000
   - Create staff account via /sign-up
   - Login at /sign-in

## Usage Guide

### Dashboard
- View key metrics (parts, customers, revenue)
- See low stock alerts
- Monitor recent services
- Quick overview of services offered

### Inventory Management
1. Navigate to "Inventory" tab
2. Click "Add Part" to add new inventory items
3. Set minimum stock levels
4. Track quantity and pricing
5. Get alerts when stock falls below minimum

### Services Management
1. Go to "Services" tab
2. Create service offerings with pricing
3. Create service records for customer bikes
4. Update service status as work progresses

### Customer Management
1. Navigate to "Customers" tab
2. Add new customers with contact info
3. Register customer bikes (brand, model, year)
4. View customer service history

### Invoice Generation
1. Go to "Invoices" tab
2. Create invoice from completed service
3. Add service items and pricing
4. Download as PDF
5. Track payment status

## API Endpoints

### Authentication
- `POST /api/auth/sign-up` - Register staff
- `POST /api/auth/sign-in` - Login staff
- `POST /api/auth/sign-out` - Logout

### Server Actions
All business operations use Next.js Server Actions in:
- `/app/actions/inventory.ts`
- `/app/actions/services.ts`
- `/app/actions/customers.ts`
- `/app/actions/invoices.ts`

## Security

- Session-based authentication with Better Auth
- Per-user data isolation on all queries
- CSRF protection
- SQL injection prevention with Drizzle ORM
- Password hashing with Better Auth defaults

## PDF Invoice Details

- Professional letterhead with BikeHub branding
- Customer and service information
- Itemized billing table
- Subtotal, tax, and total calculations
- Notes section
- Timestamp and invoice number

## Support

For issues or questions:
1. Check the database schema in `lib/db/schema.ts`
2. Review server actions for business logic
3. Check Better Auth documentation: authjs.dev
4. Review Drizzle ORM docs: orm.drizzle.team

## License

This project is built with Next.js and shadcn/ui components.
