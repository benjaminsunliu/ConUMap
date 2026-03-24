import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";

import WeeklyCalendarBody, {
  getNextClass,
} from "../components/schedule/weekly-calendar-body";
import type { ClassSchedule } from "@/hooks/use-calendar";

const mockNavigate = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    navigate: (...args: unknown[]) => mockNavigate(...args),
  },
}));

const DEFAULT_CLASS: ClassSchedule = {
  STRM: "2244",
  SUBJECT: "SOEN",
  CATALOG_NBR: "390",
  SSR_COMPONENT: "LEC",
  XLATLONGNAME: "Lecture",
  CLASS_SECTION: "AA",
  DAY_OF_WEEK: "mon",
  START_HOURS: "10",
  START_MINUTES: "00",
  END_HOURS: "11",
  END_MINUTES: "00",
  CU_BLDG: "EV",
  CU_BUILDING: "Engineering, Computer Science and Visual Arts Integrated Complex",
  ROOM: "1.001",
  INSTRUCTION_MODE: "In Person",
  EXPR20_20: "",
  START_DT: "2026-01-01",
  END_DT: "2026-04-30",
  ACAD_CAREER: "UGRD",
  INSTR_NAME: "Prof. Test",
};

function makeClass(overrides: Partial<ClassSchedule>): ClassSchedule {
  return { ...DEFAULT_CLASS, ...overrides };
}

function setFakeNow(isoDate: string) {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(isoDate));
}

describe("getNextClass", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns undefined if there are no classes today", () => {
    setFakeNow("2026-03-23T09:00:00"); // Monday (local time)
    const classes = [makeClass({ DAY_OF_WEEK: "tue" })];

    expect(getNextClass(classes)).toBeUndefined();
  });

  it("finds the next class if no classes are in progress", () => {
    setFakeNow("2026-03-23T09:00:00"); // Monday (local time)
    const early = makeClass({
      DAY_OF_WEEK: "mon",
      START_HOURS: "08",
      START_MINUTES: "00",
      END_HOURS: "08",
      END_MINUTES: "50",
      CU_BLDG: "H",
    });
    const next = makeClass({
      DAY_OF_WEEK: "mon",
      START_HOURS: "10",
      START_MINUTES: "00",
      END_HOURS: "11",
      END_MINUTES: "00",
      CU_BLDG: "EV",
    });

    expect(getNextClass([early, next])).toEqual(next);
  });

  it("chooses an ongoing class if it started 30 minutes ago or less", () => {
    setFakeNow("2026-03-23T09:20:00"); // Monday (local time)
    const ongoing = makeClass({
      DAY_OF_WEEK: "mon",
      START_HOURS: "09",
      START_MINUTES: "00",
      END_HOURS: "10",
      END_MINUTES: "00",
      CU_BLDG: "MB",
    });
    const later = makeClass({
      DAY_OF_WEEK: "mon",
      START_HOURS: "10",
      START_MINUTES: "00",
      END_HOURS: "11",
      END_MINUTES: "00",
      CU_BLDG: "EV",
    });

    expect(getNextClass([ongoing, later])).toEqual(ongoing);
  });

  it("skips an ongoing class if it started more than 30 minutes ago", () => {
    setFakeNow("2026-03-23T09:31:00"); // Monday (local time)
    const oldOngoing = makeClass({
      DAY_OF_WEEK: "mon",
      START_HOURS: "09",
      START_MINUTES: "00",
      END_HOURS: "10",
      END_MINUTES: "00",
      CU_BLDG: "MB",
    });
    const later = makeClass({
      DAY_OF_WEEK: "mon",
      START_HOURS: "10",
      START_MINUTES: "00",
      END_HOURS: "11",
      END_MINUTES: "00",
      CU_BLDG: "EV",
    });

    expect(getNextClass([oldOngoing, later])).toEqual(later);
  });

  it("keeps the current next class when another class ends later", () => {
    setFakeNow("2026-03-23T09:00:00"); // Monday (local time)
    const sooner = makeClass({
      DAY_OF_WEEK: "mon",
      START_HOURS: "09",
      START_MINUTES: "30",
      END_HOURS: "10",
      END_MINUTES: "00",
      CU_BLDG: "MB",
    });
    const later = makeClass({
      DAY_OF_WEEK: "mon",
      START_HOURS: "11",
      START_MINUTES: "00",
      END_HOURS: "12",
      END_MINUTES: "00",
      CU_BLDG: "EV",
    });

    expect(getNextClass([sooner, later])).toEqual(sooner);
  });

  it("replaces next class when a later iterated class ends sooner", () => {
    setFakeNow("2026-03-23T09:00:00"); // Monday (local time)
    const farther = makeClass({
      DAY_OF_WEEK: "mon",
      START_HOURS: "11",
      START_MINUTES: "00",
      END_HOURS: "12",
      END_MINUTES: "00",
      CU_BLDG: "FG",
    });
    const closer = makeClass({
      DAY_OF_WEEK: "mon",
      START_HOURS: "10",
      START_MINUTES: "00",
      END_HOURS: "10",
      END_MINUTES: "30",
      CU_BLDG: "EV",
    });

    expect(getNextClass([farther, closer])).toEqual(closer);
  });
});

