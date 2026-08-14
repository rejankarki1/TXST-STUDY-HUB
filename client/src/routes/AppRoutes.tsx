import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";

import { ProtectedRoute } from "../components/common/ProtectedRoute.tsx";
import { AuthLayout } from "../layouts/AuthLayout.tsx";
import { MainLayout } from "../layouts/MainLayout.tsx";

const AddExperiencePage = lazy(() =>
  import("../pages/AddExperiencePage.tsx").then((module) => ({
    default: module.AddExperiencePage,
  })),
);
const AddResourcePage = lazy(() =>
  import("../pages/AddResourcePage.tsx").then((module) => ({
    default: module.AddResourcePage,
  })),
);
const AskQuestionPage = lazy(() =>
  import("../pages/AskQuestionPage.tsx").then((module) => ({
    default: module.AskQuestionPage,
  })),
);
const CourseExperiencesPage = lazy(() =>
  import("../pages/CourseExperiencesPage.tsx").then((module) => ({
    default: module.CourseExperiencesPage,
  })),
);
const CourseHubPage = lazy(() =>
  import("../pages/CourseHubPage.tsx").then((module) => ({
    default: module.CourseHubPage,
  })),
);
const CourseQuestionsPage = lazy(() =>
  import("../pages/CourseQuestionsPage.tsx").then((module) => ({
    default: module.CourseQuestionsPage,
  })),
);
const CourseResourcesPage = lazy(() =>
  import("../pages/CourseResourcesPage.tsx").then((module) => ({
    default: module.CourseResourcesPage,
  })),
);
const CoursesPage = lazy(() =>
  import("../pages/CoursesPage.tsx").then((module) => ({
    default: module.CoursesPage,
  })),
);
const CourseStudyGroupsPage = lazy(() =>
  import("../pages/CourseStudyGroupsPage.tsx").then((module) => ({
    default: module.CourseStudyGroupsPage,
  })),
);
const CreatePage = lazy(() =>
  import("../pages/CreatePage.tsx").then((module) => ({
    default: module.CreatePage,
  })),
);
const CreateStudyGroupPage = lazy(() =>
  import("../pages/CreateStudyGroupPage.tsx").then((module) => ({
    default: module.CreateStudyGroupPage,
  })),
);
const ExperienceDetailsPage = lazy(() =>
  import("../pages/ExperienceDetailsPage.tsx").then((module) => ({
    default: module.ExperienceDetailsPage,
  })),
);
const HomePage = lazy(() =>
  import("../pages/HomePage.tsx").then((module) => ({
    default: module.HomePage,
  })),
);
const LoginPage = lazy(() =>
  import("../pages/auth/LoginPage.tsx").then((module) => ({
    default: module.LoginPage,
  })),
);
const NotFoundPage = lazy(() =>
  import("../pages/NotFoundPage.tsx").then((module) => ({
    default: module.NotFoundPage,
  })),
);
const ProfilePage = lazy(() =>
  import("../pages/ProfilePage.tsx").then((module) => ({
    default: module.ProfilePage,
  })),
);
const QuestionDetailsPage = lazy(() =>
  import("../pages/QuestionDetailsPage.tsx").then((module) => ({
    default: module.QuestionDetailsPage,
  })),
);
const ResourceDetailsPage = lazy(() =>
  import("../pages/ResourceDetailsPage.tsx").then((module) => ({
    default: module.ResourceDetailsPage,
  })),
);
const SignupPage = lazy(() =>
  import("../pages/auth/SignupPage.tsx").then((module) => ({
    default: module.SignupPage,
  })),
);
const StudyGroupDetailsPage = lazy(() =>
  import("../pages/StudyGroupDetailsPage.tsx").then((module) => ({
    default: module.StudyGroupDetailsPage,
  })),
);

function PageLoadingFallback() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
      Loading page...
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseHubPage />} />
          <Route
            path="/courses/:courseId/questions"
            element={<CourseQuestionsPage />}
          />
          <Route
            path="/courses/:courseId/experiences"
            element={<CourseExperiencesPage />}
          />
          <Route
            path="/courses/:courseId/resources"
            element={<CourseResourcesPage />}
          />
          <Route
            path="/courses/:courseId/study-groups"
            element={<CourseStudyGroupsPage />}
          />
          <Route
            path="/experiences/:experienceId"
            element={<ExperienceDetailsPage />}
          />
          <Route
            path="/resources/:resourceId"
            element={<ResourceDetailsPage />}
          />
          <Route
            path="/study-groups/:groupId"
            element={<StudyGroupDetailsPage />}
          />
          <Route
            path="/questions/:questionId"
            element={<QuestionDetailsPage />}
          />
          <Route element={<ProtectedRoute />}>
            <Route path="/create" element={<CreatePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/courses/:courseId/questions/new"
              element={<AskQuestionPage />}
            />
            <Route
              path="/courses/:courseId/experiences/new"
              element={<AddExperiencePage />}
            />
            <Route
              path="/courses/:courseId/resources/new"
              element={<AddResourcePage />}
            />
            <Route
              path="/courses/:courseId/study-groups/new"
              element={<CreateStudyGroupPage />}
            />
          </Route>
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
