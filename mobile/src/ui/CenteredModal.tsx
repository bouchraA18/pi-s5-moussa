import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  backdropClassName?: string;
  containerClassName?: string;
};

export default function CenteredModal({
  visible,
  onClose,
  children,
  backdropClassName,
  containerClassName,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (!visible) return;
    opacity.setValue(0);
    scale.setValue(0.96);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        speed: 18,
        bounciness: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacity, scale]);

  const animatedBackdropStyle = useMemo<ViewStyle>(
    () => ({ opacity }),
    [opacity]
  );

  const animatedCardStyle = useMemo<ViewStyle>(
    () => ({ transform: [{ scale }] }),
    [scale]
  );

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View
        className="flex-1 items-center justify-center p-4"
        style={animatedBackdropStyle}
      >
        <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
        <View
          className={backdropClassName || "bg-slate-900/40"}
          style={StyleSheet.absoluteFill}
        />
        <Pressable
          accessibilityRole="button"
          className="absolute inset-0"
          onPress={onClose}
        />
        <Animated.View
          className={[
            "w-full max-w-lg bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-2xl",
            containerClassName || "",
          ].join(" ")}
          style={animatedCardStyle}
        >
          <View>{children}</View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
