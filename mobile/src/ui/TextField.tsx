import React from "react";
import { Text, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";

type Props = {
  label: string;
  left?: React.ReactNode;
  helperText?: string;
  errorText?: string;
  inputClassName?: string;
} & TextInputProps;

export default function TextField({
  label,
  left,
  helperText,
  errorText,
  inputClassName,
  ...props
}: Props) {
  const helper = errorText || helperText;
  const helperClassName = errorText ? "text-red-600" : "text-slate-400";

  return (
    <View className="space-y-2">
      <Text className="text-sm font-bold text-slate-700">{label}</Text>
      <View className="relative">
        {left ? <View className="absolute left-4 top-3.5">{left}</View> : null}
        <TextInput
          className={[
            "w-full py-3.5 bg-slate-50 border border-slate-200 rounded-xl",
            "outline-none font-medium text-slate-900",
            left ? "pl-12 pr-4" : "px-4",
            inputClassName || "",
          ].join(" ")}
          placeholderTextColor="#94a3b8"
          {...props}
        />
      </View>
      {helper ? (
        <Text className={["text-xs font-medium", helperClassName].join(" ")}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

