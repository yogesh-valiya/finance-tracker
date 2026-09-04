"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NetWorthSummary, ComputedAccount } from "@/lib/services/balance";
import { AccountGroup } from "@prisma/client";
import { ACCOUNT_GROUPS_META } from "@/components/accounts/account-group-meta";
import { AccountCreateDialog } from "@/components/accounts/account-create-dialog";
import { AccountReorderDialog } from "@/components/accounts/account-reorder-dialog";
import { AccountVisibilityDialog } from "@/components/accounts/account-visibility-dialog";
import { NetWorthChartsDialog } from "@/components/accounts/net-worth-charts-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Wallet,
  Plus,
  MoreVertical,
  ChevronDown,
  ArrowUpDown,
  Eye,
  Settings2,
  AlertCircle,
  BarChart3,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AccountsPage() {
  const router = useRouter();
  const [data, setData] = React.useState<NetWorthSummary | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // Dialog states
  const [createOpen, setCreateOpen] = React.useState(false);
  const [reorderOpen, setReorderOpen] = React.useState(false);
  const [visibilityOpen, setVisibilityOpen] = React.useState(false);
  const [netWorthOpen, setNetWorthOpen] = React.useState(false);

  // Collapsed group state (all open by default)
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});

  const fetchAccounts = React.useCallback(async () => {
    try {
      setError("");
      const res = await fetch("/api/accounts");
      if (!res.ok) {
        throw new Error("Failed to load accounts");
      }
      const json: NetWorthSummary = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  function toggleGroupCollapse(group: string) {
    setCollapsedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  }

  const formatCurrency = (val?: number | null) => {
    const safeVal = typeof val === "number" && !isNaN(val) ? val : 0;
    const isNegative = safeVal < 0;
    const formatted = Math.abs(safeVal).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${isNegative ? "-" : ""}₹${formatted}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Calculating balances & net worth...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center">
        <AlertCircle className="size-10 text-destructive" />
        <h2 className="text-lg font-semibold">Unable to load accounts</h2>
        <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
        <Button onClick={() => fetchAccounts()} variant="outline" className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  const groupsWithAccounts = (Object.keys(data.accountsByGroup) as AccountGroup[]).filter(
    (g) => data.accountsByGroup[g]?.length > 0
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wallet className="size-6 text-primary" />
            Accounts & Net Worth
          </h1>
          <p className="text-sm text-muted-foreground">
            Dynamic balance aggregation across 11 classification groups
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setNetWorthOpen(true)}
            className="size-9"
            title="Net Worth Analytics"
          >
            <BarChart3 className="size-4 text-primary" />
          </Button>

          <Button size="sm" onClick={() => setCreateOpen(true)} className="h-9">
            <Plus className="size-4 mr-1.5" data-icon="inline-start" />
            Add Account
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                "size-9 cursor-pointer"
              )}
              title="More actions"
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setCreateOpen(true)} className="cursor-pointer">
                <Plus className="size-4 mr-2" data-icon="inline-start" />
                Add Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setReorderOpen(true)} className="cursor-pointer">
                <ArrowUpDown className="size-4 mr-2" data-icon="inline-start" />
                Modify Orders
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setVisibilityOpen(true)} className="cursor-pointer">
                <Eye className="size-4 mr-2" data-icon="inline-start" />
                Show / Hide Accounts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Net Worth Summary Strip (§8.1) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Total Assets
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-income tabular-nums">
              {formatCurrency(data.totalAssets)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-[11px] text-muted-foreground">
              Liquid funds, investments & savings
            </span>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Total Liabilities
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-liability tabular-nums">
              {formatCurrency(data.totalLiabilities)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-[11px] text-muted-foreground">
              Credit cards, loans & overdrafts
            </span>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Net Worth
            </CardDescription>
            <CardTitle
              className={cn(
                "text-2xl font-bold tabular-nums",
                data.netWorth >= 0 ? "text-foreground" : "text-expense"
              )}
            >
              {formatCurrency(data.netWorth)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-[11px] text-muted-foreground">
              Total Assets − Total Liabilities
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Grouped Accounts Accordion Sections */}
      <div className="flex flex-col gap-4">
        {groupsWithAccounts.length === 0 ? (
          <Card className="border-dashed p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <Wallet className="size-10 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <h3 className="font-semibold text-foreground">No accounts found</h3>
                <p className="text-sm text-muted-foreground">
                  Get started by creating your first account.
                </p>
              </div>
              <Button onClick={() => setCreateOpen(true)} className="mt-2">
                <Plus className="size-4 mr-1.5" data-icon="inline-start" />
                Add Account
              </Button>
            </div>
          </Card>
        ) : (
          groupsWithAccounts.map((groupKey) => {
            const meta = ACCOUNT_GROUPS_META[groupKey];
            if (!meta) return null;
            const accounts = data.accountsByGroup[groupKey] || [];
            const Icon = meta.icon || Wallet;
            const isCollapsed = collapsedGroups[groupKey] ?? false;

            // Calculate group subtotal
            const groupSum = accounts.reduce((sum, acc) => {
              return acc.includeInTotals ? sum + (acc.currentBalance ?? 0) : sum;
            }, 0);

            return (
              <Collapsible
                key={groupKey}
                open={!isCollapsed}
                onOpenChange={() => toggleGroupCollapse(groupKey)}
                className="border border-border rounded-xl bg-card overflow-hidden"
              >
                <div className="flex items-center justify-between p-3.5 bg-muted/20 border-b border-border select-none">
                  <CollapsibleTrigger className="flex items-center gap-2.5 text-left flex-1 cursor-pointer">
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <span className="font-semibold text-sm text-foreground">
                      {meta.label}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      {accounts.length}
                    </Badge>
                  </CollapsibleTrigger>

                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "text-xs font-semibold tabular-nums",
                        meta.isLiability ? "text-liability" : "text-foreground"
                      )}
                    >
                      {formatCurrency(groupSum)}
                    </span>
                    <CollapsibleTrigger className="cursor-pointer text-muted-foreground hover:text-foreground">
                      <ChevronDown
                        className={cn(
                          "size-4 transition-transform duration-200",
                          isCollapsed && "-rotate-90"
                        )}
                      />
                    </CollapsibleTrigger>
                  </div>
                </div>

                <CollapsibleContent className="divide-y divide-border/60">
                  {accounts.map((account) => {
                    const isLoan = account.group === "LOAN";
                    const isCreditCard = account.group === "CREDIT_CARD";

                    return (
                      <div
                        key={account.id}
                        className={cn(
                          "flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors group",
                          account.isHidden && "opacity-50"
                        )}
                      >
                        {/* Account Left info */}
                        <Link
                          href={`/accounts/${account.id}`}
                          className="flex flex-col flex-1 min-w-0 pr-3 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground truncate">
                              {account.name}
                            </span>
                            {!account.includeInTotals && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 h-3.5 text-muted-foreground"
                              >
                                Excluded
                              </Badge>
                            )}
                            {account.isHidden && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 h-3.5 text-muted-foreground"
                              >
                                Hidden
                              </Badge>
                            )}
                          </div>
                          {account.description && (
                            <span className="text-[11px] text-muted-foreground truncate">
                              {account.description}
                            </span>
                          )}
                        </Link>

                        {/* Balances & Info Link */}
                        <div className="flex items-center gap-3 shrink-0">
                          {isCreditCard ? (
                            <div className="flex flex-col items-end text-right">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-muted-foreground uppercase">
                                  Payable:
                                </span>
                                <span className="text-xs font-semibold tabular-nums text-liability">
                                  {formatCurrency(account.balancePayable || 0)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-muted-foreground uppercase">
                                  Total:
                                </span>
                                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                                  {formatCurrency(account.outstandingBalance || 0)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span
                              className={cn(
                                "text-sm font-semibold tabular-nums",
                                isLoan ? "text-expense" : "text-foreground"
                              )}
                            >
                              {formatCurrency(account.currentBalance)}
                            </span>
                          )}

                          <Link
                            href={`/accounts/${account.id}/info`}
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "icon-xs" }),
                              "size-7 text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100"
                            )}
                            title="Account Info & Configuration"
                          >
                            <Settings2 className="size-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })
        )}
      </div>

      {/* Account Management Modals */}
      <AccountCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchAccounts}
      />

      <AccountReorderDialog
        open={reorderOpen}
        onOpenChange={setReorderOpen}
        accountsByGroup={data.accountsByGroup}
        onSuccess={fetchAccounts}
      />

      <AccountVisibilityDialog
        open={visibilityOpen}
        onOpenChange={setVisibilityOpen}
        accountsByGroup={data.accountsByGroup}
        onSuccess={fetchAccounts}
      />

      <NetWorthChartsDialog
        open={netWorthOpen}
        onOpenChange={setNetWorthOpen}
      />
    </div>
  );
}
