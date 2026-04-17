# Mood Store - Production-Ready Order System

## Overview

This is a complete, production-ready e-commerce order management system with:

- 🗄️ **Real Database**: SQLite with Prisma ORM
- 📦 **Complete Order Management**: Create, track, and manage orders
- 💳 **Multiple Payment Methods**: Cash on Delivery, Paymob, Bank Transfer
- 🚚 **Shipping-Ready Architecture**: Prepared for shipping company integration
- 👔 **Admin API**: Full order management capabilities
- 📊 **Order Statistics**: Dashboard-ready analytics

## Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations (creates database)
npx prisma migrate dev

# Start development server
npm run dev
```

## Database Schema

### Order Model
| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique ID (CUID) |
| orderNumber | String | Human-readable (MOOD-20260416-XXXX) |
| customerName | String | Customer full name |
| phone | String | Egyptian phone number |
| email | String? | Optional email |
| address | String | Detailed address |
| city | String | City/Area |
| governorate | String? | Egyptian governorate |
| subtotal | Float | Items total |
| shippingFee | Float | Shipping cost |
| total | Float | Grand total |
| paymentMethod | String | cod, paymob, bank_transfer |
| paymentStatus | String | unpaid, pending, paid, failed |
| orderStatus | String | pending, confirmed, processing, shipped, delivered, cancelled |
| shippingCompany | String? | Shipping company name |
| trackingNumber | String? | Tracking number |
| shippingStatus | String? | Shipping status |
| createdAt | DateTime | Order creation time |
| updatedAt | DateTime | Last update time |

## API Reference

### Customer APIs

#### Create Order
```
POST /api/orders
```
**Body:**
```json
{
  "customerName": "Ahmed Mohamed",
  "phone": "01012345678",
  "email": "ahmed@example.com",
  "address": "123 Tahrir Street, Building 5, Floor 3",
  "city": "Nasr City",
  "governorate": "Cairo",
  "notes": "Please call before delivery",
  "paymentMethod": "cod",
  "items": [
    {
      "id": 1,
      "name": "Crunchy Peanut Butter",
      "size": "380g",
      "price": 199,
      "quantity": 2,
      "image": "/products/crunchy.jfif"
    }
  ],
  "shippingFee": 0
}
```

**Response:**
```json
{
  "success": true,
  "order": { ... },
  "redirectUrl": "/success?order=MOOD-20260416-XXXX"
}
```

#### Get Order by Number
```
GET /api/orders?order=MOOD-20260416-XXXX
```

### Admin APIs

All admin APIs require the `x-admin-key` header in production.

#### List Orders
```
GET /api/admin/orders?page=1&pageSize=20&status=pending&search=01012345678
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| pageSize | number | Items per page (default: 20) |
| status | string | Filter by order status |
| paymentStatus | string | Filter by payment status |
| search | string | Search by order number, phone, or name |
| sortBy | string | Sort field: createdAt, total, orderNumber |
| sortOrder | string | asc or desc |

#### Get Order Statistics
```
GET /api/admin/orders?stats=true
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalOrders": 150,
    "pendingOrders": 25,
    "completedOrders": 100,
    "cancelledOrders": 5,
    "totalRevenue": 50000,
    "todayOrders": 10,
    "todayRevenue": 5000
  }
}
```

#### Get Single Order
```
GET /api/admin/orders/[id]
```

#### Update Order
```
PATCH /api/admin/orders/[id]
```

**Body:**
```json
{
  "orderStatus": "shipped",
  "shippingCompany": "Aramex",
  "trackingNumber": "ARX123456789"
}
```

**Or use actions:**
```json
{ "action": "cancel" }
{ "action": "mark_paid" }
```

#### Cancel Order
```
DELETE /api/admin/orders/[id]
```

## Environment Variables

```env
# Required
DATABASE_URL="file:./prisma/dev.db"
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Paymob (for card payments)
PAYMOB_API_KEY=your_paymob_api_key
PAYMOB_INTEGRATION_ID=your_integration_id
PAYMOB_IFRAME_ID=your_iframe_id

# Admin API (required for production)
ADMIN_API_KEY=your_secure_random_key
```

## Shipping Integration (Ready)

The order model includes fields for shipping integration:

```typescript
// When shipping an order:
await updateOrder(orderId, {
  orderStatus: "shipped",
  shippingCompany: "Aramex",
  trackingNumber: "ARX123456789",
  shippingStatus: "picked_up"
});

// Shipping statuses available:
// pending, picked_up, in_transit, out_for_delivery, delivered
```

## Egyptian Governorates

The system includes all 27 Egyptian governorates for accurate delivery:
- Cairo, Giza, Alexandria, Dakahlia, Sharqia, Qalyubia
- Port Said, Suez, Ismailia, Gharbia, Monufia, Beheira
- Kafr El Sheikh, Damietta, Fayoum, Beni Suef, Minya
- Assiut, Sohag, Qena, Luxor, Aswan, Red Sea
- New Valley, Matrouh, North Sinai, South Sinai

## Notification System (Prepared)

The system includes a `NotificationLog` model for tracking notifications:

```typescript
// Log a notification
await logNotification(
  orderId,
  "sms",           // type: sms, email, whatsapp
  "+201012345678", // recipient
  "Your order has been shipped!", // message
  "pending"        // status: sent, failed, pending
);
```

## Database Commands

```bash
# View database in browser
npx prisma studio

# Reset database
npx prisma migrate reset

# Generate new migration
npx prisma migrate dev --name your_migration_name
```

## Production Deployment

1. Set up production environment variables
2. Use PostgreSQL or another production database:
   ```
   DATABASE_URL="postgresql://user:pass@host:5432/db"
   ```
3. Run migrations: `npx prisma migrate deploy`
4. Set `ADMIN_API_KEY` to a secure random string
5. Configure Paymob callback endpoint

## File Structure

```
mood-website/
├── app/
│   ├── api/
│   │   ├── orders/           # Customer order API
│   │   ├── admin/
│   │   │   └── orders/       # Admin order management
│   │   └── paymob/
│   │       └── callback/     # Paymob callback
│   ├── checkout/             # Checkout page
│   ├── success/              # Order success page
│   ├── cancel/               # Payment cancelled page
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── orders.ts         # Order service functions
│   │   └── types.ts          # TypeScript types
│   └── generated/
│       └── prisma/           # Generated Prisma client
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── migrations/           # Database migrations
│   └── dev.db                # SQLite database file
└── .env.local                # Environment variables
```
