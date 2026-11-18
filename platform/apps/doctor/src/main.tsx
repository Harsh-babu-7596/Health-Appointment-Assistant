import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { AppShell, AuthProvider, LoginPage, RequireAuth, ToastProvider } from "@medislot/shared/ui";
import "@medislot/shared/styles.css";
import "./app.css";
import { AvailabilityPage } from "./pages/AvailabilityPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SchedulePage } from "./pages/SchedulePage";

const nav = [
  { to: "/", label: "Schedule", icon: "calendar" as const, end: true },
  { to: "/availability", label: "Availability", icon: "clock" as const },
  { to: "/profile", label: "Profile & fees", icon: "settings" as const },
];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider role="doctor" apiBaseUrl={import.meta.env.VITE_API_URL}>
          <Routes>
            <Route
              path="/login"
              element={
                <LoginPage
                  appName="Doctor Portal"
                  icon="stethoscope"
                  tagline="Your day, your patients, one screen."
                  highlights={["Live queue with check-in and status", "Consultation notes and e-prescriptions", "Control your own availability"]}
                  demo={{ email: "vikram.mehta@medislot.dev", password: "Doctor@123" }}
                />
              }
            />
            <Route
              element={
                <RequireAuth>
                  <AppShell appName="Doctor Portal" icon="stethoscope" nav={nav} />
                </RequireAuth>
              }
            >
              <Route index element={<SchedulePage />} />
              <Route path="availability" element={<AvailabilityPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="*" element={<SchedulePage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
