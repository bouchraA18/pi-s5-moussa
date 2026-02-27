import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ChevronDown } from "lucide-react-native";
import CenteredModal from "@/ui/CenteredModal";

type Option = { label: string; value: string };

type Props = {
  label: string;
  showLabel?: boolean;
  value: string;
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  labelClassName?: string;
  fieldClassName?: string;
  valueClassName?: string;
  chevronColor?: string;
};

export default function SelectModalField({
  label,
  showLabel = true,
  value,
  options,
  placeholder,
  onChange,
  labelClassName,
  fieldClassName,
  valueClassName,
  chevronColor = "#94a3b8",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);
  const display = selected?.label || placeholder || "";

  return (
    <View className="space-y-2">
      {showLabel ? (
        <Text
          className={[
            "text-sm font-bold text-slate-700",
            labelClassName || "",
          ].join(" ")}
        >
          {label}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        className={[
          "w-full px-4 py-2.5 rounded-xl border",
          "flex-row items-center justify-between",
          fieldClassName || "bg-slate-50 border-slate-200",
        ].join(" ")}
      >
        <Text
          className={[
            "text-sm font-medium",
            value ? "text-slate-900" : "text-slate-400",
            valueClassName || "",
          ].join(" ")}
          numberOfLines={1}
        >
          {display}
        </Text>
        <ChevronDown size={16} color={chevronColor} />
      </Pressable>

      <CenteredModal visible={open} onClose={() => setOpen(false)}>
        <View className="p-6">
          <Text className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-4">
            {label}
          </Text>
          <ScrollView style={{ maxHeight: 320 }}>
            <View className="gap-2">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <Pressable
                    key={opt.value}
                    accessibilityRole="button"
                    onPress={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={[
                      "px-4 py-3 rounded-xl border",
                      isSelected
                        ? "bg-primary-50 border-primary-200"
                        : "bg-white border-slate-200",
                    ].join(" ")}
                  >
                    <Text
                      className={[
                        "font-bold",
                        isSelected ? "text-primary-700" : "text-slate-800",
                      ].join(" ")}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </CenteredModal>
    </View>
  );
}
