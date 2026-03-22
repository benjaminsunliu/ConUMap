import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { Animated } from "react-native";

import ClassDetailPopup from "../components/schedule/class-detail-popup";
import type { ClassSchedule } from "@/hooks/use-calendar";
import { Colors } from "@/constants/theme";

const mockNavigate = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    navigate: (...args: unknown[]) => mockNavigate(...args),
  },
}));

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));

const MOCK_CLASS: ClassSchedule = {
  STRM: "2254",
  SUBJECT: "SOEN",
  CATALOG_NBR: "390",
  SSR_COMPONENT: "LEC",
  XLATLONGNAME: "Software Quality Assurance",
  CLASS_SECTION: "AA",
  DAY_OF_WEEK: "mon",
  START_HOURS: "10",
  START_MINUTES: "15",
  END_HOURS: "11",
  END_MINUTES: "30",
  CU_BLDG: "EV",
  CU_BUILDING: "Engineering, Computer Science and Visual Arts Integrated Complex",
  ROOM: "2.260",
  INSTRUCTION_MODE: "In Person",
  EXPR20_20: "",
  START_DT: "2026-01-10",
  END_DT: "2026-04-20",
  ACAD_CAREER: "UGRD",
  INSTR_NAME: "Prof. Example",
};

function createTimingSpy() {
  return jest.spyOn(Animated, "timing").mockImplementation((() => {
    return {
      start: (callback?: (result: { finished: boolean }) => void) => {
        callback?.({ finished: true });
      },
    };
  }) as unknown as typeof Animated.timing);
}

describe("ClassDetailPopup", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("runs enter animation on mount", () => {
    const timingSpy = createTimingSpy();

    render(
      <ClassDetailPopup
        classInfo={MOCK_CLASS}
        colorMap={new Map<string, string>()}
        onClose={jest.fn()}
      />,
    );

    expect(timingSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    );
  });

  it("uses class color from colorMap when available", () => {
    createTimingSpy();
    const colorMap = new Map<string, string>([["SOEN-390", "#123456"]]);

    const screen = render(
      <ClassDetailPopup classInfo={MOCK_CLASS} colorMap={colorMap} onClose={jest.fn()} />,
    );

    expect(JSON.stringify(screen.toJSON())).toContain("#123456");
  });

  it("falls back to theme color when course is not in colorMap", () => {
    createTimingSpy();

    const screen = render(
      <ClassDetailPopup
        classInfo={MOCK_CLASS}
        colorMap={new Map<string, string>()}
        onClose={jest.fn()}
      />,
    );

    expect(JSON.stringify(screen.toJSON())).toContain(
      Colors.light.classDetailPopup.courseNotInColorMap,
    );
  });

  it("runs exit animation and calls onClose when close button is pressed", () => {
    const timingSpy = createTimingSpy();
    const onClose = jest.fn();

    const screen = render(
      <ClassDetailPopup
        classInfo={MOCK_CLASS}
        colorMap={new Map<string, string>()}
        onClose={onClose}
      />,
    );

    fireEvent.press(screen.getByLabelText("Close"));

    expect(timingSpy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes popup and navigates to map when View in Map is pressed", () => {
    createTimingSpy();
    const onClose = jest.fn();

    const screen = render(
      <ClassDetailPopup
        classInfo={MOCK_CLASS}
        colorMap={new Map<string, string>()}
        onClose={onClose}
      />,
    );

    fireEvent.press(screen.getByText("View in Map"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: "/map-tab",
      params: { buildingId: "EV" },
    });
    expect(onClose.mock.invocationCallOrder[0]).toBeLessThan(
      mockNavigate.mock.invocationCallOrder[0],
    );
  });
});
