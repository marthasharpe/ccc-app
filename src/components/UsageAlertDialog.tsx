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

interface UsageAlertDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userStatus: {
    isAuthenticated: boolean;
    usagePercentage: number;
  } | null;
}

export function UsageAlertDialog({
  isOpen,
  onOpenChange,
  userStatus,
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
          <div>
            <p className="font-medium mb-2">You can:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Browse and search the Catechism (no usage limit)</li>
              {!userStatus?.isAuthenticated && (
                <li>
                  <strong>Login to get more usage</strong>
                </li>
              )}
              <li>Wait until tomorrow for your usage to reset</li>
              <li>View paid study options for unlimited usage</li>
            </ul>
          </div>
        </div>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
          {!userStatus?.isAuthenticated ? (
            <AlertDialogAction asChild>
              <Link href="/auth/login">Login</Link>
            </AlertDialogAction>
          ) : (
            <AlertDialogAction asChild>
              <Link href="/optionss">Get Unlimited Usage</Link>
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
