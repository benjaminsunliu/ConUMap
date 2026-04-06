import AuthWebView from "@/components/authentication/AuthWebView.web";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

describe("AuthWebView web", () => {
  it("accepts a pasted token", async () => {
    const onLogin = jest.fn();
    const authView = render(<AuthWebView onLogin={onLogin} />);

    fireEvent.changeText(authView.getByTestId("calendar-web-auth-input"), "token-123");
    fireEvent.press(authView.getByTestId("calendar-web-auth-submit"));

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith({
        authToken: "token-123",
        firstName: "Concordia",
        lastNameInitial: "",
      });
    });
  });

  it("extracts the token from a pasted cookie string", async () => {
    const onLogin = jest.fn();
    const authView = render(<AuthWebView onLogin={onLogin} />);

    fireEvent.changeText(
      authView.getByTestId("calendar-web-auth-input"),
      "Given-Name=Ben; Surname=L; SSO-Token=token==",
    );
    fireEvent.press(authView.getByTestId("calendar-web-auth-submit"));

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith({
        authToken: "token==",
        firstName: "Ben",
        lastNameInitial: "L",
      });
    });
  });
});
