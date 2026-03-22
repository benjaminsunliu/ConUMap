import CalendarScreen from "@/app/(tabs)/calendar";
import { AuthContext } from "@/components/authentication/AuthContextProvider";
import { ClassSchedule } from "@/hooks/use-calendar";
import { LoggedInContext, LoggedOutContext } from "@/types/authTypes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { notifyManager } from "@tanstack/query-core";
import { act, render } from "@testing-library/react-native";
import React from "react";

jest.mock("expo-secure-store", () => {
  return {
    deleteItemAsync: jest.fn(),
    getItemAsync: jest.fn().mockResolvedValue(null),
    setItemAsync: jest.fn(),
  };
});

jest.mock("react-native-webview", () => {
  const { View } = require("react-native");
  return { WebView: () => <View testID="auth-web-view"></View> };
});

describe("Calendar View", () => {
  const originalFetch = globalThis.fetch;
  let testQueryClient: QueryClient;

  beforeAll(() => {
    notifyManager.setNotifyFunction((callback) => {
      act(callback);
    });
  });

  beforeEach(() => {
    testQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    testQueryClient.clear();
  });

  afterAll(() => {
    notifyManager.setNotifyFunction((callback) => {
      callback();
    });
  });

  it("Should not render courses when logged out and render the webview", async () => {
    const calendarView = render(
      <AuthContext value={loggedOutContext}>
        <QueryClientProvider client={testQueryClient}>
          <CalendarScreen />
        </QueryClientProvider>
      </AuthContext>,
    );
    const webView = await calendarView.findByTestId("auth-web-view");
    expect(webView).toBeVisible();
    const coursesView = calendarView.queryByTestId("courses-view");
    expect(coursesView).toBeNull();
  });

  it("Should render the courses when logged in and not the web view", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      text: jest.fn().mockResolvedValue(`'${JSON.stringify(calendarFetchValue)}'`),
    });
    const calendarView = render(
      <AuthContext value={loggedInContext}>
        <QueryClientProvider client={testQueryClient}>
          <CalendarScreen />
        </QueryClientProvider>
      </AuthContext>,
    );
    const coursesView = await calendarView.findByTestId("courses-view");
    expect(coursesView).toBeVisible();
    const webView = calendarView.queryByTestId("auth-web-view");
    expect(webView).toBeNull();
  });
});

const loggedOutContext: LoggedOutContext = {
  isLoggedIn: false,
  data: null,
  login: () => new Promise((r) => r()),
};

const loggedInContext: LoggedInContext = {
  isLoggedIn: true,
  data: {
    authToken: "fake token",
    firstName: "First name",
    lastNameInitial: "L",
  },
  logout: () => new Promise((r) => r()),
};

const calendarFetchValue: ClassSchedule = {
  STRM: "",
  SUBJECT: "",
  CATALOG_NBR: "",
  SSR_COMPONENT: "",
  XLATLONGNAME: "",
  CLASS_SECTION: "",
  DAY_OF_WEEK: "",
  START_HOURS: "",
  START_MINUTES: "",
  END_HOURS: "",
  END_MINUTES: "",
  CU_BLDG: "",
  CU_BUILDING: "",
  ROOM: "",
  INSTRUCTION_MODE: "",
  EXPR20_20: "",
  START_DT: "",
  END_DT: "",
  ACAD_CAREER: "",
  INSTR_NAME: "",
};
