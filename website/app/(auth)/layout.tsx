import Image from "next/image";
import Link from "next/link";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center">
          <Image
            src="/brand/DavdevSolutionsDark.png"
            alt="DanDev Solutions"
            width={1343}
            height={268}
            priority
            className="h-9 w-auto"
          />
        </Link>
        <div className="rounded-2xl border border-border bg-surface p-7 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
