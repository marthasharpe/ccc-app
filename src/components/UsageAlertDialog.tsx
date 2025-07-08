"use client";

import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { calculateCost } from "@/lib/usageTracking";

interface UsageAlertDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userStatus: {
    isAuthenticated: boolean;
    usagePercentage: number;
  } | null;
  selectedModel: "gpt-4" | "gpt-3.5-turbo";
  estimatedTokensForRequest: number;
  usagePercentage: number;
  onSwitchToGPT35: () => void;
}

export function UsageAlertDialog({
  isOpen,
  onOpenChange,
  userStatus,
  selectedModel,
  estimatedTokensForRequest,
  usagePercentage,
  onSwitchToGPT35,
}: UsageAlertDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Daily Usage Limit Reached</AlertDialogTitle>
          <AlertDialogDescription>
            This request would exceed your daily usage limit.
            <br />
            <br />
            {userStatus?.isAuthenticated ? (
              <>
                <strong>You can:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>
                    Try a shorter question to use less of your daily limit
                  </li>
                  <li>
                    Switch to GPT-3.5 which uses less of your daily limit per
                    response
                  </li>
                  <li>Browse and search the Catechism (no usage limit)</li>
                  <li>Wait until tomorrow for your usage to reset</li>
                </ul>
              </>
            ) : (
              <>
                <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-md">
                  <p className="text-sm font-medium text-primary">
                    💡 Sign in to get 2x more usage!
                  </p>
                  <p className="text-xs text-primary/80 mt-1">
                    Free accounts have limited usage → Signed in: Enhanced
                    daily limit
                  </p>
                </div>
                <strong>You can:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>
                    Try a shorter question to use less of your daily limit
                  </li>
                  <li>
                    Switch to GPT-3.5 which uses less of your daily limit per
                    response
                  </li>
                  <li>Browse and search the Catechism (no usage limit)</li>
                  <li>
                    <strong>Sign in to get 2x more daily usage!</strong>
                  </li>
                  <li>Wait until tomorrow for your usage to reset</li>
                </ul>
              </>
            )}
            <div className="mt-3 p-2 bg-muted rounded text-sm">
              <strong>Usage remaining:</strong> {100 - usagePercentage}%
              <br />
              <strong>Estimated needed:</strong> ~
              {Math.round(
                calculateCost(estimatedTokensForRequest, selectedModel) * 100
              ) / 100}
              %
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
          {!userStatus?.isAuthenticated && (
            <AlertDialogAction asChild>
              <Link
                href="/auth/login"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Sign In for More Usage
              </Link>
            </AlertDialogAction>
          )}
          {selectedModel === "gpt-4" && (
            <AlertDialogAction
              onClick={onSwitchToGPT35}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Switch to GPT-3.5
            </AlertDialogAction>
          )}
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            I understand
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}