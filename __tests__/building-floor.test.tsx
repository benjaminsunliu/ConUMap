import BuildingFloor from "@/components/map/building-floor";
import { render } from "@testing-library/react-native";

describe("building floor", () => {
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
      },
    },
    images: {
      1: require("@/data/indoorMapData/images/H/H1.png"),
    },
  };

  it("Should render", () => {
    render(<BuildingFloor floor={1} info={baseInfo} />);
  });

  it("highlights the active edge while dimming other edges in step mode", () => {
    const { getByTestId } = render(
      <BuildingFloor
        floor={1}
        info={baseInfo}
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
});
