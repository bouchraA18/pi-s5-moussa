import React from "react";
import { Platform, Pressable, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar, Clock } from "lucide-react-native";
import CenteredModal from "@/ui/CenteredModal";

type Mode = "date" | "time";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatTime(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function parseTime(value: string): Date {
  const now = new Date();
  const [hh, mm] = value.split(":").map((x) => parseInt(x, 10));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return now;
  const d = new Date(now);
  d.setHours(hh);
  d.setMinutes(mm);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
}

function parseDate(value: string): Date {
  if (!value) return new Date();
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

type Props = {
  label: string;
  showLabel?: boolean;
  mode: Mode;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  clearOnLongPress?: boolean;
  labelClassName?: string;
  fieldClassName?: string;
  valueClassName?: string;
};

export default function DateTimeField({
  label,
  showLabel = true,
  mode,
  value,
  onChange,
  placeholder,
  clearOnLongPress,
  labelClassName,
  fieldClassName,
  valueClassName,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const initial =
    mode === "time" ? (value ? parseTime(value) : new Date()) : parseDate(value);
  const [temp, setTemp] = React.useState<Date>(initial);

  React.useEffect(() => {
    setTemp(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const display = value || placeholder || "";
  const Icon = mode === "time" ? Clock : Calendar;

  const commit = (d: Date) => {
    if (mode === "time") onChange(formatTime(d));
    else onChange(d.toISOString().split("T")[0]);
  };

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
        onLongPress={() => {
          if (clearOnLongPress && value) onChange("");
        }}
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
        >
          {display}
        </Text>
        <Icon size={16} color="#94a3b8" />
      </Pressable>

      <CenteredModal visible={open} onClose={() => setOpen(false)}>
        <View className="p-6 gap-4">
          <Text className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">
            {label}
          </Text>
          <View className="rounded-2xl overflow-hidden bg-white">
            <DateTimePicker
              value={temp}
              mode={mode}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              is24Hour
              {...(Platform.OS === "ios"
                ? ({
                    themeVariant: "light",
                    textColor: "#0f172a",
                    style: { backgroundColor: "#ffffff" },
                  } as const)
                : {})}
              onChange={(_, selected) => {
                if (!selected) return;
                setTemp(selected);
                if (Platform.OS !== "ios") {
                  commit(selected);
                  setOpen(false);
                }
              }}
            />
          </View>

          {Platform.OS === "ios" ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                commit(temp);
                setOpen(false);
              }}
              className="w-full py-4 bg-primary-600 rounded-xl items-center justify-center active:scale-[0.98]"
            >
              <Text className="text-white font-black text-sm uppercase tracking-widest">
                Confirmer
              </Text>
            </Pressable>
          ) : null}
        </View>
      </CenteredModal>
    </View>
  );
}
