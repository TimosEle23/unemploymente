import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchApplications, fetchProfile } from "./api";

export function useApplications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["applications", user?.id],
    queryFn: fetchApplications,
    enabled: !!user,
  });
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => {
      if (!user) throw new Error("Sign in required");
      return fetchProfile(user.id);
    },
    enabled: !!user,
  });
}
