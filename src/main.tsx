import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="dark">
      <App />
    </MantineProvider>
  </React.StrictMode>
);
