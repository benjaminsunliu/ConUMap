import MapViewer from "@/components/map/map-viewer";
import { IS_E2E } from "@/utils/e2e";
import React from "react";


export default function MapTab() {
  return <MapViewer isE2E={IS_E2E} />;
}
