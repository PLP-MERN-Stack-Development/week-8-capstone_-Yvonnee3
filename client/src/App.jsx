import { Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import LoadingSpinner from './components/LoadingSpinner';


//Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminBenefits from './pages/Admin/AdminBenefits';
import AdminRequests from './pages/Admin/AdminRequests';

//Employee Pages
import EmployeeDashboard from './pages/Employee/EmployeeDashboard';
import EmployeeBenefits from './pages/Employee/EmployeeBenefits';
import EmployeeRequests from './pages/Employee/EmployeeRequests';

function AppRoutes() {
  const { isAuthenticated, loading } = useUser();

  if (loading) {
    return <LoadingSpinner />;
  }
  // if (!isAuthenticated) {
  //   return (
  //     <Routes>
  //       <Route path = "/register" element ={<Register />} />
  //       <Route path="/login" element={<Login />} />
  //       <Route path="*" element={<Navigate to="/login" replace />} />
  //     </Routes>
  //   );
  // }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/login"
          element={
            isAuthenticated ?
              <Navigate to="/home" replace /> :
              <Login />
          }
        />
        <Route path="/register" element={<Register />} />
        <Route
          path="/home"
          element={
            isAuthenticated ?
              <Home /> :
              <Navigate to="/login" state={{ from: '/home' }} replace />
          }
        />

{/*ADMIN ROUTES */}
        <Route 
          path="/admin/dashboard" element={
          isAuthenticated ? 
            <AdminDashboard />:
            <Navigate to="/login" replace />
            } 
        />
        <Route 
          path="/admin/benefits" element={
          isAuthenticated ? 
            <AdminBenefits />:
            <Navigate to="/login" replace />
            } 
        />
        <Route 
          path="/admin/requests" element={
          isAuthenticated ? 
            <AdminRequests />:
            <Navigate to="/login" replace />
            } 
        />
        

{/*EMPLOYEE ROUTES */}
        <Route 
          path="/employee/dashboard" element={
          isAuthenticated ? 
            <EmployeeDashboard />:
            <Navigate to="/login" replace />
            } 
        />
        <Route 
          path="/employee/benefits" element={
          isAuthenticated ? 
            <EmployeeBenefits />:
            <Navigate to="/login" replace />
            } 
        />
        <Route 
          path="/employee/requests" element={
          isAuthenticated ? 
            <EmployeeRequests />:
            <Navigate to="/login" replace />
            } 
        />

      </Routes>
    </Layout>

  );
}

function App() {
  return (
    
    <ThemeProvider>
      <UserProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <AppRoutes />
          </div>
      </UserProvider>
    </ThemeProvider>

  );
}

export default App;