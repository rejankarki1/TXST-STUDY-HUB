import { Outlet } from "react-router";

import { AppFooter } from "@/components/layout/AppFooter";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageContainer } from "@/components/layout/PageContainer";

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-950">
      <AppHeader />
      <PageContainer>
        <Outlet />
      </PageContainer>
      <AppFooter />
    </div>
  );
}
