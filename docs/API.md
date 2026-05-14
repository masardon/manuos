# API Documentation
# ManuOS - Manufacturing Operating System

**Version**: 2.0
**Last Updated**: May 2026

---

## Overview

ManuOS provides a RESTful API for all manufacturing operations. All endpoints return JSON responses and follow consistent patterns.

### Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

### Authentication

All API requests require authentication via cookies (development) or JWT tokens (production).

```http
Cookie: manos-user={JSON-encoded-user}
```

### Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-05-13T10:00:00Z"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

### Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Orders API

### List Orders

```http
GET /api/orders
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| boardId | string | Filter by board |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20) |

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

### Create Order

```http
POST /api/orders
```

**Request Body:**
```json
{
  "orderNumber": "ORD-2026-001",
  "customerName": "PT. Example",
  "customerEmail": "contact@example.com",
  "plannedStartDate": "2026-05-15",
  "plannedEndDate": "2026-06-15",
  "notes": "Order notes"
}
```

### Get Order

```http
GET /api/orders/[id]
```

### Update Order

```http
PUT /api/orders/[id]
```

### Delete Order

```http
DELETE /api/orders/[id]
```

---

## Manufacturing Orders API

### List Manufacturing Orders

```http
GET /api/mo
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| orderId | string | Filter by order |
| isOutsourced | boolean | Filter outsourced MOs |
| vendorId | string | Filter by vendor |

### Create Manufacturing Order

```http
POST /api/mo
```

**Request Body:**
```json
{
  "orderId": "order-id",
  "moNumber": "MO-2026-001",
  "name": "Manufacturing Order Name",
  "isOutsourced": false,
  "vendorId": null,
  "recipeId": "recipe-id",
  "plannedStartDate": "2026-05-15",
  "plannedEndDate": "2026-06-01"
}
```

### Get Manufacturing Order

```http
GET /api/mo/[id]
```

### Update Manufacturing Order

```http
PUT /api/mo/[id]
```

### Delete Manufacturing Order

```http
DELETE /api/mo/[id]
```

### Get MO Materials

```http
GET /api/mo/[id]/materials
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mo": { ... },
    "materials": [
      {
        "id": "...",
        "partNumber": "MAT-001",
        "requiredQuantity": 100,
        "availableStock": 150,
        "totalAllocated": 50,
        "remaining": 50
      }
    ]
  }
}
```

---

## Material Allocation API

### Allocate Material

```http
POST /api/mo/[id]/materials/allocate
```

**Request Body:**
```json
{
  "jobsheetId": "jobsheet-id",
  "materialRequirementId": "req-id",
  "inventoryId": "inventory-id",
  "quantity": 25,
  "locationId": "location-id",
  "shelfId": "shelf-id",
  "userId": "user-id"
}
```

**Response:**
```json
{
  "success": true,
  "allocation": {
    "id": "allocation-id",
    "quantity": 25,
    "status": "ALLOCATED"
  }
}
```

**Events Emitted:**
- `INVENTORY_UPDATE`: Inventory quantity changed
- `ALLOCATION_UPDATE`: New allocation created

### Deallocate Material

```http
DELETE /api/mo/[id]/materials/allocate
```

**Request Body:**
```json
{
  "allocationId": "allocation-id",
  "userId": "user-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Allocation cancelled and material returned to inventory"
}
```

---

## Production Output API

### Get Tasks for Output

```http
GET /api/production-output/tasks
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by task status |
| jobsheetId | string | Filter by jobsheet |
| moId | string | Filter by MO |

**Response:**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "task-id",
      "taskNumber": "T-001-01",
      "name": "Task Name",
      "status": "COMPLETED",
      "jobsheet": { ... },
      "manufacturingOrder": { ... },
      "machine": { ... },
      "assignedUser": { ... }
    }
  ]
}
```

### Record Production Output

```http
POST /api/production-output
```

**Request Body:**
```json
{
  "taskId": "task-id",
  "jobsheetId": "jobsheet-id",
  "moId": "mo-id",
  "partNumber": "PART-001",
  "productName": "Product Name",
  "plannedQty": 100,
  "actualQty": 95,
  "goodQty": 90,
  "reworkQty": 3,
  "scrapQty": 2,
  "batch": "BATCH-2026-001",
  "outputLocationId": "location-id",
  "notes": "Production notes"
}
```

**Response:**
```json
{
  "success": true,
  "output": {
    "id": "output-id",
    "outputNumber": "PO-2026-001",
    "goodQuantity": 90,
    "reworkQuantity": 3,
    "scrapQuantity": 2,
    "status": "PENDING_QC"
  }
}
```

**Events Emitted:**
- `INVENTORY_UPDATE`: Finished goods inventory created/updated

