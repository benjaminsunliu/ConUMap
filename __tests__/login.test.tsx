import CalendarScreen from "@/app/(tabs)/calendar";
import AuthContextProvider, {
  AuthContext,
} from "@/components/authentication/AuthContextProvider";
import { queryClient } from "@/hooks/query";
import { useIsLoggedIn, useLogin, useLogout } from "@/hooks/use-login";
import { LoggedInData } from "@/types/authTypes";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, userEvent } from "@testing-library/react-native";
import { getItemAsync, setItemAsync, deleteItemAsync } from "expo-secure-store";
import { Button, Text, View } from "react-native";

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
});
