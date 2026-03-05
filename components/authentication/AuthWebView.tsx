import { LoggedInData } from "@/types/authTypes";
import { useRef } from "react";
import { WebView, WebViewMessageEvent, WebViewNavigation } from "react-native-webview";
import { WebViewErrorEvent } from "react-native-webview/lib/WebViewTypes";

interface AuthWebViewProps {
  onLogin: (data: LoggedInData) => void;
}

export default function AuthWebView({ onLogin }: AuthWebViewProps) {
  const visitedAuthScreen = useRef(false);
  const webviewRef = useRef<WebView>(null);

  const handleMessage = (event: WebViewMessageEvent) => {
    const cookieString = event.nativeEvent.data;
    const data = parseCookies(cookieString);
    onLogin(data);
  };

  const handleNavigationChange = (event: WebViewNavigation) => {
    if (event.url.startsWith(authScreenURL)) {
      visitedAuthScreen.current = true;
      return;
    }
    if (!visitedAuthScreen.current || event.url !== authenticationURL) {
      // I have no idea where you are but you're not in the right spot
      return;
    }

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
      incognito={true} // think twice before setting this to false
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
      console.warn(`Couldn't parse a cookie: ${cookieName}, ${cookieValue}`);
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
