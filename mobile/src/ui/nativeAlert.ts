import { Alert } from "react-native";

export function alert(message: string, title = ""): void {
  Alert.alert(title || " ", message, [{ text: "OK" }]);
}

export function confirm(
  message: string,
  title = ""
): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title || " ", message, [
      { text: "Annuler", style: "cancel", onPress: () => resolve(false) },
      { text: "OK", style: "default", onPress: () => resolve(true) },
    ]);
  });
}

