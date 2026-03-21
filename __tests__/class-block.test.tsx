import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ClassBlock from "../components/schedule/class-block";
import { ClassSchedule } from "@/hooks/use-calendar";

const MOCK_CLASS: ClassSchedule = {
  STRM: "2254",
  SUBJECT: "SOEN",
  CATALOG_NBR: "345",
  SSR_COMPONENT: "LEC",
  XLATLONGNAME: "Lecture",
  CLASS_SECTION: "WW",
  DAY_OF_WEEK: "mon",
  START_HOURS: "14",
  START_MINUTES: "45",
  END_HOURS: "16",
  END_MINUTES: "00",
  CU_BLDG: "H",
  CU_BUILDING: "Hall Building",
  ROOM: "535",
  INSTRUCTION_MODE: "E",
  EXPR20_20: "2026-02-06",
  START_DT: "2026-01-12",
  END_DT: "2026-04-13",
  ACAD_CAREER: "UGRD",
  INSTR_NAME: "Hassan Hajjdiab",
};

const MOCK_COLORMAP = new Map<string, string>();
MOCK_COLORMAP.set(`${MOCK_CLASS.SUBJECT}-${MOCK_CLASS.CATALOG_NBR}`, "#5e0e16");

const TOP_OFFSET = 619.5;
const HEIGHT = 52.5;

describe("ClassBlock", () => {
  it("renders the course name", () => {
    const { getByText } = render(
      <ClassBlock
        classInfo={MOCK_CLASS}
        colorMap={MOCK_COLORMAP}
        topOffset={TOP_OFFSET}
        height={HEIGHT}
        onPress={() => {}}
      />,
    );

    expect(getByText("SOEN")).toBeTruthy();
    expect(getByText("345")).toBeTruthy();
  });

  it("calls onPress with the correct classInfo when tapped", () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <ClassBlock
        classInfo={MOCK_CLASS}
        colorMap={MOCK_COLORMAP}
        topOffset={TOP_OFFSET}
        height={HEIGHT}
        onPress={mockOnPress}
      />,
    );

    fireEvent.press(getByText("SOEN"));

    expect(mockOnPress).toHaveBeenCalledTimes(1);
    expect(mockOnPress).toHaveBeenCalledWith(MOCK_CLASS);
  });
});
