"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, CheckCircle, AlertCircle } from "lucide-react";
import { joinGroup, cleanJoinCode } from "@/lib/groupPlanUtils";

interface GroupPlanDialogProps {
  trigger: React.ReactNode;
}

export function GroupPlanDialog({
  trigger,
}: GroupPlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!joinCode.trim()) {
      setError("Please enter a join code");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const cleanedCode = cleanJoinCode(joinCode);
      const response = await joinGroup({ join_code: cleanedCode });

      if (response.success) {
        setSuccess("Successfully joined the group!");
        setTimeout(() => {
          setOpen(false);
          router.push("/account");
        }, 1500);
      } else {
        setError(response.error || "Failed to join group");
      }
    } catch (err) {
      setError("Failed to join group");
      console.error("Error joining group:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCodeChange = (value: string) => {
    // Auto-format as user types (add dash after 4 characters)
    const cleaned = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (cleaned.length <= 8) {
      const formatted =
        cleaned.length > 4
          ? `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`
          : cleaned;
      setJoinCode(formatted);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setJoinCode("");
      setError(null);
      setSuccess(null);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-md mx-4 sm:mx-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Join Existing Plan
          </AlertDialogTitle>
          <AlertDialogDescription>
            Enter the join code provided by the group owner to join their plan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleJoinGroup} className="space-y-4">
          <div>
            <label
              htmlFor="joinCode"
              className="block text-sm font-medium mb-2"
            >
              Join Code
            </label>
            <Input
              id="joinCode"
              type="text"
              placeholder="XXXX-XXXX"
              value={joinCode}
              onChange={(e) => handleJoinCodeChange(e.target.value)}
              className="font-mono text-center"
              maxLength={9} // 8 characters + 1 dash
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the 8-character code (e.g., ABCD-1234)
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !joinCode.trim()}
            >
              {loading ? "Joining..." : "Join Plan"}
            </Button>
          </div>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
