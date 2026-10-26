import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const ProtectedRoute = ({ redirectTo = "/", allowedRole = null }) => {
  const { isAuthenticated, user } = useAuth();
  const token = localStorage.getItem("token");

  if (!isAuthenticated || !token) {
    return <Navigate to={redirectTo} replace />;
  }

  // If a specific role is required and user doesn't have it
  if (allowedRole && user?.role !== allowedRole) {
    // Redirect admin to admin dashboard, client to client dashboard
    const fallback = user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
};


