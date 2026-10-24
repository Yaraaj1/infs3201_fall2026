# INFS3201 – Web Technologies II
## Assignment 3 – Laundry Management System

This project builds on Assignment 2 by using MongoDB for data storage and Express with Handlebars to display the website.

## Application Structure

The project uses three layers:

- **Presentation:** `server.js`, the Handlebars views, and the CSS files.
- **Business Logic:** `businessLogic.js`, which handles application rules and order status updates.
- **Persistence:** `persistence.js`, which connects to MongoDB and retrieves or updates data.

## Pages

- **Home:** Displays the navigation menu.
- **Find Customer:** Searches for a customer by ID and displays their information and orders.
- **Laundry Services:** Displays the available services and their prices.
- **All Orders:** Displays orders and their current statuses.
- **Update Order Status:** Allows an order's status to be changed when the transition is valid.

## Order Statuses

Orders follow this sequence:

`Received → Washing → Ready → Delivered`

A status cannot be moved backwards or changed to an invalid state.

## Database

The application uses MongoDB with the database name `infs3201_fall2026` and these collections:

- `customers`
- `services`
- `orders`

The MongoDB connection string is configured through an environment variable.

## Setup

1. Install [Node.js](https://nodejs.org/).
2. Install the project dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file using `.env.example` as a reference.
4. Set `MONGODB_URI` in `.env` to your MongoDB connection string.
5. Start the application using the start command defined in `package.json`.
6. Open `http://localhost:3001` in your browser.

## MongoDB Indexes

The following ascending indexes were created in MongoDB Compass:

- `customers.customerId` – supports customer searches by ID.
- `services.serviceId` – supports service searches by ID.
- `orders.orderId` – supports order searches by ID.
- `orders.customerId` – supports searches for a customer's orders.

Each index uses ascending order (`1`). MongoDB's default `_id` indexes are also present.

## Notes

- The website uses server-rendered Handlebars pages and external CSS.
- Database operations are handled in the persistence layer.
- The `.env` file contains local configuration and should not be committed to Git.