### Submit QC Inspection

```http
POST /api/production-output/[id]/qc
```

**Request Body:**
```json
{
  "result": "PASS",
  "inspectorId": "inspector-id",
  "notes": "QC inspection notes",
  "outputLocationId": "location-id"
}
```

**Response (PASS):**
```json
{
  "success": true,
  "output": {
    "id": "output-id",
    "status": "QC_PASSED"
  },
  "inventory": {
    "id": "inventory-id",
    "quantity": 90
  }
}
```

**Response (FAIL):**
```json
{
  "success": true,
  "output": {
    "id": "output-id",
    "status": "QC_FAILED"
  },
  "reworkOrder": {
    "id": "rework-id",
    "reworkNumber": "RW-2026-001"
  }
}
```

---

## Inventory API

### List Inventory

```http
GET /api/inventory
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| status | string | Filter by status |
| locationId | string | Filter by location |
| partNumber | string | Search by part number |
| page | number | Page number |
| limit | number | Items per page |

### Create Inventory Item

```http
POST /api/inventory
```

**Request Body:**
```json
{
  "partNumber": "MAT-001",
  "name": "Material Name",
  "quantity": 100,
  "unit": "pcs",
  "category": "RAW_MATERIAL",
  "locationId": "location-id",
  "shelfId": "shelf-id",
  "batch": "BATCH-001",
  "minimumStock": 20
}
```

### SSE Events Endpoint

```http
GET /api/inventory/events
```

**Event Types:**
- `INVENTORY_UPDATE`: Inventory quantity changes
- `RESERVATION_UPDATE`: Reservation status changes
- `ALLOCATION_UPDATE`: Material allocation changes
- `HANDOFF_UPDATE`: Material handoff status changes
- `HEARTBEAT`: Keep-alive signal (every 30s)

**Example:**
```javascript
const eventSource = new EventSource('/api/inventory/events');

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.type, data.data);
});
```

---

## Handoffs API

### List Handoffs

```http
GET /api/handoffs
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| fromLocationId | string | Filter by source |
| toLocationId | string | Filter by destination |
| moId | string | Filter by MO |

### Create Handoff

```http
POST /api/handoffs
```

**Request Body:**
```json
{
  "fromLocationId": "location-1",
  "toLocationId": "location-2",
  "handedBy": "user-id",
  "receivedBy": "user-id",
  "handoffType": "MATERIAL_REQUEST",
  "referenceType": "MO",
  "referenceId": "mo-id",
  "moId": "mo-id",
  "items": [
    {
      "inventoryId": "inventory-id",
      "partNumber": "MAT-001",
      "name": "Material",
      "quantity": 10,
      "unit": "pcs"
    }
  ],
  "notes": "Handoff notes"
}
```

### Update Handoff

```http
PUT /api/handoffs/[id]
```

---

## Machines API

### List Machines

```http
GET /api/machines
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| type | string | Filter by type |
| location | string | Filter by location |

### Create Machine

```http
POST /api/machines
```

**Request Body:**
```json
{
  "code": "CNC-001",
  "name": "CNC Milling Machine",
  "model": "HAAS VF-2",
  "type": "CNC Milling",
  "location": "Workshop A",
  "capacity": 8,
  "status": "IDLE"
}
```

### Update Machine Status

```http
PUT /api/machines/[id]/status
```

**Request Body:**
```json
{
  "status": "MAINTENANCE",
  "notes": "Scheduled maintenance"
}
```

---

## Users API

### List Users

```http
GET /api/users
```

### Create User

```http
POST /api/users
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "roleId": "role-id",
  "phone": "+6281234567890",
  "employeeId": "EMP-001"
}
```

### Update User

```http
PUT /api/users/[id]
```

### Delete User

```http
DELETE /api/users/[id]
```

---

## Settings API

### Get Setting

```http
GET /api/settings/[key]
```

### Update Setting

```http
PUT /api/settings/[key]
```

**Request Body:**
```json
{
  "value": "new-value",
  "description": "Setting description"
}
```

---

## Error Handling

### Common Errors

**Validation Error (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "quantity",
      "message": "Quantity must be greater than 0"
    }
  ]
}
```

**Unauthorized (401):**
```json
{
  "success": false,
  "error": "Unauthorized - Please login"
}
```

**Forbidden (403):**
```json
{
  "success": false,
  "error": "Forbidden - Insufficient permissions"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "error": "Resource not found"
}
```

**Server Error (500):**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production deployment, implement rate limiting at the reverse proxy level (Nginx/Caddy).

---

## Versioning

API versioning is not currently implemented. Breaking changes will be communicated in advance.

---

*ManuOS API Documentation v2.0 - May 2026*
