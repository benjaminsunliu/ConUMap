declare module "react-native-switch-selector" {
  import { Component } from "react";

  interface Props {
    initial: number;
    value?: number;
    textColor: string;
    selectedColor: string;
    buttonColor: string;
    borderColor: string;
    backgroundColor: string;
    disableValueChangeOnPress?: boolean;
    bold?: boolean;
    fontSize?: number;
    hasPadding?: boolean;
    options?: object[];
    testID?: string;
    accessibilityLabel?: string;
    borderRadius?: number;
    height?: number;
    onPress: (value: number) => void;
  }

  export default class SwitchSelector extends Component<Props, any> {
    constructor(props: Props);
  }
}
