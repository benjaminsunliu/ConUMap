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

  private settingsVersion = 0;

  public getCachedSettings() {
    return this.settings;
  }

  public async getSettings() {
    if (this.hasLoaded) {
      return this.settings;
    }

    const loadVersion = this.settingsVersion;
    const maybeSettings = await SecureStore.getItemAsync(indoorMapSettingsKey);
    if (loadVersion !== this.settingsVersion) {
      return this.settings;
    }
    if (!maybeSettings) {
      this.hasLoaded = true;
      return this.settings;
    }

    try {
      const parsedSettings = JSON.parse(maybeSettings) as Partial<IndoorMapSettingsState>;
      if (loadVersion !== this.settingsVersion) {
        return this.settings;
      }
      this.settings = {
        ...defaultSettings,
        ...parsedSettings,
      };
    } catch {
      this.settings = { ...defaultSettings };
      this.hasLoaded = true;
      await this.persistSettings().catch(() => {
        // Keep the repaired in-memory defaults if storage cannot be updated.
      });
      return this.settings;
    }

    this.hasLoaded = true;
    return this.settings;
  }

  public async setWheelchairOnly(wheelchairOnly: boolean) {
    this.settingsVersion += 1;
    this.settings = {
      ...this.settings,
      wheelchairOnly,
    };
    this.hasLoaded = true;
    return this.persistSettings();
  }

  public reset() {
    this.settingsVersion += 1;
    this.settings = { ...defaultSettings };
    this.hasLoaded = false;
  }

  private persistSettings() {
    return SecureStore.setItemAsync(indoorMapSettingsKey, JSON.stringify(this.settings));
  }
}

export const IndoorMapSettings = new IndoorMapSettingsStore();
