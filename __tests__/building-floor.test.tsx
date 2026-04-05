import BuildingFloor from "@/components/map/building-floor";
import { render } from "@testing-library/react-native";

describe("building floor", () => {
  const basePoiFilters = {
    bathrooms: false,
    elevators: false,
    waterFountains: false,
    stairs: false,
    escalators: false,
  };

  const baseInfo = {
    buildingCode: "H" as const,
    graphData: {
      adjacencySet: {},
      checkpoints: {
        H110: {
          id: "H110",
          type: "doorway",
          buildingId: "H",
          floor: 1,
          x: 100,
          y: 100,
          accessible: true,
        },
        H111: {
          id: "H111",
          type: "doorway",
          buildingId: "H",
          floor: 1,
          x: 200,
          y: 100,
          accessible: true,
        },
        H112: {
          id: "H112",
          type: "doorway",
          buildingId: "H",
          floor: 1,
          x: 300,
          y: 100,
          accessible: true,
        },
        H_BATHROOM: {
          id: "H_BATHROOM",
          type: "point_of_interest",
          buildingId: "H",
          floor: 1,
          x: 350,
          y: 100,
          accessible: true,
          metadata: {
            POI: "Bathroom",
          },
        },
        H_WATER_FOUNTAIN: {
          id: "H_WATER_FOUNTAIN",
          type: "point_of_interest",
          buildingId: "H",
          floor: 1,
          x: 380,
          y: 100,
          accessible: true,
          metadata: {
            POI: "Water fountain",
          },
        },
        H_ELEVATOR_DOOR: {
          id: "H_ELEVATOR_DOOR",
          type: "elevator_door",
          buildingId: "H",
          floor: 1,
          x: 410,
          y: 100,
          accessible: true,
        },
        H_STAIR_LANDING: {
          id: "H_STAIR_LANDING",
          type: "stair_landing",
          buildingId: "H",
          floor: 1,
          x: 440,
          y: 100,
          accessible: false,
        },
        H_ESCALATOR: {
          id: "H_ESCALATOR",
          type: "escalator",
          buildingId: "H",
          floor: 1,
          x: 470,
          y: 100,
          accessible: true,
        },
      },
    },
    images: {
      1: require("@/data/indoorMapData/images/H/H1.png"),
    },
  };

  it("Should render", () => {
    render(<BuildingFloor floor={1} info={baseInfo} poiFilters={basePoiFilters} />);
  });

  it("highlights the active edge while dimming other edges in step mode", () => {
    const { getByTestId } = render(
      <BuildingFloor
        floor={1}
        info={baseInfo}
        poiFilters={basePoiFilters}
        navigationPath={["H110", "H111", "H112"]}
        isStepMode
        activeStepIndex={1}
      />,
    );

    const edge0 = getByTestId("indoor-path-edge-0");
    const edge1 = getByTestId("indoor-path-edge-1");

    expect(edge0.props.strokeOpacity).toBe(0.5);
    expect(edge0.props.strokeWidth).toBe(20);
    expect(edge1.props.strokeOpacity).toBe(1);
    expect(edge1.props.strokeWidth).toBe(22);
  });

  it("renders bathroom icons for bathroom POI nodes", () => {
    const { queryByTestId } = render(
      <BuildingFloor floor={1} info={baseInfo} poiFilters={basePoiFilters} />,
    );

    expect(queryByTestId("bathroom-icon-H_BATHROOM")).toBeTruthy();
  });

  it("renders water fountain icons for water fountain POI nodes", () => {
    const { queryByTestId } = render(
      <BuildingFloor floor={1} info={baseInfo} poiFilters={basePoiFilters} />,
    );

    expect(queryByTestId("water-fountain-icon-H_WATER_FOUNTAIN")).toBeTruthy();
  });

  it("renders elevator icons for elevator door nodes", () => {
    const { queryByTestId } = render(
      <BuildingFloor floor={1} info={baseInfo} poiFilters={basePoiFilters} />,
    );

    expect(queryByTestId("elevator-icon-H_ELEVATOR_DOOR")).toBeTruthy();
  });

  it("renders stair icons for stair landing nodes", () => {
    const { queryByTestId } = render(
      <BuildingFloor floor={1} info={baseInfo} poiFilters={basePoiFilters} />,
    );

    expect(queryByTestId("stair-icon-H_STAIR_LANDING")).toBeTruthy();
  });

  it("renders escalator icons for escalator nodes", () => {
    const { queryByTestId } = render(
      <BuildingFloor floor={1} info={baseInfo} poiFilters={basePoiFilters} />,
    );

    expect(queryByTestId("escalator-icon-H_ESCALATOR")).toBeTruthy();
  });

  it("highlights water fountain nodes when the water fountains toggle is enabled", () => {
    const { queryByTestId } = render(
      <BuildingFloor
        floor={1}
        info={baseInfo}
        poiFilters={{
          ...basePoiFilters,
          waterFountains: true,
        }}
      />,
    );

    expect(queryByTestId("water-fountain-highlight-H_WATER_FOUNTAIN")).toBeTruthy();
  });

  it("does not highlight water fountain nodes when the water fountains toggle is disabled", () => {
    const { queryByTestId } = render(
      <BuildingFloor floor={1} info={baseInfo} poiFilters={basePoiFilters} />,
    );

    expect(queryByTestId("water-fountain-highlight-H_WATER_FOUNTAIN")).toBeNull();
  });

  it("highlights bathroom nodes when the bathrooms toggle is enabled", () => {
    const { queryByTestId } = render(
      <BuildingFloor
        floor={1}
        info={baseInfo}
        poiFilters={{
          ...basePoiFilters,
          bathrooms: true,
        }}
      />,
    );

    expect(queryByTestId("bathroom-highlight-H_BATHROOM")).toBeTruthy();
  });

  it("highlights elevator nodes when the elevators toggle is enabled", () => {
    const { queryByTestId } = render(
      <BuildingFloor
        floor={1}
        info={baseInfo}
        poiFilters={{
          ...basePoiFilters,
          elevators: true,
        }}
      />,
    );

    expect(queryByTestId("elevator-highlight-H_ELEVATOR_DOOR")).toBeTruthy();
  });

  it("highlights stair nodes when the stairs toggle is enabled", () => {
    const { queryByTestId } = render(
      <BuildingFloor
        floor={1}
        info={baseInfo}
        poiFilters={{
          ...basePoiFilters,
          stairs: true,
        }}
      />,
    );

    expect(queryByTestId("stair-highlight-H_STAIR_LANDING")).toBeTruthy();
  });

  it("highlights escalator nodes when the escalators toggle is enabled", () => {
    const { queryByTestId } = render(
      <BuildingFloor
        floor={1}
        info={baseInfo}
        poiFilters={{
          ...basePoiFilters,
          escalators: true,
        }}
      />,
    );

    expect(queryByTestId("escalator-highlight-H_ESCALATOR")).toBeTruthy();
  });
});
