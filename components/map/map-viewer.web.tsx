import { CoordinateDelta, Region } from "@/types/mapTypes";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

interface Props {
  readonly userLocationDelta?: CoordinateDelta;
  readonly initialRegion?: Region;
}

type ClientMapComponent = React.ComponentType<Props>;

export default function MapViewer(props: Props) {
  const [ClientMap, setClientMap] = useState<ClientMapComponent | null>(null);

  useEffect(() => {
    let mounted = true;

    Promise.resolve()
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      .then(() => require("./map-viewer.web.client"))
      .then((module) => {
        if (!mounted) {
          return;
        }
        setClientMap(() => module.default);
      })
      .catch((error) => {
        console.error("Failed to load web map module:", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!ClientMap) {
    return <View style={styles.placeholder} />;
  }

  return <ClientMap {...props} />;
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
  },
});
