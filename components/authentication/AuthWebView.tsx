import { useContext, useEffect, useRef } from "react";
import { WebView, WebViewMessageEvent, WebViewNavigation } from "react-native-webview";
import { AuthContext } from "./AuthContextProvider";
import { LoggedInData } from "@/types/authTypes";
import { WebViewErrorEvent } from "react-native-webview/lib/WebViewTypes";

interface AuthWebViewProps {
  onLogin: (data: LoggedInData) => void;
}

export default function AuthWebView({ onLogin }: AuthWebViewProps) {
  const authContext = useContext(AuthContext);
  const visitedAuthScreen = useRef(false);
  const webviewRef = useRef<WebView>(null);

  if (authContext.isLoggedIn) {
    throw new Error("You shouldn't be here when you're already logged in");
  }

  const handleMessage = (event: WebViewMessageEvent) => {
    const cookieString = event.nativeEvent.data;
    console.log(cookieString);
    const data = parseCookies(cookieString);
    authContext.login(data);
    onLogin(data);
  };

  const handleNavigationChange = (event: WebViewNavigation) => {
    console.log(`Navigation changed: ${event.url}`);
    if (event.url === authScreenURL) {
      visitedAuthScreen.current = true;
      return;
    }
    if (!visitedAuthScreen || event.url !== authenticationURL) {
      // I have no idea where you are but you're not in the right spot
      return;
    }

    console.log("Back to main hub page");
    visitedAuthScreen.current = false;
    webviewRef.current?.injectJavaScript(getCookiesJs);
  };

  return (
    <WebView
      ref={webviewRef}
      source={{ uri: authenticationURL }}
      onMessage={handleMessage}
      onNavigationStateChange={handleNavigationChange}
      onError={(event: WebViewErrorEvent) => {
        console.error(event);
      }}
    />
  );
}

function parseCookies(cookieString: string) {
  const cookies: Record<string, string | undefined> = {};

  cookieString.split(";").forEach((cookieSetting) => {
    const values = cookieSetting.trim().split("=");
    const cookieValue = values.at(-1);
    const cookieName = values.at(0);
    if (!cookieName || !cookieValue) {
      console.log(`Couldn't parse a cookie: ${cookieName}, ${cookieValue}`);
      return;
    }
    cookies[cookieName] = cookieValue;
  });

  const givenName = cookies["Given-Name"];
  const surname = cookies["Surname"];
  const token = cookies["SSO-Token"];
  if (!givenName || !surname || !token) {
    console.error({
      givenName,
      surname,
      token,
    });
    throw new Error("Couldn't parse the cookies. Something went wrong");
  }
  const loggedInData: LoggedInData = {
    authToken: token,
    firstName: givenName,
    lastNameInitial: surname,
  };
  return loggedInData;
}

const authenticationURL = "https://hub.concordia.ca/app-sso.html?app=true";
const authScreenURL = "https://fas.concordia.ca";

const getCookiesJs = `
window.ReactNativeWebView.postMessage(document.cookie);
true;
`;
