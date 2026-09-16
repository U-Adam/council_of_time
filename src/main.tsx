import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AboutPage } from "./AboutPage";
import { ThemeToggle } from "./ThemeToggle";
import "./tokens.css";
import "./base.css";
import "./home.css";
import "./conversation.css";
import "./about.css";

const isAboutPage = window.location.pathname === "/about" || window.location.pathname.startsWith("/about/");

const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]') ?? document.createElement("link");
favicon.rel = "icon";
favicon.type = "image/svg+xml";
favicon.href = "/favicon-v2.svg";
if (!favicon.parentNode) document.head.appendChild(favicon);

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
    <ThemeToggle />
    {isAboutPage ? <AboutPage /> : <HomeApp />}
  </React.StrictMode>,
);