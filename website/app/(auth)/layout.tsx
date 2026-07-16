import Image from "next/image";
import Link from "next/link";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex flex-col items-center justify-center gap-2"
        >
          <Image
            src="/brand/DandevDark.png"
            alt="DanDev"
            width={1103}
            height={215}
            priority
            className="h-7 w-auto"
          />
          <span className="text-sm font-medium tracking-wide text-muted">
            Billing
          </span>
        </Link>
        <div className="rounded-2xl border border-border bg-surface p-7 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
