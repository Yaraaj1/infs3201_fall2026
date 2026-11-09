
# INFS3201 – Assignment 4

connection string: mongodb+srv://60309760:12class34@infs3201.gxqnptm.mongodb.net/


## Laundry Service Management System

### 1. Project Description

This project is a Laundry Service Management System developed using Node.js, Express.js, Handlebars, and MongoDB.

The application supports two types of users: customers and staff members. Customers can view laundry services, create orders, and track their own orders. Staff members can view all customer orders, update order statuses, and search for customers using their phone numbers.

### 2. Technologies Used

- Node.js
- Express.js
- Express Handlebars
- MongoDB
- JavaScript
- HTML and CSS
- dotenv

### 3. Project Features

#### Customer Features
- Log in using email and password.
- View available laundry services.
- Create new laundry orders.
- View personal orders through the customer dashboard.
- View order details and current order status.
- Log out securely.

#### Staff Features
- Log in using staff credentials.
- View all customer orders.
- Update order statuses.
- Search for customers using their phone numbers.
- View customer information and their orders.
- Log out.

#### Authentication and Session Management
- Customer and staff authentication.
- User accounts stored in MongoDB.
- MongoDB-based session management.
- Sessions expire after 10 minutes of inactivity.
- Sliding session expiration extends the session by 10 minutes after each valid activity.
- Staff-only routes are protected from unauthorized access.

#### Database Management
- MongoDB is used to store customers, services, orders, staff users, and sessions.
- MongoDB-generated `_id` identifiers are used instead of application-generated identifiers.
- Customer and service references in orders use MongoDB ObjectIds.

### 4. Database Collections

The application uses the following MongoDB collections:

| Collection | Description |
|---|---|
| `customers` | Stores customer information and login credentials. |
| `services` | Stores available laundry services and prices. |
| `orders` | Stores customer orders, selected services, quantities, and statuses. |
| `staff_users` | Stores staff login credentials. |
| `sessions` | Stores active user sessions and expiration times. |

Database name: `infs3201_fall2026`

### 5. Installation and Setup

#### Requirements
- Node.js installed.
- MongoDB Atlas account.
- MongoDB connection string.

#### Step 1: Clone the Repository

```bash
git clone https://github.com/Yaraaj1/infs3201_fall2026.git
```

Navigate into the project folder:

```bash
cd infs3201_fall2026
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Configure Environment Variables

Create a `.env` file in the project root directory.

Use the following structure:

```env
MONGODB_URI=your_mongodb_connection_string

MINIMUM_ORDER_CHARGE=25
FREE_DELIVERY_THRESHOLD=50
DELIVERY_CHARGE=10
```

Replace the MongoDB URI with your own connection string.

The `.env.example` file provides a template for the required environment variables.

#### Step 4: Start the Application

```bash
node server.js
```

Open the application in your browser:

```text
http://localhost:3001
```

### 6. User Accounts

The project includes sample customer and staff accounts for testing.

The available email addresses and passwords are documented in `users.md`.

Customer and staff accounts are listed separately in that file.

### 7. Main Application Routes

| Route | Method | Description |
|---|---|---|
| `/` | GET | Displays the home page. |
| `/login` | GET | Displays the login page. |
| `/login` | POST | Authenticates the user. |
| `/welcome` | GET | Displays the user's account type. |
| `/services` | GET | Displays available laundry services. |
| `/orders` | GET | Displays all orders for staff. |
| `/orders` | POST | Creates a new customer order. |
| `/dashboard` | GET | Displays the appropriate customer or staff dashboard. |
| `/update-status` | GET | Displays the staff order status update page. |
| `/update-status` | POST | Updates an order status. |
| `/customer` | GET | Displays the customer search page for staff. |
| `/customer` | POST | Searches for a customer by phone number. |
| `/logout` | POST | Logs out the current user. |

### 8. Database Migration

The `db_transform.js` script was created to migrate the database from application-generated identifiers to MongoDB-generated `_id` identifiers.

The migration also updates customer and service references inside order documents.

The migration script is intended to run only once. A database backup is recommended before running it.

The migration process and LLM assistance are documented in `db_conversion.md`.

### 9. Project Structure

```text
infs3201_fall2026/
│
├── public/
│   └── css/
│       └── style.css
│
├── views/
│   ├── layouts/
│   │   └── main.handlebars
│   ├── customer.handlebars
│   ├── dashboard.handlebars
│   ├── home.handlebars
│   ├── login.handlebars
│   ├── orders.handlebars
│   ├── services.handlebars
│   ├── staff-dashboard.handlebars
│   ├── update-status.handlebars
│   └── welcome.handlebars
│
├── .env.example
├── .gitignore
├── businessLogic.js
├── customers.json
├── db_conversion.md
├── db_transform.js
├── Main.js
├── orders.json
├── package.json
├── package-lock.json
├── persistence.js
├── README.md
├── server.js
├── services.json
└── users.md
```

### 10. Security and Configuration Notes

- The actual `.env` file is excluded from Git using `.gitignore`.
- `node_modules` is excluded from the repository.
- The `.env.example` file contains placeholders rather than actual database credentials.
- Staff-only routes require staff authentication.
- Customers can only access their own orders through their dashboard.

### 11. Author

**Course:** INFS3201 – Web Technologies II  
**Assignment:** Assignment 4  
**Repository:** [infs3201_fall2026](https://github.com/Yaraaj1/infs3201_fall2026)
