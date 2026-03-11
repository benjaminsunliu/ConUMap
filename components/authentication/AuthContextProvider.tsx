import { AuthStore } from "@/globals/AuthenticationStore";
import {
  AuthContextData,
  LoggedInContext,
  LoggedInData,
  LoggedOutContext,
} from "@/types/authTypes";
import { createContext, PropsWithChildren, useCallback, useMemo, useState } from "react";

const defaultContext: AuthContextData = {
  isLoggedIn: false,
  data: null,
  login: () => new Promise((resolve) => resolve()),
};

export const AuthContext = createContext<AuthContextData>(defaultContext);

export default function AuthContextProvider({ children }: Readonly<PropsWithChildren>) {
  const [loginData, setLoginData] = useState<LoggedInData | null>(null);

  const loginFunction = useCallback(async (data: LoggedInData) => {
    await AuthStore.setLoggedInData(data);
    setLoginData(data);
  }, []);

  const logoutFunction = useCallback(async () => {
    await AuthStore.clearLogin();
    setLoginData(null);
  }, []);

  const logoutValue: LoggedOutContext = useMemo(
    () => ({
      isLoggedIn: false,
      data: null,
      login: loginFunction,
    }),
    [loginFunction],
  );

  const logginValue: LoggedInContext | null = useMemo(
    () =>
      loginData
        ? {
            isLoggedIn: true,
            data: loginData,
            logout: logoutFunction,
          }
        : null,
    [loginData, logoutFunction],
  );

  return <AuthContext value={logginValue || logoutValue}>{children}</AuthContext>;
}
