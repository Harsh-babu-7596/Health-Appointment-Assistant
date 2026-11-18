import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { AppShell, AuthProvider, LoginPage, RequireAuth, ToastProvider } from "@medislot/shared/ui";
import "@medislot/shared/styles.css";
import "./app.css";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { BookPage } from "./pages/BookPage";
import { FindDoctorsPage } from "./pages/FindDoctorsPage";
import { ProfilePage } from "./pages/ProfilePage";

const nav = [
  { to: "/", label: "Find a doctor", icon: "search" as const, end: true },
  { to: "/appointments", label: "My appointments", icon: "calendar" as const },
  { to: "/profile", label: "Profile", icon: "user" as const },
];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider role="patient" apiBaseUrl={import.meta.env.VITE_API_URL}>
          <Routes>
            <Route
              path="/login"
              element={
                <LoginPage
                  appName="Patient App"
                  icon="heart"
                  allowRegister
                  tagline="Book your next doctor visit in under a minute."
                  highlights={["Real-time availability for every doctor", "Instant confirmation, no phone calls", "Prescriptions and visit history in one place"]}
                  demo={{ email: "patient@medislot.dev", password: "Patient@123" }}
                />
              }
            />
            <Route
              element={
                <RequireAuth>
                  <AppShell appName="Patient" icon="heart" nav={nav} layout="top" />
                </RequireAuth>
              }
            >
              <Route index element={<FindDoctorsPage />} />
              <Route path="doctors/:id" element={<BookPage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="*" element={<FindDoctorsPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
