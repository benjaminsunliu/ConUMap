import { LoggedInData } from "@/types/authTypes";
import * as SecureStore from "expo-secure-store";

const loggedinDataKey = "savedUser";

class AuthenticationStore {
  public clearLogin() {
    return SecureStore.deleteItemAsync(loggedinDataKey);
  }

  public async getLoggedInData() {
    const maybeData = await SecureStore.getItemAsync(loggedinDataKey);
    if (!maybeData) {
      return null;
    }
    return JSON.parse(maybeData) as LoggedInData;
  }

  public setLoggedInData(data: LoggedInData) {
    const text = JSON.stringify(data);
    return SecureStore.setItemAsync(loggedinDataKey, text);
  }
}

export const AuthStore = new AuthenticationStore();
