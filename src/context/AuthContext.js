"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const { data, error } = await supabase
      .from("colleges")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) {
      throw new Error("Invalid credentials");
    }

    if (data.password_hash !== password) {
      throw new Error("Invalid credentials");
    }

    const userData = {
      id: data.id,
      email: data.email,
      name: data.name,
      role: "admin",
    };

    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  }

  async function logout() {
    localStorage.removeItem("user");
    setUser(null);
  }

  async function studentLogin(token) {
    const { data, error } = await supabase
      .from("access_tokens")
      .select(
        `
        *,
        students (
          id,
          roll_no,
          name,
          email,
          department_id,
          departments (name)
        )
      `
      )
      .eq("token", token)
      .eq("is_used", false)
      .single();

    if (error || !data) {
      throw new Error("Invalid or expired token");
    }

    const studentData = {
      id: data.students.id,
      name: data.students.name,
      email: data.students.email,
      rollNo: data.students.roll_no,
      departmentId: data.students.department_id,
      departmentName: data.students.departments.name,
      token: token,
      role: "student",
    };

    localStorage.setItem("user", JSON.stringify(studentData));
    setUser(studentData);
    return studentData;
  }

  const value = {
    user,
    loading,
    login,
    logout,
    studentLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
