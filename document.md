# Employee Benefits Management System

## Project Overview
A full-stack web application for managing employee benefits and requests, featuring role-based dashboards for employees and administrators. The system allows employees to view/apply for benefits, upload documents, and track requests, while admins can manage benefits, review requests, and view statistics.

---

## Features

### Frontend (React + Vite)
- User authentication (register/login/logout)
- Role-based dashboards (Employee/Admin)
- Employees:
  - View available and active benefits
  - Apply for/cancel benefits
  - View and track requests
  - Upload and manage documents
- Admins:
  - Manage (create/update/delete) benefits
  - Review/approve/reject requests
  - View statistics and analytics
- Responsive UI with Tailwind CSS
- Notifications with React Toastify

### Backend (Node.js + Express + MongoDB)
- RESTful API for authentication, benefits, requests, employees, and documents
- JWT-based authentication and cookie sessions
- Role-based access control (employee/admin)
- File upload/download with GridFS
- CORS and secure cookie management
- Modular structure (routes, controllers, models, middleware)

---

## Directory Structure

```
.
├── server/         # Express API server
│   ├── controllers/ # Route controllers
│   ├── models/      # Mongoose models
│   ├── routes/      # API route definitions
│   ├── middleware/  # Auth and other middleware
│   ├── utils/       # Utility functions
│   ├── config/      # DB and app config
│   └── server.js    # Entry point
├── client/        # React + Vite client
│   ├── src/         # Source code
│   ├── public/      # Static assets
│   ├── index.html   # Main HTML file
│   └── ...
├── test/            # (Optional) Test files
└── README.md        # Project documentation
```

---

## Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/)
- [MongoDB](https://www.mongodb.com/) instance (local or cloud)

### 1. Clone the Repository

```bash
git clone <repo-url>
cd employeeBenefits
```

### 2. Backend Setup

```bash
cd server
npm install
```

#### Environment Variables
Create a `.env` file in `backend/` with the following:

```
MONGO_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
COOKIE_SECRET=<your-cookie-secret>
PORT=3000
```

#### Start Backend Server

```bash
npm run dev   # If using nodemon
# or
node server.js
```

### 3. Frontend Setup

```bash
cd ../client
npm install
```

#### Start Frontend Dev Server

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173) (or as specified by Vite).

---

## Usage

USER GUIDE

Creating a User Account


  Navigate to the Registration Page:
    <img width="1281" height="720" alt="image" src="https://github.com/user-attachments/assets/b98e66d0-7c06-4c12-8e2b-7de77e5648e6" />


  Go to the /register URL
  <img width="1281" height="720" alt="image" src="https://github.com/user-attachments/assets/aa2152a0-d58c-4858-8336-e10c36937e85" />


  Fill in the Registration Form:
  <img width="1281" height="720" alt="image" src="https://github.com/user-attachments/assets/a51f88e3-74dd-4bac-a098-9c1b67f5b4f7" />

  Enter all relevant fields as required
  Click the Register button.



ADMIN PAGES
    When logged in to the Admin side yo will be directed to the Dashboard where you are capable of Seeing quick action buttons i.e view benefits or review employee requests etc together with some other analytics and metrics


<img width="1280" height="720" alt="image" src="https://github.com/user-attachments/assets/2fc18504-8fff-4c24-81b7-5a018aa81a09" />


  Moving on to the Benefits page, The Admin is able to create and view all the benefits offered within the organization.
  <img width="1281" height="720" alt="image" src="https://github.com/user-attachments/assets/4e27a983-4616-4514-b7be-3edd38a8df43" />

  To Create a new benefit the admin can click the Create Benefit button on the top right to open the creation modal where they will input all the required info
<img width="1286" height="720" alt="image" src="https://github.com/user-attachments/assets/bf41c151-52a6-4c77-b9d8-c740e92818ed" />

  The admin can then proceed to the Requests Page to view and review all the employee Requests if any exist
   <img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/21bf2b2d-9ead-41b9-81d7-e64d40c585ce" />

EMPLOYEE PAGES


When logged in as an Employee You are directed to the Dashboard where you see specific metrics related to the specific employee. Here the Employee has quick actions and some metrics and analytics
<img width="1281" height="720" alt="image" src="https://github.com/user-attachments/assets/feaedbd4-470c-42a8-861f-1502678e23bc" />

When the employee navigates to the my benefits page, they see all the benefits that they are eligible for according to set criteria based on ranks

<img width="1281" height="720" alt="image" src="https://github.com/user-attachments/assets/dbd9ce9b-7b1d-4208-9c88-e8c53300efbe" />

To now request a benefit the employee presses the request benefit Button which submits their request to the admin for review.
<img width="475" height="348" alt="image" src="https://github.com/user-attachments/assets/46e950e9-91db-41d3-84d8-6b160ed42522" />



Upon request the Employee is notified that their request has been successfull 
<img width="1595" height="178" alt="image" src="https://github.com/user-attachments/assets/15904cf0-03df-43fc-8976-aa47359e8aeb" />







---

## API Endpoints (Backend)

### Auth
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `GET /api/auth/logout` — Logout
- `GET /api/auth/current-user` — Get current user info

### Benefits
- `GET /api/benefits` — List all benefits (admin)
- `POST /api/benefits` — Create benefit (admin)
- `PUT /api/benefits/:id` — Update benefit (admin)
- `DELETE /api/benefits/:id` — Delete benefit (admin)
- `GET /api/benefits/employee` — List employee's benefits
- `GET /api/benefits/stats` — Benefit statistics

### Requests
- `GET /api/requests` — List user's requests (employee)
- `POST /api/requests` — Request a benefit (employee)
- `DELETE /api/requests/:requestId` — Cancel request (employee)
- `GET /api/requests/all` — List all requests (admin)
- `PATCH /api/requests/:requestId/review` — Review request (admin)
- `GET /api/requests/stats` — Request statistics
- `POST /api/requests/:requestId/documents` — Upload documents
- `GET /api/requests/documents/:fileId` — Download document
- `DELETE /api/requests/:requestId/documents/:fileId` — Delete document

### Employees
- `GET /api/employees/dashboard-stats` — Employee dashboard stats
- `GET /api/employees/recent` — Recent requests

---

## Technologies Used

- **Frontend:** React, Vite, Tailwind CSS, Axios, React Router, React Toastify
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, GridFS, Multer

---
