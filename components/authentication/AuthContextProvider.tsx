import { AuthStore } from "@/globals/AuthenticationStore";
import {
  AuthContextData,
  LoggedInContext,
  LoggedInData,
  LoggedOutContext,
} from "@/types/authTypes";
import { createContext, PropsWithChildren, useState } from "react";

const defaultContext: AuthContextData = {
  isLoggedIn: false,
  data: null,
  login: () => new Promise((resolve) => resolve()),
};

export const AuthContext = createContext<AuthContextData>(defaultContext);

export default function AuthContextProvider({ children }: PropsWithChildren) {
  const [loginData, setLoginData] = useState<LoggedInData | null>(null);

  const loginFunction = async (data: LoggedInData) => {
    await AuthStore.setLoggedInData(data);
    setLoginData(data);
  };

  const logoutFunction = async () => {
    await AuthStore.clearLogin();
    setLoginData(null);
  };

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
