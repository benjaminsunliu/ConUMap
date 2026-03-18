import React from "react";
import { render, waitFor } from "@testing-library/react-native";

jest.mock("@/components/map/map-viewer.web.client", () => ({
  __esModule: true,
  default: () => {
    const { Text } = require("react-native");
    return <Text testID="client-map">Client map loaded</Text>;
  },
}));

import MapViewer from "@/components/map/map-viewer.web";

describe("map-viewer.web", () => {
  it("loads and renders the client web map component asynchronously", async () => {
    const screen = render(<MapViewer />);

    await waitFor(() => {
      expect(screen.getByTestId("client-map")).toBeTruthy();
    });
  });
});
