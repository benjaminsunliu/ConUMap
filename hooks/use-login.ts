import { AuthContext } from "@/components/authentication/AuthContextProvider";
import { AuthStore } from "@/globals/AuthenticationStore";
import { LoggedInData } from "@/types/authTypes";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useContext } from "react";

export function useIsLoggedIn() {
  const authContext = useContext(AuthContext);

  const { isLoading, data: isLoggedIn } = useQuery({
    queryKey: ["fetching-login", authContext],
    queryFn: async () => {
      if (authContext.isLoggedIn) {
        return true;
      }
      const maybeData = await AuthStore.getLoggedInData();
      if (!maybeData) {
        return false;
      }
      await authContext.login(maybeData);
      return true;
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return { isLoading, isLoggedIn };
}

export function useLogin() {
  const authContext = useContext(AuthContext);
  const { isPending: isLoading, mutate: login } = useMutation({
    mutationFn: async (data: LoggedInData) => {
      if (!authContext.isLoggedIn) {
        await authContext.login(data);
      }
    },
  });

  return { isLoading, login };
}

export function useLogout() {
  const authContext = useContext(AuthContext);
  const { isPending: isLoading, mutate: logout } = useMutation({
    mutationFn: async () => {
      if (authContext.isLoggedIn) {
        await authContext.logout();
      }
    },
  });
  return { isLoading, logout };
}
