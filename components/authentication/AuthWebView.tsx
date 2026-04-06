import { LoggedInData } from "@/types/authTypes";
import { buildLoggedInDataFromCookieString } from "@/utils/authCookies";
import { useRef } from "react";
import { WebView, WebViewMessageEvent, WebViewNavigation } from "react-native-webview";

interface AuthWebViewProps {
  onLogin: (data: LoggedInData) => void;
}

export default function AuthWebView({ onLogin }: Readonly<AuthWebViewProps>) {
  const visitedAuthScreen = useRef(false);
  const webviewRef = useRef<WebView>(null);

  const handleMessage = (event: WebViewMessageEvent) => {
    const cookieString = event.nativeEvent.data;
    if (!cookieString) {
      // on ios we may have to try to the cookies twice
      // because the implementation doesn't load it the first time
      return;
    }
    const data = buildLoggedInDataFromCookieString(cookieString);
    visitedAuthScreen.current = false;
    onLogin(data);
  };

  const handleNavigationChange = (event: WebViewNavigation) => {
    if (event.url.startsWith(authScreenURL)) {
      visitedAuthScreen.current = true;
      return;
    }

    if (!visitedAuthScreen.current || event.url !== authenticationURL) {
      // You aren't in the right spot to get the cookies
      return;
    }
    webviewRef.current?.injectJavaScript(getCookiesJs);
  };

  const handleShouldStartLoad = (event: WebViewNavigation) => {
    const url = event.url;
    return url.startsWith("https://") || url.startsWith("http://");
  };

  return (
    <WebView
      ref={webviewRef}
      source={{ uri: authenticationURL }}
      onMessage={handleMessage}
      onNavigationStateChange={handleNavigationChange}
      incognito={true} // allows us to be able to clear the cookies when the component umounts
      originWhitelist={["https://*", "tp-set-custom-vars://*"]}
      onShouldStartLoadWithRequest={handleShouldStartLoad}
    />
  );
}

const authenticationURL = "https://hub.concordia.ca/app-sso.html?app=true";
const authScreenURL = "https://fas.concordia.ca";

const getCookiesJs = `
window.ReactNativeWebView.postMessage(document.cookie);
true;
`;
