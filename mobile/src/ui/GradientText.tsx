import React from "react";
import { Text, type TextProps } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  colors: readonly [string, string] | readonly string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
} & TextProps;

export default function GradientText({
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  style,
  children,
  ...props
}: Props) {
  return (
    <MaskedView
      maskElement={
        <Text {...props} style={style}>
          {children}
        </Text>
      }
    >
      <LinearGradient colors={colors as any} start={start} end={end}>
        <Text {...props} style={[style, { opacity: 0 }]}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}

