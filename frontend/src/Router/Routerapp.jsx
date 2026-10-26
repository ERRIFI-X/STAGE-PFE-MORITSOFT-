import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "../components/layout/Layoute";
import Home from "../pages/Home";
import { Project } from "../pages/Project";
import { Clients } from "../pages/Clients";
import Dashboard from "../pages/Dashboard";
import { ProjectDetails } from "../pages/ProjectDetails";
import { Payments } from "../pages/Payments";
import { Invoices } from "../pages/Invoices";
import { InvoicePrint } from "../pages/InvoicePrint";
import AdminLogin from "../pages/AdminLogin";
import ClientLogin from "../pages/ClientLogin";
import { AuthProvider } from "../context/AuthContext";
import { Toaster } from "react-hot-toast";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import UserDashboard from "../pages/user/UserDashboard";
import UserProjects from "../pages/user/UserProjects";
import UserInvoices from "../pages/user/UserInvoices";
import { NotFound } from "../pages/NotFound";

export const Routerapp = () => {
  return (
    <AuthProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        {/* PUBLIC & SEPARATED AUTH ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Navigate to="/login/admin" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/login/client" element={<ClientLogin />} />
        <Route path="/user/login" element={<ClientLogin />} />
        <Route path="/client/login" element={<ClientLogin />} />
        
        {/* ADMIN PROTECTED ROUTES */}
        <Route element={<ProtectedRoute redirectTo="/login/admin" allowedRole="admin" />}>
          {/* Print views (Full screen, no layout) */}
          <Route path="admin/invoices/print/:id" element={<InvoicePrint />} />
          
          <Route element={<Layout />}>
            <Route path="admin/dashboard" element={<Dashboard />} />
            <Route path="admin/projects" element={<Project />} />
            <Route path="admin/projects/:id" element={<ProjectDetails />} />
            <Route path="admin/clients" element={<Clients />} />
            <Route path="admin/payments" element={<Payments />} />
            <Route path="admin/invoices" element={<Invoices />} />
          </Route>
        </Route>

        {/* CLIENT PROTECTED ROUTES */}
        <Route element={<ProtectedRoute redirectTo="/login/client" allowedRole="client" />}>
          {/* Print views (Full screen, no layout) */}
          <Route path="user/invoices/print/:id" element={<InvoicePrint />} />

          <Route element={<Layout />}>
            <Route path="user/dashboard" element={<UserDashboard />} />
            <Route path="user/projects" element={<UserProjects />} />
            <Route path="user/projects/:id" element={<ProjectDetails />} />
            <Route path="user/invoices" element={<UserInvoices />} />
          </Route>
        </Route>

        {/* 404 NOT FOUND PAGE */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </AuthProvider>
  );
};


