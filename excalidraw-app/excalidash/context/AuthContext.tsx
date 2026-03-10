import React from 'react';

const MOCK_USER = { id: "1", name: "Local User", email: "local@local", initials: "LU", color: "#4f46e5" };

export const useAuth = () => ({
  user: MOCK_USER,
  authEnabled: false,
  logout: () => {},
});

export const AuthProvider = ({ children }: any) => <>{children}</>;
