import React from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

const container = document.getElementById("root")!;
const root = createRoot(container);

function captureTokenFromUrl() {
  const hash = new URLSearchParams(window.location.hash.replace("#", ""));
  const token = hash.get("token");
  if (token) {
    localStorage.setItem("auth_token", token);
    history.replaceState({}, document.title, window.location.pathname);
  }
}
captureTokenFromUrl();

root.render(
  <ChakraProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ChakraProvider>
);
