import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from 'react-router-dom';
// @ts-ignore: Allow importing CSS for side effects
import "./index.css";
import App from "./App";

// Allow importing CSS modules in this file for TypeScript
// Note: Module declarations must live in a .d.ts file. Remove inline declaration to
// avoid TS errors. Create a global.d.ts with the following if needed:
// declare module "*.css" { const classes: { [key: string]: string }; export default classes; }

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);

// Touch file to trigger Vite HMR reload
