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
├── backend/         # Express API server
│   ├── controllers/ # Route controllers
│   ├── models/      # Mongoose models
│   ├── routes/      # API route definitions
│   ├── middleware/  # Auth and other middleware
│   ├── utils/       # Utility functions
│   ├── config/      # DB and app config
│   └── server.js    # Entry point
├── frontend/        # React + Vite client
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
cd backend
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
cd ../frontend
npm install
```

#### Start Frontend Dev Server
```bash
npm run dev
```
The app will be available at [http://localhost:5173](http://localhost:5173) (or as specified by Vite).

---

## Usage
- Register or log in as an employee or admin.
- Employees can view/apply for benefits, upload documents, and track requests.
- Admins can manage benefits, review and approve/reject requests, and view analytics.

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

## License
This project is licensed under the MIT License.

---

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## Contact
For questions or support, please contact the project maintainer.

