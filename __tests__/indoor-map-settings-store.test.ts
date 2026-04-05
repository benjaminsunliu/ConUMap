import { IndoorMapSettings } from "@/globals/IndoorMapSettingsStore";
import * as SecureStore from "expo-secure-store";

jest.mock("expo-secure-store", () => ({
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

describe("IndoorMapSettingsStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    IndoorMapSettings.reset();
  });

  it("repairs corrupted persisted settings with defaults", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("not-json");
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

    await expect(IndoorMapSettings.getSettings()).resolves.toEqual({
      wheelchairOnly: false,
    });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "indoorMapSettings",
      JSON.stringify({ wheelchairOnly: false }),
    );
  });

  it("does not let a pending async load overwrite a newer in-memory update", async () => {
    let resolveStoredSettings: ((value: string) => void) | undefined;
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolveStoredSettings = resolve;
        }),
    );
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

    const loadingPromise = IndoorMapSettings.getSettings();
    await Promise.resolve();

    await IndoorMapSettings.setWheelchairOnly(true);
    resolveStoredSettings?.(JSON.stringify({ wheelchairOnly: false }));

    await expect(loadingPromise).resolves.toEqual({
      wheelchairOnly: true,
    });
    expect(IndoorMapSettings.getCachedSettings()).toEqual({
      wheelchairOnly: true,
    });
  });
});
