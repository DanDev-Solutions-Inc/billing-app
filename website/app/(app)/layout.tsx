import { getUserOrRedirect } from "@lib/dal";
import { Sidebar } from "@components/nav/sidebar";

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getUserOrRedirect();

  return (
    <div className="flex min-h-dvh">
      <div className="sticky top-0 hidden h-dvh md:block">
        <Sidebar email={user.email ?? ""} />
      </div>
      <main className="min-w-0 flex-1 px-5 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
};

export default AppLayout;
