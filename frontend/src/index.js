import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import WhichOneApp from "./WhichOneApp";
import WhichOneScoredApp from "./WhichOneScoredApp";
import reportWebVitals from "./reportWebVitals";
import LeaderBoard from "./LeaderBoard";

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
} else if (pathname === "/whichonescored") {
  fetch("/get_comparison")
    .then((response) => response.json())
    .then((doc) => {
      root.render(
        <React.StrictMode>
          <WhichOneScoredApp initialComparison={doc} />
        </React.StrictMode>
      );
    });
} else if (pathname === "/whichonescoredleaderboard") {
  fetch("/get_leaderboard")
    .then((response) => response.json())
    .then((leaderboard) => {
      root.render(
        <React.StrictMode>
          <LeaderBoard leaderboard={leaderboard} />
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
