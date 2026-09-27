# INFS3201 - Web Technologies II
## Assignment 2 - Three-Tier Laundry Management System

This project is a refactored version of Assignment 1 using a closed three-tier architecture.

### Architecture

The application is divided into three layers:

- Presentation Layer: `Main.js`
- Business Logic Layer: `businessLogic.js`
- Persistence Layer: `persistence.js`

The Presentation Layer handles user interaction, the Business Logic Layer handles application rules and pricing, and the Persistence Layer handles JSON file operations.

### Features

1. Show laundry services
2. View customer orders
3. Update order status
4. Create a new order
5. View order details and invoice
6. Exit

### Pricing Rules

- Minimum order charge: 25 QAR
- Delivery charge: 10 QAR when the original subtotal is below 50 QAR
- Free delivery when the original subtotal is 50 QAR or more
- Final total includes the adjusted service charge and delivery charge

Pricing values are loaded from environment variables.

### Data Files

- `customers.json`
- `services.json`
- `orders.json`

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
MINIMUM_ORDER_CHARGE=25
FREE_DELIVERY_THRESHOLD=50
DELIVERY_CHARGE=10
