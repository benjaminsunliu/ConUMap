import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import { Modal, StyleSheet } from "react-native";

import ScheduleHeader from "../components/schedule/schedule-header";

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));

describe("ScheduleHeader", () => {
  it("calls onTodayPress when Today is pressed", () => {
    const onTodayPress = jest.fn();

    const screen = render(
      <ScheduleHeader
        currentWeekStart={new Date("2026-03-22T00:00:00")}
        onWeekChange={jest.fn()}
        onTodayPress={onTodayPress}
      />,
    );

    fireEvent.press(screen.getByLabelText("Jump to today"));
    expect(onTodayPress).toHaveBeenCalledTimes(1);
  });

  it("selects a month and sends the week start rewound to Sunday", () => {
    const onWeekChange = jest.fn();

    const screen = render(
      <ScheduleHeader
        currentWeekStart={new Date("2026-03-22T00:00:00")}
        onWeekChange={onWeekChange}
        onTodayPress={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByLabelText("Change month"));
    fireEvent.press(screen.getByText("May"));

    expect(onWeekChange).toHaveBeenCalledTimes(1);
    expect(onWeekChange).toHaveBeenCalledWith(new Date("2026-04-26T00:00:00"));
  });

  it("closes month picker when modal onRequestClose is called", () => {
    const screen = render(
      <ScheduleHeader
        currentWeekStart={new Date("2026-03-22T00:00:00")}
        onWeekChange={jest.fn()}
        onTodayPress={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByLabelText("Change month"));
    expect(screen.getByText("January")).toBeTruthy();

    act(() => {
      const modal = screen.UNSAFE_getByType(Modal);
      modal.props.onRequestClose();
    });

    expect(screen.UNSAFE_getByType(Modal).props.visible).toBe(false);
  });

  it("closes month picker when tapping the backdrop", () => {
    const screen = render(
      <ScheduleHeader
        currentWeekStart={new Date("2026-03-22T00:00:00")}
        onWeekChange={jest.fn()}
        onTodayPress={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByLabelText("Change month"));

    const backdrop = screen.UNSAFE_root.findAll((node) => {
      const style = StyleSheet.flatten(node.props?.style);
      return typeof node.props?.onPress === "function" && style?.position === "absolute";
    })[0];

    expect(backdrop).toBeDefined();
    fireEvent.press(backdrop);

    expect(screen.UNSAFE_getByType(Modal).props.visible).toBe(false);
  });
});