describe("WeeklyCalendarBody interactions", () => {
  const weekStartDate = new Date("2026-03-23T00:00:00");
  const colorMap = new Map<string, string>();

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("navigates to the next class building when the next-class button is pressed", () => {
    setFakeNow("2026-03-23T09:00:00"); // Monday (local time)
    const classes = [
      makeClass({
        DAY_OF_WEEK: "mon",
        START_HOURS: "10",
        START_MINUTES: "00",
        END_HOURS: "11",
        END_MINUTES: "00",
        CU_BLDG: "EV",
      }),
    ];

    const screen = render(
      <WeeklyCalendarBody
        weekStartDate={weekStartDate}
        classes={classes}
        colorMap={colorMap}
        onClassPress={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByLabelText("Jump to next class"));

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: "/map-tab",
      params: { buildingId: "EV", autoNavigate: "true" },
    });
  });

  it("does not navigate when there is no next class", () => {
    setFakeNow("2026-03-23T09:00:00"); // Monday (local time)
    const classes = [makeClass({ DAY_OF_WEEK: "tue" })];

    const screen = render(
      <WeeklyCalendarBody
        weekStartDate={weekStartDate}
        classes={classes}
        colorMap={colorMap}
        onClassPress={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByLabelText("Jump to next class"));

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("executes scheduled timeout and interval callbacks", () => {
    setFakeNow("2026-03-23T09:00:00");
    const timeoutSpy = jest.spyOn(globalThis, "setTimeout");
    const intervalSpy = jest.spyOn(globalThis, "setInterval");

    render(
      <WeeklyCalendarBody
        weekStartDate={weekStartDate}
        classes={[]}
        colorMap={colorMap}
        onClassPress={jest.fn()}
      />,
    );

    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 50);
    expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);

    expect(() => {
      act(() => {
        jest.advanceTimersByTime(50);
        jest.advanceTimersByTime(60000);
      });
    }).not.toThrow();

    timeoutSpy.mockRestore();
    intervalSpy.mockRestore();
  });

  it("cleans up interval and timeout handlers on unmount", () => {
    setFakeNow("2026-03-23T09:00:00");
    const clearIntervalSpy = jest.spyOn(globalThis, "clearInterval");
    const clearTimeoutSpy = jest.spyOn(globalThis, "clearTimeout");

    const screen = render(
      <WeeklyCalendarBody
        weekStartDate={weekStartDate}
        classes={[]}
        colorMap={colorMap}
        onClassPress={jest.fn()}
      />,
    );

    screen.unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });
});
