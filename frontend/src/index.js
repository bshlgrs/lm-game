import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import WhichOneApp from "./WhichOneApp";
import WhichOneScoredApp from "./WhichOneScoredApp";
import WhichOneScored2App from "./WhichOneScored2App";
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
} else if (pathname === "/whichonescoredold") {
  fetch("/get_comparison")
    .then((response) => response.json())
    .then((doc) => {
      root.render(
        <React.StrictMode>
          <WhichOneScoredApp initialComparison={doc} />
        </React.StrictMode>
      );
    });
} else if (pathname === "/whichonescored2" || pathname === "/whichonescored") {
  fetch("/get_multi_comparison/20000")
    .then((response) => response.json())
    .then((doc) => {
      root.render(
        <React.StrictMode>
          <WhichOneScored2App
            initialComparison={doc}
            lowestComparisonId={20000}
          />
        </React.StrictMode>
      );
    });
} else if (pathname === "/whichonescored3") {
  fetch("/get_multi_comparison/20100")
    .then((response) => response.json())
    .then((doc) => {
      root.render(
        <React.StrictMode>
          <WhichOneScored2App
            initialComparison={doc}
            lowestComparisonId={20100}
          />
        </React.StrictMode>
      );
    });
} else if (pathname === "/whichonescored4") {
  fetch("/get_multi_comparison/20200")
    .then((response) => response.json())
    .then((doc) => {
      root.render(
        <React.StrictMode>
          <WhichOneScored2App
            initialComparison={doc}
            lowestComparisonId={20200}
          />
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
