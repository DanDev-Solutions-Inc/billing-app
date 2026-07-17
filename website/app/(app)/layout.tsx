import { Suspense } from "react";
import { requireAppAccess } from "@lib/dal";
import { Sidebar } from "@components/nav/sidebar";
import { MobileNav } from "@components/nav/mobile-nav";
import { ToastProvider } from "@components/ui/toast";
import { ToastFlash } from "@components/ui/toast-flash";

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  // Gate the whole app shell on access, not just a session — a removed member
  // still has an account. Every (app) page renders through here.
  const user = await requireAppAccess();
  const email = user.email ?? "";

  return (
    <ToastProvider>
      {/* Reads ?toast= — useSearchParams needs a Suspense boundary. */}
      <Suspense fallback={null}>
        <ToastFlash />
      </Suspense>
      <div className="flex min-h-dvh">
        <div className="sticky top-0 hidden h-dvh md:block">
          <Sidebar email={email} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav email={email} />
          <main className="flex-1 px-4 py-5 sm:px-5 md:px-8 md:py-8">
            <div className="mx-auto w-full max-w-[1600px]">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};

export default AppLayout;
