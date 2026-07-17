import { FileQuestion } from "lucide-react";
import { Card, ButtonLink } from "@components/ui";

const NotFound = () => (
  <div className="flex min-h-[60dvh] items-center justify-center px-4">
    <Card className="w-full max-w-md p-7 text-center">
      <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border border-glass-border bg-white/[0.06] text-muted-foreground">
        <FileQuestion className="size-6" />
      </span>
      <h1 className="font-heading text-lg font-bold text-foreground">
        Page not found
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        That link doesn&apos;t point anywhere — it may have been moved or
        deleted.
      </p>
      <div className="mt-6 flex justify-center">
        <ButtonLink href="/dashboard">Go to dashboard</ButtonLink>
      </div>
    </Card>
  </div>
);

export default NotFound;
