import { LoggedInData } from "@/types/authTypes";

export function parseCookieString(cookieString: string) {
  const cookies: Record<string, string> = {};

  cookieString.split(";").forEach((cookieSetting) => {
    const trimmedSetting = cookieSetting.trim();
    if (!trimmedSetting) {
      return;
    }

    const separatorIndex = trimmedSetting.indexOf("=");
    if (separatorIndex < 0) {
      return;
    }

    const cookieName = trimmedSetting.slice(0, separatorIndex).trim();
    const cookieValue = trimmedSetting.slice(separatorIndex + 1).trim();

    if (!cookieName || !cookieValue) {
      return;
    }

    cookies[cookieName] = safeDecodeURIComponent(cookieValue);
  });

  return cookies;
}

export function buildLoggedInDataFromCookieString(cookieString: string): LoggedInData {
  const cookies = parseCookieString(cookieString);
  const givenName = cookies["Given-Name"];
  const surname = cookies["Surname"];
  const token = cookies["SSO-Token"];

  if (!givenName || !surname || !token) {
    console.error({
      givenName: !!givenName,
      surname: !!surname,
      token: !!token,
    });
    throw new Error("Couldn't parse the cookies. Something went wrong");
  }

  return {
    authToken: token,
    firstName: givenName,
    lastNameInitial: surname,
  };
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
