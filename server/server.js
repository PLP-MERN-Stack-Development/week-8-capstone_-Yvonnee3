const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const benefitRoutes = require('./routes/benefitRoutes');
const requestRoutes = require('./routes/requestRoutes');
const adminRoutes = require('./routes/adminRoutes');
const documentsRouter = require('./routes/documentRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const { checkAuth } = require('./middleware/authMiddleware.js');
const COOKIE_SECRET='secret'

const app = express();
app.use(express.json());
app.use(cookieParser(COOKIE_SECRET));
const corsOptions = {
  origin: ['https://employee-benefits-ebon.vercel.app', 'http://localhost:5174', 'http://localhost:5173'], // or use an array of allowed origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

connectDB();


app.use('/api/auth', authRoutes);
app.use('/api/benefits', benefitRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/documents', documentsRouter);
app.use('/api/employees', employeeRoutes);


app.listen(3000, () => {
    console.log('Server running on port 3000')
})

// Set timeout for all routes (30 seconds)
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    console.log('Request timeout');
    if (!res.headersSent) {
      res.status(503).json({ 
        success: false, 
        error: 'Request timeout' 
      });
    }
  });
  next();
});

app.get('/check-auth', checkAuth, (req, res) => {
    res.status(200).json({ isAuthenticated: true });
});



