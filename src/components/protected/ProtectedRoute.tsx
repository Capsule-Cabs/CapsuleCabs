import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "@/contexts/AuthContext";
import Index from "@/pages/Index";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useContext(AuthContext);

  // if (isLoading) {
  //   return <div>Loading...</div>;
  // }

  if (!isAuthenticated) {
    return <Index></Index>
  }

  return <>{children}</>;
}
