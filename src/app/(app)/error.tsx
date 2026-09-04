"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="max-w-md w-full border-border text-center shadow-md">
        <CardHeader className="pb-3 flex flex-col items-center gap-2">
          <div className="p-3 rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-8" />
          </div>
          <CardTitle className="text-lg font-semibold">Something went wrong</CardTitle>
          <CardDescription className="text-xs text-muted-foreground max-w-xs">
            An unexpected error occurred while loading this page.
          </CardDescription>
        </CardHeader>

        {error.message && (
          <CardContent className="pt-0 pb-3">
            <div className="rounded-md bg-muted/40 p-2.5 text-left text-xs font-mono text-muted-foreground break-words max-h-32 overflow-y-auto border border-border/60">
              {error.message}
            </div>
          </CardContent>
        )}

        <CardFooter className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => reset()}
            className="gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            Try Again
          </Button>

          <Link
            href="/transactions"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <Home className="size-3.5" />
            Transactions
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
