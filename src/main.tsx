import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AboutPage } from "./AboutPage";
import "./styles.css";
import "./attribution.css";
import "./artist-witness.css";
import "./about.css";

const isAboutPage = window.location.pathname === "/about" || window.location.pathname.startsWith("/about/");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isAboutPage ? <AboutPage /> : <App />}
  </React.StrictMode>,
);
