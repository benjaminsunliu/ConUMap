import IndoorRoomFields from "@/components/map/indoor-map/indoor-room-fields";
import { fireEvent, render } from "@testing-library/react-native";
import React, { useState } from "react";

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));

const ROOM_SUGGESTIONS = [
  "MB 1.115",
  "MB 1.130",
  "MB 1.315",
  "MB 1.410",
  "MB 1.420",
  "MB 838",
  "MB 838.1",
  "MB S2.210",
  "MB S2.245",
];

function IndoorRoomFieldsHarness() {
  const [startRoom, setStartRoom] = useState("");
  const [endRoom, setEndRoom] = useState("");

  return (
    <IndoorRoomFields
      buildingCode="MB"
      startRoom={startRoom}
      endRoom={endRoom}
      roomSuggestions={ROOM_SUGGESTIONS}
      onChangeStartRoom={setStartRoom}
      onChangeEndRoom={setEndRoom}
      onCreatePath={jest.fn()}
    />
  );
}

function IndoorRoomFieldsEntryExitHarness() {
  const [startRoom, setStartRoom] = useState("");
  const [endRoom, setEndRoom] = useState("");

  return (
    <IndoorRoomFields
      buildingCode="MB"
      startRoom={startRoom}
      endRoom={endRoom}
      roomSuggestions={[
        ...ROOM_SUGGESTIONS,
        "MB1 Entry Exit 1",
        "MB_F1_building_entry_exit_2",
      ]}
      onChangeStartRoom={setStartRoom}
      onChangeEndRoom={setEndRoom}
      onCreatePath={jest.fn()}
    />
  );
}

