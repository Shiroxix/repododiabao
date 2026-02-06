import React, { createContext } from "react";

export const AppCtx = createContext({
  demoMode: true,
  tokenPresent: false,
  health: {},
  theme: "purple",
  setTheme: () => {},
  user: null,
  setUser: () => {},
});
