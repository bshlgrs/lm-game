import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import WhichOneApp from "./WhichOneApp";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));

const pathname = window.location.pathname;
console.log(pathname);
if (pathname === "/whichone") {
  fetch("/get_comparison")
    .then((response) => response.json())
    .then((doc) => {
      root.render(
        <React.StrictMode>
          <WhichOneApp initialComparison={doc} />
        </React.StrictMode>
      );
    });
} else {
  fetch("/tokens")
    .then((response) => response.json())
    .then((tokens) => {
      fetch("/get_doc")
        .then((response) => response.json())
        .then((doc) => {
          root.render(
            <React.StrictMode>
              <App tokens={tokens} initialDoc={doc} />
            </React.StrictMode>
          );
        });
    });
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
