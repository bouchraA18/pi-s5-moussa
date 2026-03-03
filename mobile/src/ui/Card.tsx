import React from "react";
import { View } from "react-native";
import type { ViewProps } from "react-native";

type Props = {
  className?: string;
} & Omit<ViewProps, "className">;

export default function Card({ className, ...props }: Props) {
  return (
    <View
      className={[
        "bg-white rounded-2xl shadow-sm border border-slate-100",
        className || "",
      ].join(" ")}
      {...props}
    />
  );
}

