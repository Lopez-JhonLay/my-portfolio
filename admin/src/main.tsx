import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { App } from "./app";
import "./admin.css";
import { initializeAdminTheme } from "./lib/admin-theme";

initializeAdminTheme();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Admin application root element was not found.");
}

const router = createBrowserRouter([{ path: "*", element: <App /> }]);

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
