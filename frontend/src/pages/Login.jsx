import React from "react";
import { useSearchParams } from "react-router-dom";
import AdminLogin from "./AdminLogin";
import ClientLogin from "./ClientLogin";

/**
 * Universal Login Route Delegate
 * Routes to separate AdminLogin or ClientLogin without any merged UI tabs.
 */
export default function Login({ defaultRole }) {
  const [searchParams] = useSearchParams();
  const role = defaultRole || searchParams.get("role");

  if (role === "client") {
    return <ClientLogin />;
  }

  return <AdminLogin />;
}
