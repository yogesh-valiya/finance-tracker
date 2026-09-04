"use client";

import * as React from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

function CategoryRedirectContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const categoryId = params.categoryId as string;

  React.useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (categoryId) {
      nextParams.set("category", categoryId);
    }
    router.replace(`/stats?${nextParams.toString()}`);
  }, [router, categoryId, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-xs text-muted-foreground">Loading category analytics...</p>
    </div>
  );
}

export default function CategoryDeepDivePage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <CategoryRedirectContent />
    </React.Suspense>
  );
}
