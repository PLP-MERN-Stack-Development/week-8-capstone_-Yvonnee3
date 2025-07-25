import React from 'react'
import { useUser } from '../context/UserContext'
import AdminDashboard from '../pages/Admin/AdminDashboard'
import EmployeeDashboard from '../pages/Employee/EmployeeDashboard'

const Home = () => {
  const { user } = useUser();


  if (!user) {
    return <div>Loading user information...</div>;
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'employee': return '👩‍🏫';
      case 'employer': return '👑';
      default: return '👤';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'employee': return '#9c27b0';
      case 'employer': return '#f44336';
      default: return '#666';
    }
  };

  const renderRoleDashboard = () => {
    switch (user.role) {
      case 'employee':
        return <EmployeeDashboard />;
      case 'employer':
        return <AdminDashboard />;
      default:
        return (
          <div style={{
            backgroundColor: '#fff3cd',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #ffeaa7'
          }}>
            <p>Unknown role: {user.role}</p>
          </div>
        );
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: '1px solid #eee',
        paddingBottom: '20px'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>
            {getRoleIcon(user.role)} Welcome, {user.firstName}!
          </h1>
          <p style={{
            margin: '5px 0 0 0',
            color: getRoleColor(user.role),
            fontWeight: 'bold',
            textTransform: 'capitalize'
          }}>
            {user.role} Dashboard
          </p>
        </div>

      </header>

      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h2 style={{ marginTop: 0, color: '#333' }}>User Profile</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginTop: '15px'
        }}>
          <div>
            <strong>Full Name:</strong> {user.firstName} {user.lastName}
          </div>
          <div>
            <strong>Email:</strong> {user.email}
          </div>
          <div>
            <strong>Role:</strong>
            <span style={{
              color: getRoleColor(user.role),
              fontWeight: 'bold',
              textTransform: 'capitalize',
              marginLeft: '5px'
            }}>
              {user.role}
            </span>
          </div>
          <div>
            <strong>User ID:</strong> {user.id?.slice(-8).toUpperCase()}
          </div>
          {user.createdAt && (
            <div>
              <strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Role-specific dashboard */}
      {renderRoleDashboard()}

    </div>
  )
}

export default Home