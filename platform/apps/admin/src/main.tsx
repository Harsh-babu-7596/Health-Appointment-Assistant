import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { AppShell, AuthProvider, LoginPage, RequireAuth, ToastProvider } from "@medislot/shared/ui";
import "@medislot/shared/styles.css";
import "./app.css";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DoctorsPage } from "./pages/DoctorsPage";
import { PatientsPage } from "./pages/PatientsPage";

const nav = [
  { to: "/", label: "Analytics", icon: "chart" as const, end: true },
  { to: "/appointments", label: "Appointments", icon: "calendar" as const },
  { to: "/doctors", label: "Doctors", icon: "stethoscope" as const },
  { to: "/patients", label: "Patients", icon: "users" as const },
];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider role="admin" apiBaseUrl={import.meta.env.VITE_API_URL}>
          <Routes>
            <Route
              path="/login"
              element={
                <LoginPage
                  appName="Admin Dashboard"
                  icon="chart"
                  tagline="Run every doctor, branch and rupee from one place."
                  highlights={["Live revenue, bookings and no-show analytics", "Onboard doctors and manage their status", "Full patient and appointment records"]}
                  demo={{ email: "admin@medislot.dev", password: "Admin@123" }}
                />
              }
            />
            <Route
              element={
                <RequireAuth>
                  <AppShell appName="Admin" icon="chart" nav={nav} />
                </RequireAuth>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="doctors" element={<DoctorsPage />} />
              <Route path="patients" element={<PatientsPage />} />
              <Route path="*" element={<DashboardPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
