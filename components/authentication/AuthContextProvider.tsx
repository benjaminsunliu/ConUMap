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
  login: () => {},
};

export const AuthContext = createContext<AuthContextData>(defaultContext);

export default function AuthContextProvider({ children }: PropsWithChildren) {
  const [loginData, setLoginData] = useState<LoggedInData | null>(null);

  const loginFunction = (data: LoggedInData) => setLoginData(data);
  const logoutFunction = () => setLoginData(null);

  const logoutValue: LoggedOutContext = {
    isLoggedIn: false,
    data: null,
    login: loginFunction,
  };

  const logginValue: LoggedInContext | null = !loginData
    ? null
    : {
        isLoggedIn: true,
        data: loginData,
        logout: logoutFunction,
      };

  return <AuthContext value={logginValue || logoutValue}>{children}</AuthContext>;
}
