import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";

type Props = {
  children: React.ReactNode;
};

export default function SpinningIcon({ children }: Props) {
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
      <View>{children}</View>
    </Animated.View>
  );
}

