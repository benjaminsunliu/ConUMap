import * as SecureStore from "expo-secure-store";

const indoorMapSettingsKey = "indoorMapSettings";

type IndoorMapSettingsState = {
  wheelchairOnly: boolean;
};

const defaultSettings: IndoorMapSettingsState = {
  wheelchairOnly: false,
};

class IndoorMapSettingsStore {
  private settings: IndoorMapSettingsState = { ...defaultSettings };

  private hasLoaded = false;

  public getCachedSettings() {
    return this.settings;
  }

  public async getSettings() {
    if (this.hasLoaded) {
      return this.settings;
    }

    const maybeSettings = await SecureStore.getItemAsync(indoorMapSettingsKey);
    if (!maybeSettings) {
      this.hasLoaded = true;
      return this.settings;
    }

    try {
      const parsedSettings = JSON.parse(maybeSettings) as Partial<IndoorMapSettingsState>;
      this.settings = {
        ...defaultSettings,
        ...parsedSettings,
      };
    } catch {
      this.settings = { ...defaultSettings };
    }

    this.hasLoaded = true;
    return this.settings;
  }

  public async setWheelchairOnly(wheelchairOnly: boolean) {
    this.settings = {
      ...this.settings,
      wheelchairOnly,
    };
    this.hasLoaded = true;
    return SecureStore.setItemAsync(
      indoorMapSettingsKey,
      JSON.stringify(this.settings),
    );
  }

  public reset() {
    this.settings = { ...defaultSettings };
    this.hasLoaded = false;
  }
}

export const IndoorMapSettings = new IndoorMapSettingsStore();
