import React from "react";
import { Pressable, Text, View } from "react-native";
import type { PressableProps } from "react-native";

type Variant = "primary" | "amber" | "danger" | "outline" | "ghost";

type Props = {
  label: string;
  variant?: Variant;
  loading?: boolean;
  left?: React.ReactNode;
} & Omit<PressableProps, "children">;

const variantClassName: Record<Variant, string> = {
  primary:
    "bg-primary-600 active:bg-primary-700 shadow-lg shadow-primary-600/30",
  amber: "bg-amber-600 active:bg-amber-700 shadow-lg shadow-amber-200",
  danger: "bg-red-500 active:bg-red-600 shadow-lg shadow-red-500/20",
  outline: "bg-white border border-slate-200 active:bg-slate-50",
  ghost: "bg-transparent active:bg-slate-100",
};

const textClassName: Record<Variant, string> = {
  primary: "text-white",
  amber: "text-white",
  danger: "text-white",
  outline: "text-slate-700",
  ghost: "text-slate-700",
};

export default function Button({
  label,
  variant = "primary",
  loading,
  left,
  disabled,
  ...props
}: Props) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={[
        "w-full py-4 rounded-xl font-black",
        "items-center justify-center",
        "active:scale-[0.98]",
        isDisabled ? "opacity-70" : "opacity-100",
        variantClassName[variant],
      ].join(" ")}
      {...props}
    >
      <View className="flex-row items-center justify-center gap-2">
        {left}
        <Text
          className={[
            "text-sm font-black uppercase tracking-wider",
            textClassName[variant],
          ].join(" ")}
        >
          {loading ? "Chargement..." : label}
        </Text>
      </View>
    </Pressable>
  );
}

