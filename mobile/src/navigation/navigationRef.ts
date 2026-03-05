import React from "react";

import type { RootStackParamList } from "@/navigation/types";

type RouteName = keyof RootStackParamList;
type Listener = () => void;

let currentRoute: RouteName = "Login";
const listeners = new Set<Listener>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCurrentRoute(): RouteName {
  return currentRoute;
}

export function navigate<T extends RouteName>(
  routeName: T,
  _params?: RootStackParamList[T]
) {
  if (currentRoute === routeName) return;
  currentRoute = routeName;
  emitChange();
}

export function useCurrentRoute() {
  return React.useSyncExternalStore(
    subscribe,
    getCurrentRoute,
    getCurrentRoute
  );
}

export const navigationRef = {
  isReady() {
    return true;
  },
  navigate,
};
