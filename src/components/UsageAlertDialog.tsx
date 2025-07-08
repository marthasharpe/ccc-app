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
  selectedModel: "gpt-3.5-turbo" | "gpt-4";
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
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4">
          {userStatus?.isAuthenticated ? (
            <div>
              <p className="font-medium mb-2">You can:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  Try a shorter question to use less of your daily limit
                </li>
                {selectedModel === "gpt-4" && (
                  <li>
                    Switch to GPT-3.5 which uses less of your daily limit per
                    response
                  </li>
                )}
                <li>Browse and search the Catechism (no usage limit)</li>
                <li>Wait until tomorrow for your usage to reset</li>
                <li>
                  <Link href="/plans" className="text-primary hover:underline">
                    View paid plans for unlimited usage
                  </Link>
                </li>
              </ul>
            </div>
          ) : (
            <>
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
                <p className="text-sm font-medium text-primary">
                  💡 Sign in to get 2x more usage!
                </p>
                <p className="text-xs text-primary/80 mt-1">
                  Free accounts have limited usage → Signed in: Enhanced daily
                  limit
                </p>
              </div>
              <div>
                <p className="font-medium mb-2">You can:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {selectedModel === "gpt-4" && (
                    <li>
                      Switch to GPT-3.5 which uses less of your daily limit per
                      response
                    </li>
                  )}
                  <li>Browse and search the Catechism (no usage limit)</li>
                  <li>
                    <strong>Sign in to get 2x more daily usage!</strong>
                  </li>
                  <li>Wait until tomorrow for your usage to reset</li>
                  <li>
                    <Link href="/plans" className="text-primary hover:underline">
                      View paid plans for unlimited usage
                    </Link>
                  </li>
                </ul>
              </div>
            </>
          )}
          <div className="p-2 bg-muted rounded text-sm">
            <p>
              <strong>Usage remaining:</strong> {100 - usagePercentage}%
            </p>
            <p>
              <strong>Estimated needed:</strong> ~
              {Math.round(
                calculateCost(estimatedTokensForRequest, selectedModel) * 100
              ) / 100}
              %
            </p>
          </div>
        </div>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
          {!userStatus?.isAuthenticated && (
            <AlertDialogAction asChild>
              <Link href="/auth/login">Sign In for More Usage</Link>
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
