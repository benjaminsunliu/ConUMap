import { LoggedInData } from "@/types/authTypes";

const loggedinDataKey = "savedUser";

class AuthenticationStore {
  public clearLogin() {
    getLocalStorage()?.removeItem(loggedinDataKey);
    return Promise.resolve();
  }

  public async getLoggedInData() {
    const maybeData = getLocalStorage()?.getItem(loggedinDataKey);
    if (!maybeData) {
      return null;
    }

    try {
      return JSON.parse(maybeData) as LoggedInData;
    } catch {
      getLocalStorage()?.removeItem(loggedinDataKey);
      return null;
    }
  }

  public setLoggedInData(data: LoggedInData) {
    getLocalStorage()?.setItem(loggedinDataKey, JSON.stringify(data));
    return Promise.resolve();
  }
}

function getLocalStorage() {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) {
    return null;
  }

  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export const AuthStore = new AuthenticationStore();
