import { SymbolView } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';
import { Props as OriginalProps } from './icon-symbol';

interface Props extends Omit<OriginalProps, 'style'> {
  style: StyleProp<ViewStyle>
}

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: Readonly<Props>) {
  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={name}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
