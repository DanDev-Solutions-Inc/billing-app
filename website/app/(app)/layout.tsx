import { getUserOrRedirect } from "@lib/dal";
import { Sidebar } from "@components/nav/sidebar";
import { MobileNav } from "@components/nav/mobile-nav";

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getUserOrRedirect();
  const email = user.email ?? "";

  return (
    <div className="flex min-h-dvh">
      <div className="sticky top-0 hidden h-dvh md:block">
        <Sidebar email={email} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav email={email} />
        <main className="flex-1 px-4 py-5 sm:px-5 md:px-8 md:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
