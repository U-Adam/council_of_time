import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AboutPage } from "./AboutPage";
import "./styles.css";
import "./attribution.css";
import "./artist-witness.css";
import "./about.css";
import "./brand.css";

const isAboutPage = window.location.pathname === "/about" || window.location.pathname.startsWith("/about/");

function HomeApp() {
  return (
    <div
      onClickCapture={(event) => {
        const target = event.target as Element;
        if (!target.closest(".about-button")) return;
        event.stopPropagation();
        window.location.assign("/about");
      }}
    >
      <App />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isAboutPage ? <AboutPage /> : <HomeApp />}
  </React.StrictMode>,
);
