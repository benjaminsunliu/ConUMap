import React from "react";
import { act, render } from "@testing-library/react-native";

import ScheduleViewer from "../components/schedule/schedule-viewer";
import type { ClassSchedule } from "@/hooks/use-calendar";

let mockHeaderProps: any;
let mockBodyProps: any;
let mockPopupProps: any;
const mockUseColorScheme = jest.fn((): string | null => "light");

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => mockUseColorScheme(),
}));

jest.mock("../components/schedule/schedule-header", () => {
  return function MockScheduleHeader(props: any) {
    mockHeaderProps = props;
    return null;
  };
});

jest.mock("../components/schedule/weekly-calendar-body", () => {
  return function MockWeeklyCalendarBody(props: any) {
    mockBodyProps = props;
    return null;
  };
});

jest.mock("../components/schedule/class-detail-popup", () => {
  return function MockClassDetailPopup(props: any) {
    mockPopupProps = props;
    return null;
  };
});

const BASE_CLASS: ClassSchedule = {
  STRM: "2254",
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
  CU_BUILDING: "Engineering Building",
  ROOM: "2.260",
  INSTRUCTION_MODE: "In Person",
  EXPR20_20: "",
  START_DT: "2026-01-10",
  END_DT: "2026-04-20",
  ACAD_CAREER: "UGRD",
  INSTR_NAME: "Prof",
};

describe("ScheduleViewer", () => {
  const mockSetDate = jest.fn();
  const baseDate = new Date("2026-03-18T12:00:00");

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(baseDate);
    mockUseColorScheme.mockReset();
    mockUseColorScheme.mockReturnValue("light");
    mockHeaderProps = undefined;
    mockBodyProps = undefined;
    mockPopupProps = undefined;
    mockSetDate.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("builds color map and passes week/classes to child components", () => {
    const classes: ClassSchedule[] = [
      { ...BASE_CLASS, SUBJECT: "SOEN", CATALOG_NBR: "390" },
      { ...BASE_CLASS, SUBJECT: "SOEN", CATALOG_NBR: "390", CLASS_SECTION: "AB" },
      { ...BASE_CLASS, SUBJECT: "COMP", CATALOG_NBR: "248", CLASS_SECTION: "CC" },
    ];

    render(<ScheduleViewer data={classes} date={baseDate} setDate={mockSetDate} />);

    expect(mockHeaderProps.currentWeekStart).toEqual(new Date("2026-03-15T00:00:00"));
    expect(mockBodyProps.weekStartDate).toEqual(new Date("2026-03-15T00:00:00"));
    expect(mockBodyProps.classes).toEqual(classes);

    expect(mockBodyProps.colorMap.get("SOEN-390")).toBeDefined();
    expect(mockBodyProps.colorMap.get("COMP-248")).toBeDefined();
    expect(mockBodyProps.colorMap.get("SOEN-390")).not.toEqual(
      mockBodyProps.colorMap.get("COMP-248"),
    );
  });

  it("uses empty class array when data is null", () => {
    render(<ScheduleViewer data={null} date={baseDate} setDate={mockSetDate} />);
    expect(mockBodyProps.classes).toEqual([]);
    expect(mockBodyProps.colorMap.size).toBe(0);
  });

  it("calls setDate with today when header today is pressed", () => {
    render(<ScheduleViewer data={[BASE_CLASS]} date={baseDate} setDate={mockSetDate} />);

    act(() => {
      mockHeaderProps.onTodayPress();
    });

    expect(mockSetDate).toHaveBeenCalledTimes(1);
    expect(mockSetDate.mock.calls[0][0]).toEqual(baseDate);
  });

  it("opens and closes class detail popup from class selection", () => {
    render(<ScheduleViewer data={[BASE_CLASS]} date={baseDate} setDate={mockSetDate} />);

    expect(mockPopupProps).toBeUndefined();

    act(() => {
      mockBodyProps.onClassPress(BASE_CLASS);
    });
    expect(mockPopupProps).toBeDefined();
    expect(mockPopupProps.classInfo.CU_BLDG).toBe("EV");

    const closePopup = mockPopupProps.onClose;
    mockPopupProps = undefined;
    act(() => {
      closePopup();
    });
    expect(mockPopupProps).toBeUndefined();
  });

  it("falls back to light theme when useColorScheme returns null", () => {
    mockUseColorScheme.mockReturnValue(null);

    render(<ScheduleViewer data={[BASE_CLASS]} date={baseDate} setDate={mockSetDate} />);

    expect(mockHeaderProps).toBeDefined();
    expect(mockBodyProps).toBeDefined();
  });
});
