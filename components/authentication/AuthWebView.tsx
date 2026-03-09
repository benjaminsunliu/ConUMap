import { LoggedInData } from "@/types/authTypes";
import { useRef } from "react";
import { Platform } from "react-native";
import { WebView, WebViewMessageEvent, WebViewNavigation } from "react-native-webview";
import { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";

interface AuthWebViewProps {
  onLogin: (data: LoggedInData) => void;
}

export default function AuthWebView({ onLogin }: Readonly<AuthWebViewProps>) {
  const navigationState = useRef(NavigationState.LoggedOutHub);
  const webviewRef = useRef<WebView>(null);

  const handleMessage = (event: WebViewMessageEvent) => {
    console.log("Got a new message from javascript");
    const cookieString = event.nativeEvent.data;
    console.log(cookieString);
    // navigationState.current = NavigationState.LoggedOutHub;
    // const data = parseCookies(cookieString);
    // onLogin(data);
  };

  const handleNavigationChange = (event: WebViewNavigation) => {
    console.log(`navigation changed: ${event.url}`);
    webviewRef.current?.injectJavaScript(getCookiesJs);

    if (event.url.startsWith(authScreenURL)) {
      console.log("Visiting the auth screen");
      navigationState.current = NavigationState.LoggingInHub;
      return;
    }

    if(event.url.start)

    if(!event.url.startsWith(authenticationURL)) {
      // you're not in the right spot
      console.log("You're not in the right spot");
      return;
    }

    // if (navigationState.current === NavigationState.LoggedInHub) {
    //   navigationState.current = NavigationState.GettingCookie
    //   return;
    // }

    // navigationState.current = NavigationState.LoggedInHub;


    // if(navigationState.current === NavigationState.LoggingInHub && Platform.OS === "ios") {
    //   // We are navigating for the first time to the hub, wait for the refresh
    //   // only happens on ios
    //   navigationState.current = NavigationState.GettingCookie;
    //   return;
    // }
    
    // if(navigationState.current === NavigationState.GettingCookie) {
    //   console.log("Trying to inject javascript");
    //   webviewRef.current?.injectJavaScript(getCookiesJs);
    //   navigationState.current = NavigationState.LoggedInHub;
    //   return;
    // }
  };

  const shouldStartLoading = (request: ShouldStartLoadRequest) => {
    console.log(request.url)
    return navigationState.current !== NavigationState.LoggedInHub;
  }

  return (
    <WebView
      ref={webviewRef}
      source={{ uri: authenticationURL }}
      onMessage={handleMessage}
      onNavigationStateChange={handleNavigationChange}
      incognito={true} // think twice before setting this to false
      sharedCookiesEnabled={true}
      // cacheEnabled={false}
      // onShouldStartLoadWithRequest={shouldStartLoading}
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

const authenticationURL = "https://hub.concordia.ca/";
const authScreenURL = "https://fas.concordia.ca";

const getCookiesJs = `
window.ReactNativeWebView.postMessage(document.cookie);
true;
`;

enum NavigationState {
  LoggedOutHub,
  LoggingInHub,
  GettingCookie,
  LoggedInHub
}
