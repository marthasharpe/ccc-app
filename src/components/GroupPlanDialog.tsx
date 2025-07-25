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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, Crown, CheckCircle, AlertCircle } from "lucide-react";
import { joinGroup, cleanJoinCode } from "@/lib/groupPlanUtils";

interface GroupPlanDialogProps {
  planType: "small" | "large";
  planName: string;
  maxMembers: number;
  trigger: React.ReactNode;
}

export function GroupPlanDialog({
  planName,
  maxMembers,
  trigger,
}: GroupPlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"join" | "create">("join");
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
          router.push("/groups");
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

  const handleCreateGroup = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Start Stripe checkout for group plan
      const response = await fetch("/api/billing/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planName: planName }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        setError(
          data.error || "Failed to create checkout session. Please try again."
        );
      }
    } catch (err) {
      setError("Failed to start checkout");
      console.error("Error creating checkout session:", err);
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
      setActiveTab("join");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {planName} Plan
          </AlertDialogTitle>
          <AlertDialogDescription>
            Choose how you&apos;d like to get started with your{" "}
            {planName.toLowerCase()} plan (up to {maxMembers} members).
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "join" | "create")}
        >
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger
              value="join"
              className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Join Existing Group</span>
              <span className="sm:hidden">Join</span>
            </TabsTrigger>
            <TabsTrigger
              value="create"
              className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <Crown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Create New Group</span>
              <span className="sm:hidden">Create</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-3 sm:mt-4">
            <TabsContent value="join" className="space-y-3 sm:space-y-4 mt-0">
              <form onSubmit={handleJoinGroup} className="space-y-3">
                <div>
                  <label
                    htmlFor="joinCode"
                    className="block text-sm font-medium mb-1"
                  >
                    Join Code
                  </label>
                  <Input
                    id="joinCode"
                    type="text"
                    placeholder="XXXX-XXXX"
                    value={joinCode}
                    onChange={(e) => handleJoinCodeChange(e.target.value)}
                    className="font-mono text-center text-base sm:text-sm"
                    maxLength={9} // 8 characters + 1 dash
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the 8-character code provided by the group owner
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

                <Button
                  type="submit"
                  className="w-full h-10 sm:h-9"
                  disabled={loading || !joinCode.trim()}
                >
                  {loading ? "Joining..." : "Join Group"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <div>
                <p className="text-md mb-4">
                  This will start the checkout process for your{" "}
                  {planName.toLowerCase()} plan. After payment, you will receive
                  a shareable code to invite others to join your group.
                </p>

                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm mb-3">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 text-green-600 text-sm mb-3">
                    <CheckCircle className="h-4 w-4" />
                    <span>{success}</span>
                  </div>
                )}

                <Button
                  onClick={handleCreateGroup}
                  className="w-full h-10 sm:h-9"
                  disabled={loading}
                >
                  {loading ? "Processing..." : `Create ${planName} Plan`}
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end pt-3 sm:pt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="h-10 sm:h-9"
          >
            Cancel
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
