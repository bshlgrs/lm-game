import logo from "./logo.svg";
import "./App.css";
import { useState, useRef } from "react";

function App(props) {
  const { tokens, initialDoc } = props;
  // debugger;
  // debugger;
  const [guesses, setGuesses] = useState([""]);
  const [doc, setDoc] = useState(initialDoc);
  const [name, setName] = useState(localStorage.getItem("name") || "anon");

  const [newGuess, setNewGuess] = useState("");

  function getNewDocument() {
    fetch("/get_doc")
      .then((response) => response.json())
      .then((doc) => {
        setDoc(doc);
        setGuesses([""]);
        setNewGuess("");
      });
  }

  function handleKeyPress(e) {
    if (e.key === "Enter" && tokens.indexOf(newGuess) !== -1) {
      setGuesses([...guesses, newGuess]);
      setNewGuess("");
      // submit the guess
      fetch("/submit_guess", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: name,
          guess: newGuess,
          doc_id: doc.docId,
          guessed_token_idx: guesses.length + 1,
          correct_answer: tokens[guesses.length + 1],
        }),
      });
    }
  }

  const numCorrect = guesses
    .map((guess, idx) => guess == doc.tokens[idx])
    .reduce((a, b) => a + b);

  return (
    <div className="App">
      <h1>Language modelling game!</h1>
      <div>
        Read instructions and notes{" "}
        <a href="https://docs.google.com/document/d/1C4FIUv_H5dNW_46ljROCwpkKEFvNMlbVosQOUlHCuMs/edit">
          here
        </a>
      </div>
      <div>
        Your name:{" "}
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            localStorage.setItem("name", e.target.value);
          }}
        />
      </div>
      <div>
        Your score: {numCorrect || "0"} / {guesses.length - 1}{" "}
        {((numCorrect * 100) / (guesses.length - 1)).toFixed(0)}%
      </div>
      <div>You're currently predicting document number {doc.docId}</div>
      <div>
        Remember that if you want to predict a token that starts with a space
        (which you usually do), you need to type that space explicitly. See
        the instructions if you're confused by how the tokenization works.
      </div>
      <div>
        <button onClick={getNewDocument}>Get new document</button>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          margin: "20px",
          borderStyle: "thin",
          fontFamily: 'serif'
        }}
      >
        {guesses.map((guess, idx) => (
          <div
            key={idx}
            style={{
              borderStyle: "thin",
              margin: "2px",
              backgroundColor:
                idx === 0
                  ? "white"
                  : guess === doc.tokens[idx]
                  ? "lightgreen"
                  : "pink",
            }}
          >
            <div>{doc.tokens[idx].replace(" ", "•")}&nbsp;</div>
            {guess !== doc.tokens[idx] && <div>{guess.replace(" ", "•")}</div>}
          </div>
        ))}
        {/* <Select options={options} onChange={(e) => { setGuesses([...guesses, e.value]); }}/> */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderStyle: "thin",
            margin: "2px",
          }}
        >
          <input
            style={{
              borderColor: tokens.indexOf(newGuess) !== -1 ? "black" : "green",
              borderStyle: "solid",
            }}
            value={newGuess}
            onChange={(e) => setNewGuess(e.target.value)}
            onKeyDown={(e) => handleKeyPress(e)}
          />
          <div>
            valid token? {tokens.indexOf(newGuess) !== -1 ? "yes" : "no"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