describe("IndoorRoomFields", () => {
  it("disables Navigate when both fields are not filled", () => {
    const onCreatePath = jest.fn();
    const screen = render(
      <IndoorRoomFields
        buildingCode="MB"
        startRoom=""
        endRoom="MB 838"
        roomSuggestions={ROOM_SUGGESTIONS}
        canCreatePath={false}
        onChangeStartRoom={jest.fn()}
        onChangeEndRoom={jest.fn()}
        onCreatePath={onCreatePath}
      />,
    );

    const navigateButton = screen.getByTestId("indoor-create-path-button");
    fireEvent.press(navigateButton);
    expect(onCreatePath).not.toHaveBeenCalled();
  });

  it("enables Navigate when both fields are filled", () => {
    const onCreatePath = jest.fn();
    const screen = render(
      <IndoorRoomFields
        buildingCode="MB"
        startRoom="MB 1.315"
        endRoom="MB 838"
        roomSuggestions={ROOM_SUGGESTIONS}
        canCreatePath
        onChangeStartRoom={jest.fn()}
        onChangeEndRoom={jest.fn()}
        onCreatePath={onCreatePath}
      />,
    );

    const navigateButton = screen.getByTestId("indoor-create-path-button");
    fireEvent.press(navigateButton);
    expect(onCreatePath).toHaveBeenCalledTimes(1);
  });

  it("shows no suggestions on focus until the user types", () => {
    const screen = render(<IndoorRoomFieldsHarness />);

    const startInput = screen.getByTestId("indoor-start-room-input");
    fireEvent(startInput, "focus");

    expect(screen.queryByTestId("indoor-start-room-suggestions")).toBeNull();
  });

  it("shows start-room suggestions and fills the input when one is selected", () => {
    const screen = render(<IndoorRoomFieldsHarness />);

    const startInput = screen.getByTestId("indoor-start-room-input");
    fireEvent(startInput, "focus");
    fireEvent.changeText(startInput, "1.1");

    expect(screen.getByTestId("indoor-start-room-suggestions")).toBeTruthy();

    fireEvent.press(screen.getByTestId("indoor-start-room-suggestion-MB-1-115"));

    expect(screen.getByTestId("indoor-start-room-input").props.value).toBe("MB 1.115");
    expect(screen.queryByTestId("indoor-start-room-suggestions")).toBeNull();
  });

  it("shows end-room suggestions and fills the input when one is selected", () => {
    const screen = render(<IndoorRoomFieldsHarness />);

    const endInput = screen.getByTestId("indoor-end-room-input");
    fireEvent(endInput, "focus");
    fireEvent.changeText(endInput, "S2.24");

    expect(screen.getByTestId("indoor-end-room-suggestions")).toBeTruthy();

    fireEvent.press(screen.getByTestId("indoor-end-room-suggestion-MB-S2-245"));

    expect(screen.getByTestId("indoor-end-room-input").props.value).toBe("MB S2.245");
    expect(screen.queryByTestId("indoor-end-room-suggestions")).toBeNull();
  });

  it("hides suggestion list when there are no matches", () => {
    const screen = render(<IndoorRoomFieldsHarness />);

    const startInput = screen.getByTestId("indoor-start-room-input");
    fireEvent(startInput, "focus");
    fireEvent.changeText(startInput, "NO_MATCH_ROOM");

    expect(screen.queryByTestId("indoor-start-room-suggestions")).toBeNull();
  });

  it("dismisses suggestions when tapping outside the panel", () => {
    const screen = render(<IndoorRoomFieldsHarness />);

    const startInput = screen.getByTestId("indoor-start-room-input");
    fireEvent(startInput, "focus");
    fireEvent.changeText(startInput, "1.");

    expect(screen.getByTestId("indoor-start-room-suggestions")).toBeTruthy();

    fireEvent.press(screen.getByTestId("indoor-room-suggestions-dismiss-overlay"));

    expect(screen.queryByTestId("indoor-start-room-suggestions")).toBeNull();
  });

  it("shows both exact and variant room suggestions (e.g. 838 and 838.1)", () => {
    const screen = render(<IndoorRoomFieldsHarness />);

    const startInput = screen.getByTestId("indoor-start-room-input");
    fireEvent(startInput, "focus");
    fireEvent.changeText(startInput, "838");

    expect(screen.getByTestId("indoor-start-room-suggestion-MB-838")).toBeTruthy();
    expect(screen.getByTestId("indoor-start-room-suggestion-MB-838-1")).toBeTruthy();
  });

  it("renders more than three matching suggestions so the list can scroll", () => {
    const screen = render(<IndoorRoomFieldsHarness />);

    const startInput = screen.getByTestId("indoor-start-room-input");
    fireEvent(startInput, "focus");
    fireEvent.changeText(startInput, "1.");

    expect(screen.getByTestId("indoor-start-room-suggestion-MB-1-115")).toBeTruthy();
    expect(screen.getByTestId("indoor-start-room-suggestion-MB-1-130")).toBeTruthy();
    expect(screen.getByTestId("indoor-start-room-suggestion-MB-1-315")).toBeTruthy();
    expect(screen.getByTestId("indoor-start-room-suggestion-MB-1-410")).toBeTruthy();
  });

  it("keeps suggestions hidden when refocusing an unchanged selected room", () => {
    const screen = render(<IndoorRoomFieldsHarness />);

    const startInput = screen.getByTestId("indoor-start-room-input");
    fireEvent(startInput, "focus");
    fireEvent.changeText(startInput, "1.1");

    fireEvent.press(screen.getByTestId("indoor-start-room-suggestion-MB-1-115"));
    expect(screen.queryByTestId("indoor-start-room-suggestions")).toBeNull();

    fireEvent(startInput, "focus");
    expect(screen.queryByTestId("indoor-start-room-suggestions")).toBeNull();
  });

  it("clears start and end fields with the small clear buttons", () => {
    const screen = render(<IndoorRoomFieldsHarness />);

    const startInput = screen.getByTestId("indoor-start-room-input");
    const endInput = screen.getByTestId("indoor-end-room-input");

    fireEvent.changeText(startInput, "MB 1.315");
    fireEvent.changeText(endInput, "MB S2.245");

    fireEvent.press(screen.getByTestId("indoor-clear-start-room"));
    fireEvent.press(screen.getByTestId("indoor-clear-end-room"));

    expect(screen.getByTestId("indoor-start-room-input").props.value).toBe("");
    expect(screen.getByTestId("indoor-end-room-input").props.value).toBe("");
  });

  it("keeps invalid room input while typing", () => {
    const screen = render(<IndoorRoomFieldsHarness />);

    const startInput = screen.getByTestId("indoor-start-room-input");
    fireEvent.changeText(startInput, "NOT_A_ROOM");

    expect(screen.getByTestId("indoor-start-room-input").props.value).toBe("NOT_A_ROOM");
  });

  it("allows shorthand input that can match known rooms", () => {
    const screen = render(<IndoorRoomFieldsHarness />);

    const startInput = screen.getByTestId("indoor-start-room-input");
    fireEvent.changeText(startInput, "838");

    expect(screen.getByTestId("indoor-start-room-input").props.value).toBe("838");
  });

  it("shows and applies building entry-exit suggestions", () => {
    const screen = render(<IndoorRoomFieldsEntryExitHarness />);

    const startInput = screen.getByTestId("indoor-start-room-input");
    fireEvent(startInput, "focus");
    fireEvent.changeText(startInput, "entry exit 1");

    const entrySuggestion = screen.getByTestId(
      "indoor-start-room-suggestion-MB1-ENTRY-EXIT-1",
    );
    expect(entrySuggestion).toBeTruthy();

    fireEvent.press(entrySuggestion);
    expect(screen.getByTestId("indoor-start-room-input").props.value).toBe(
      "MB1 Entry Exit 1",
    );
  });
});
