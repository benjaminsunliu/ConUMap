import BuildingFloor from "@/components/map/building-floor";
import { render } from "@testing-library/react-native";

describe("building floor", () => {
  it("Should render", () => {
    render(
      <BuildingFloor
        floor={1}
        info={{
          buildingCode: "H",
          graphData: {
            adjacencySet: {},
            checkpoints: {},
          },
          images: {
            1: require("@/data/indoorMapData/images/H/H1.png"),
          },
        }}
      />,
    );
  });
});
