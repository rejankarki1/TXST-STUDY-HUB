import { Route, Routes } from "react-router";

import { ProtectedRoute } from "../components/common/ProtectedRoute.tsx";
import { AuthLayout } from "../layouts/AuthLayout.tsx";
import { MainLayout } from "../layouts/MainLayout.tsx";
import { CoursesPage } from "../pages/CoursesPage.tsx";
import { CreatePage } from "../pages/CreatePage.tsx";
import { HomePage } from "../pages/HomePage.tsx";
import { NotFoundPage } from "../pages/NotFoundPage.tsx";
import { ProfilePage } from "../pages/ProfilePage.tsx";
import { LoginPage } from "../pages/auth/LoginPage.tsx";
import { SignupPage } from "../pages/auth/SignupPage.tsx";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

