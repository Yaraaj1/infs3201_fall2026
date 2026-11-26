

connection string: mongodb+srv://60309760:12class34@infs3201.gxqnptm.mongodb.net/


# INFS3201 – Assignment 5
## Laundry Service Management System

### 1. Project Description

This project is a Laundry Service Management System developed using Node.js, Express.js, Handlebars, and MongoDB.

The application supports two types of users: customers and staff members. Customers can view laundry services, create orders, track their orders, and upload a pickup location photo. Staff members can manage customer orders, update order statuses, search for customers, and view customer information and uploaded photos.

### 2. Technologies Used

- Node.js
- Express.js
- Express Handlebars
- MongoDB
- JavaScript
- HTML and CSS
- dotenv
- pdf-lib
- Nodemailer
- Ethereal Email
- express-fileupload

### 3. Project Features

#### Customer Features
- Log in using email and password.
- View available laundry services.
- Create new laundry orders.
- View personal orders through the customer dashboard.
- View order details and current order status.
- Upload a JPG pickup location photo.
- Replace an existing photo.
- View the uploaded photo on the dashboard.
- Log out securely.

#### Staff Features
- Log in using staff credentials.
- View all customer orders.
- Update order statuses.
- Search for customers using their phone numbers.
- View customer information and orders.
- View customer pickup location photos.
- Log out.

#### PDF Invoice Generation (Part A1)
- Generate PDF invoices using pdf-lib.
- Retrieve actual order and customer information from MongoDB.
- Include order details, services, quantities, prices, and total amount.

#### Improved Invoice Design (Part A2)
- Improve the invoice layout and visual appearance.
- Present order information in a clear and organized format.
- Highlight the total amount.

#### Automatic Email Notifications (Part A3)
- Automatically generate and email an invoice when an order changes from Washing to Ready.
- Send the email to the customer's registered email address.
- Attach the generated PDF invoice.
- Use Nodemailer and Ethereal Email for email testing.

#### Customer Photo Upload (Part B)
- Allow authenticated customers to upload JPG images.
- Limit uploaded images to 2 MB.
- Generate unique filenames for uploaded images.
- Store images in the server-side photos directory.
- Store photo filename information in MongoDB.
- Allow customers to replace existing photos.
- Delete the previous photo when a replacement is uploaded.

#### Photo Access Security (Part C)
- Customers can only access their own uploaded photos.
- Staff members can view customer photos when managing orders.
- Unauthenticated users cannot access customer photos.
- Photos are not stored in the public static directory.
- Upload and photo-viewing routes are protected by authentication and authorization middleware.

### 4. Database Collections

The application uses the following MongoDB collections:

| Collection |