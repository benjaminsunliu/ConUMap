import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { LoggedInData } from "@/types/authTypes";
import { parseCookieString } from "@/utils/authCookies";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface AuthWebViewProps {
  onLogin: (data: LoggedInData) => void | Promise<void>;
}

export default function AuthWebView({ onLogin }: Readonly<AuthWebViewProps>) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const [authInput, setAuthInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    try {
      setIsSubmitting(true);
      const loginData = buildWebLoginData(authInput);
      setErrorMessage(null);
      await Promise.resolve(onLogin(loginData));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Couldn't read the Concordia token.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={[styles.page, { backgroundColor: theme.background }]} testID="auth-web-form">
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.scheduleHeader.backgroundColor,
            borderColor: theme.buildingInfoPopup.divider,
          },
        ]}
      >
        <Text style={[styles.title, { color: theme.tint }]}>Browser Sign-In</Text>
        <Text style={[styles.body, { color: theme.text }]}>
          Concordia blocks the embedded sign-in page in browsers, so the web app
          needs a one-time manual token.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={openConcordiaHub}
          style={[
            styles.openHubButton,
            {
              backgroundColor: theme.icon,
              borderColor: theme.icon,
            },
          ]}
        >
          <Text style={[styles.openHubButtonText, { color: theme.background }]}>
            Open Concordia Hub
          </Text>
        </Pressable>

        <Text style={[styles.instructions, { color: theme.text }]}>
          Sign in in the new tab, run document.cookie in that tab's developer
          console, then paste the result below. You can also paste just the
          SSO-Token value.
        </Text>

        <Text style={[styles.label, { color: theme.tint }]}>
          Cookie String Or SSO-Token
        </Text>
        <TextInput
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(value) => {
            setAuthInput(value);
            if (errorMessage) {
              setErrorMessage(null);
            }
          }}
          placeholder="Paste document.cookie output or the SSO-Token cookie value"
          placeholderTextColor={theme.placeholder}
          style={[
            styles.input,
            {
              backgroundColor: theme.buildingSelection.inputBackground,
              borderColor: theme.buildingSelection.borderColor,
              color: theme.buildingSelection.inputText,
            },
          ]}
          testID="calendar-web-auth-input"
          textAlignVertical="top"
          value={authInput}
        />

        {errorMessage ? (
          <Text style={styles.errorText} testID="calendar-web-auth-error">
            {errorMessage}
          </Text>
        ) : null}

        {isSubmitting ? (
          <View style={styles.submittingRow}>
            <ActivityIndicator color={theme.tint} />
            <Text style={[styles.submittingText, { color: theme.text }]}>
              Checking token and loading your schedule...
            </Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting || !authInput.trim()}
          onPress={() => {
            void handleLogin();
          }}
          style={[
            styles.submitButton,
            { backgroundColor: theme.tint },
            (isSubmitting || !authInput.trim()) && styles.submitButtonDisabled,
          ]}
          testID="calendar-web-auth-submit"
        >
          <Text style={[styles.submitButtonText, { color: theme.background }]}>
            {isSubmitting ? "Loading..." : "Continue To Calendar"}
          </Text>
        </Pressable>

        <Text style={[styles.footnote, { color: theme.placeholder }]}>
          The pasted token stays in this browser only and is used just for your
          schedule requests.
        </Text>
      </View>
    </View>
  );
}

function buildWebLoginData(rawInput: string): LoggedInData {
  const normalizedInput = rawInput.trim().replace(/^['"]|['"]$/g, "");
  if (!normalizedInput) {
    throw new Error("Paste your Concordia cookie string or SSO-Token first.");
  }

  if (!normalizedInput.includes("=")) {
    return {
      authToken: normalizedInput,
      firstName: "Concordia",
      lastNameInitial: "",
    };
  }

  const cookies = parseCookieString(normalizedInput);
  const authToken = cookies["SSO-Token"];

  if (!authToken) {
    throw new Error("Couldn't find SSO-Token in the pasted cookie string.");
  }

  return {
    authToken,
    firstName: cookies["Given-Name"] || "Concordia",
    lastNameInitial: cookies["Surname"] || "",
  };
}

function openConcordiaHub() {
  globalThis.open?.(authenticationURL, "_blank", "noopener,noreferrer");
}

const authenticationURL = "https://hub.concordia.ca/students/account.html";

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    width: "100%",
    maxWidth: 720,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    boxShadow: "0px 12px 24px rgba(0, 0, 0, 0.12)",
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  openHubButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginBottom: 16,
  },
  openHubButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  instructions: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    minHeight: 140,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  errorText: {
    color: "#b00020",
    fontSize: 14,
    marginBottom: 12,
  },
  submittingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  submittingText: {
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  footnote: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
  },
});
