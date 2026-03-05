import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { Loader2 } from "lucide-react-native";

type Props = {
  children?: React.ReactNode;
  color?: string;
  size?: number;
};

export default function SpinningIcon({
  children,
  color = "#64748b",
  size = 18,
}: Props) {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [rotate]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <View>{children ?? <Loader2 size={size} color={color} />}</View>
    </Animated.View>
  );
}
