import AuthContextProvider from "@/components/authentication/AuthContextProvider";
import AuthWebView from "@/components/authentication/AuthWebView";
import { queryClient } from "@/hooks/query";
import { useIsLoggedIn, useLogin, useLogout } from "@/hooks/use-login";
import { LoggedInData } from "@/types/authTypes";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, userEvent } from "@testing-library/react-native";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import React, { ReactNode } from "react";
import { Button, Text, View } from "react-native";
import {
  WebViewMessageEvent,
  WebViewNavigation,
  WebViewProps,
} from "react-native-webview";

const loggedInStoredData: LoggedInData = {
  authToken: "fakeToken",
  firstName: "First name",
  lastNameInitial: "L",
};

jest.mock("expo-secure-store", () => ({
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn(),
}));

// FML
jest.mock("react-native-webview", () => {
  const { View } = require("react-native");
  const { Component }: typeof React = require("react");

  function* navigationValuesGenerator() {
    yield "https://fas.concordia.ca";
    yield "https://hub.concordia.ca/app-sso.html?app=true";
  }

  const navigationValues = navigationValuesGenerator();
  return {
    WebView: (props: WebViewProps) => {
      class MockedView extends Component {
        constructor(props: WebViewProps) {
          super(props);
        }
        render(): ReactNode {
          return (
            <View
              testID="auth-web-view"
              onPress={() => {
                const navigate = props.onNavigationStateChange;
                if (navigate) {
                  navigate({
                    url: navigationValues.next().value,
                  } as WebViewNavigation);
                }
              }}
            ></View>
          );
        }

        injectJavaScript(_: string) {
          const message = props.onMessage;
          if (message) {
            const event: WebViewMessageEvent = {
              nativeEvent: {
                data: `Given-Name=Yes;Surname=N;SSO-Token=token`,
              },
            } as WebViewMessageEvent;
            message(event);
          }
        }
      }

      return <MockedView {...props} />;
    },
  };
});

describe("Auth Context provide logs in correctly", () => {
  it("Should be logged in when the login function is called", async () => {
    function LookAtContext() {
      const { isLoading: logginIn, login } = useLogin();
      const { isLoading: fetchingData, isLoggedIn } = useIsLoggedIn();
      const { isLoading: logginOut, logout } = useLogout();
      if (logginIn || fetchingData || logginOut) {
        return (
          <View>
            <Text>
              Loading... {JSON.stringify({ logginIn, logginOut, fetchingData })}
            </Text>
          </View>
        );
      }
      if (isLoggedIn) {
        return (
          <View>
            <Button title="Logged In" onPress={() => logout()} />
          </View>
        );
      }
      return (
        <View>
          <Button title="Logged Out" onPress={() => login(loggedInStoredData)} />
        </View>
      );
    }

    const loggedOutCalendar = render(
      <AuthContextProvider>
        <QueryClientProvider client={queryClient}>
          <LookAtContext />
        </QueryClientProvider>
      </AuthContextProvider>,
    );

    // we expect to be logged out
    const loggedOutButton = await loggedOutCalendar.findByText("Logged Out");

    // we expect to try to retrieve the data from the store
    expect(getItemAsync as jest.Mock).toHaveBeenCalled();

    await userEvent.press(loggedOutButton);
    // we expect to be logged in
    const loggedInButton = await loggedOutCalendar.findByText("Logged In");
    // we expect that we set the new login to the store
    expect(setItemAsync as jest.Mock).toHaveBeenCalledWith(
      "savedUser",
      JSON.stringify(loggedInStoredData),
    );

    await userEvent.press(loggedInButton);
    // we expect to have deleted the item from the store
    expect(deleteItemAsync as jest.Mock).toHaveBeenCalled();
    // we expect to be logged out
    await loggedOutCalendar.findByText("Logged Out");
  });

  it("Should inject the js and loggin in when navigating to the right page", async () => {
    const mockedLogin = jest.fn();
    const webview = render(<AuthWebView onLogin={mockedLogin} />);
    const clickableWebView = webview.getByTestId("auth-web-view");

    // when pressing I should navigate to the concordia login
    await userEvent.press(clickableWebView);
    // when pressing again I should navigate back to the hub with the right cookies
    await userEvent.press(clickableWebView);

    // when nagivating back to the webview, i should have logged in
    expect(mockedLogin).toHaveBeenCalled();
  });
});
