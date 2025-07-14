import { UserResponsesSearch } from "@/components/UserResponsesSearch";

export default function SavedResponsesPage() {
  return (
    <div className="container mx-auto py-8">
      <UserResponsesSearch />
    </div>
  );
}

export const metadata = {
  title: "Saved Responses - Truth Me Up",
  description: "Search and browse your saved AI responses",
};