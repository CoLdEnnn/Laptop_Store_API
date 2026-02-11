### Laptop_Store_API

#  Project Overview
LaptopStore is a full-stack web application for managing and purchasing laptops.
Users can register, login, browse laptops, add them to cart and create orders.
Admins can manage products and users.

## Tech Stack
- Node.js
- Express
- MongoDB
- Mongoose
- JWT Authentication
- Bcrypt
- Nodemailer (SMTP)

## Setup Instructions

1. Clone repository
2. Install dependencies:

npm install express mongoose cors dotenv jsonwebtoken bcryptjs joi

3. Create .env file:

PORT=3000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
SENDGRID_API_KEY=your_key

4. Run server:

npm run dev

## API Documentation

### Auth
POST /api/auth/register  
POST /api/auth/login  

### User
GET /api/users/profile  
PUT /api/users/profile  

### Laptops
POST /api/laptops  
GET /api/laptops  
GET /api/laptops/:id  
PUT /api/laptops/:id  
DELETE /api/laptops/:id  

### Orders
POST /api/orders  
GET /api/orders  
GET /api/orders/:id  
PUT /api/orders/:id  
DELETE /api/orders/:id  

## Screenshots
Registration
<img width="1275" height="544" alt="image" src="https://github.com/user-attachments/assets/ea35c9c3-9f42-4b91-8d54-cec945e7cb76" />
Catalog
<img width="1282" height="873" alt="image" src="https://github.com/user-attachments/assets/9625b2e8-8bdf-4a7d-8fdc-81f76b3ead63" />
Cart
<img width="1296" height="464" alt="image" src="https://github.com/user-attachments/assets/074996f4-df91-491f-9454-32c4eddbd08f" />
Orders
<img width="1290" height="413" alt="image" src="https://github.com/user-attachments/assets/1a88c487-454f-4fc2-ac4f-1c236bcb6186" />
Admin Panel
<img width="1277" height="648" alt="image" src="https://github.com/user-attachments/assets/efc4da8c-7d40-4a73-ab36-e97d6abf5ee7" />
<img width="1317" height="771" alt="image" src="https://github.com/user-attachments/assets/f9fe6ab3-702f-441e-bd0c-26e82c7f6770" />

