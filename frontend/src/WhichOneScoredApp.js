import { useState } from "react";
import "./App.css";

const mulNumber = 400;
const percentages = [99, 90, 80, 70, 60, 50, 40, 30, 20, 10, 1];

// To make the score more readable
const scoreFactor = 1000;

const maxComparisonStep = 40;

function randomBool() {
  return Math.random() < 0.5;
}

function getLeftToken(comparison, correctToTheLeft) {
  if (correctToTheLeft) {
    return comparison.correct_token_str;
  } else {
    return comparison.generated_token_str;
  }
}
function getRightToken(comparison, correctToTheLeft) {
  if (correctToTheLeft) {
    return comparison.generated_token_str;
  } else {
    return comparison.correct_token_str;
  }
}

function addInvisibleTokenToText(text) {
  return (
    <>
      {text.split("").map(function (c) {
        if (c === " ")
          return (
            <>
              <span className="invisible-space"> </span>
              <span className="invisible-letter">•</span>
            </>
          );
        else if (c === "\n")
          return <span className="invisible-letter">\n</span>;
        else return c;
      })}
    </>
  );
}

function computeAbsoluteGuess(guess, correctToTheLeft) {
  return correctToTheLeft ? guess : 100 - guess;
}

function computeDelta(comparison, guess) {
  return (
    scoreFactor *
    (Math.exp(comparison.correct_logprobs[comparison.generator_index]) *
      (Math.log(guess / 100) - Math.log(0.5)))
  );
}

function hashCode(s) {
  return s.split("").reduce(function (a, b) {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
}

function WhichOneScoredApp(props) {
  const { initialComparison } = props;

  const [name, setName] = useState(localStorage.getItem("name") || "anon");
  const comparisonNb = ((hashCode(name) % mulNumber) + mulNumber) % mulNumber;

  const [comparison, setComparison] = useState(initialComparison);
  const [correctToTheLeft, setCorrectToTheLeft] = useState(randomBool());

  const [guess, setGuess] = useState(-1);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [error, setError] = useState("");
  const [score, setScore] = useState(0);
  const [lastDelta, setLastDelta] = useState(0);

  const [comparisonStep, setComparisonStep] = useState(-1); // -1 when in training

  function changeName(newName) {
    setName(newName);
    if (comparisonStep !== -1) {
      setComparisonStep(-1);
      goToNextComparison(-1);
    }
  }

  function startTrueGame() {
    setComparisonStep(0);
    goToNextComparison(0);
    setScore(0);
  }

  function getNewComparison(step) {
    if (maxComparisonStep === step) {
      setComparisonStep(-2);
    }
    if (step !== undefined && step >= 0 && maxComparisonStep !== step) {
      fetch("/get_multi_comparison/" + step)
        .then((response) => response.json())
        .then((comparison) => {
          // Convert multi comparison to simple comparison
          comparison["generated_logprobs"] = comparison[
            "generated_logprobss"
          ].map(function (a) {
            return a[comparisonNb];
          });
          comparison["generated_token_str"] =
            comparison["generated_token_strs"][comparisonNb];
          if (
            comparison["generated_token_str"] ===
            comparison["correct_token_str"]
          ) {
            sendAnswer(comparison, 50);
            getNewComparison(step + 1);
          } else {
            setComparison(comparison);
            setComparisonStep(step + 1);
          }
        });
    } else
      fetch("/get_comparison")
        .then((response) => response.json())
        .then((comparison) => {
          setComparison(comparison);
        });
  }

  function sendAnswer(comparison, guess) {
    fetch("/submit_whichone_scored_guess", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: name,
        guess: computeAbsoluteGuess(guess, correctToTheLeft),
        comparison_id: comparison.id,
        comparison_number: comparisonNb,
      }),
    });
  }

  function goToNextComparison(step) {
    setGuess(-1);
    setHasGuessed(false);
    getNewComparison(step);
    setCorrectToTheLeft(randomBool());
    setError("");
  }
  function handleSubmit(e) {
    if (guess === -1) {
      setError("Please give your confidence level.");
      return;
    }
    const delta = computeDelta(
      comparison,
      computeAbsoluteGuess(guess, correctToTheLeft)
    );
    setLastDelta(delta);
    setScore((score) => score + delta);
    setHasGuessed(true);
    if (comparisonStep >= 1) {
      sendAnswer(comparison, guess);
    }
  }

  return (
    <div className="whichone-App">
      <h1>A new language modelling game!</h1>
      <p>
        Read instructions and notes{" "}
        <a href="https://docs.google.com/document/d/1MrL5_C3TNkml1MDRVvMg_c8WgXggOWmGEIwGHc1bJ1A/edit?usp=sharing">
          here
        </a>
        .To get a score as high as possible, simply put how likely the left
        token is in this context compared to the right token. (Don't overthink
        this: you should play as if you were choosing between the true next
        token and another one chosen uniformly at random between all other
        tokens, so don't hesitate to put high probability on one token if you
        think the other is highly unlikely. For more details, please check out
        the notes.)
      </p>
      <div>
        Your name:{" "}
        <input
          value={name}
          onChange={(e) => {
            changeName(e.target.value);
            localStorage.setItem("name", e.target.value);
          }}
        />
      </div>
      <div>
        Your current score: <b>{score.toFixed(0)}</b>
      </div>
      {hasGuessed && (
        <div>
          <div>
            Your last guess' score:
            <span className="delta">
              {" "}
              {lastDelta > 0 && "+"}
              {lastDelta.toFixed(0)} = 1000 *
              {Math.exp(
                comparison.correct_logprobs[comparison.generator_index]
              ).toPrecision(2)}
              * log(
              {computeAbsoluteGuess(guess, correctToTheLeft) / 100})
            </span>
          </div>
          <div>
            = 1000 * P(token according to the model, against all other tokens) *
            log(your odd ratio toward the correct answer)
          </div>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center" }}>
        {comparisonStep === -1 ? (
          <>
            <p>
              You are currently in training mode. Please train a bit to
              understand how the scoring system works, then launch the true
              game.{" "}
            </p>
            <button
              onClick={startTrueGame}
              style={{ height: "2em", flexShrink: 0 }}
            >
              Start the true game
            </button>
          </>
        ) : comparisonStep === -2 ? (
          <p>
            <b>Thank you for playing!</b>
          </p>
        ) : (
          <p>You are currenly playing the true game. Think wisely!</p>
        )}
      </div>
      <p>
        Read the following prompt. Token A or token B is a token that appeared
        next index the original text. The other one was generated by a language
        model. How confident are you that <b>token A</b> is the one that
        appeared in the original text?
      </p>
      <p>
        {comparisonStep >= 0 && (
          <>
            Progress: {((100 * comparisonStep) / maxComparisonStep).toFixed(0)}%{" "}
          </>
        )}
        (comparison number: {comparison.id})
      </p>
      <p className={comparisonStep >= 0 ? "prompt prompt-activated" : "prompt"}>
        {addInvisibleTokenToText(comparison.input_str)}
      </p>
      <div className="token-list">
        <div className={correctToTheLeft && hasGuessed ? "token-correct" : ""}>
          <p>Token A</p>
          <p>
            <b>
              {addInvisibleTokenToText(
                getLeftToken(comparison, correctToTheLeft)
              )}
            </b>
          </p>
        </div>
        <div className={!correctToTheLeft && hasGuessed ? "token-correct" : ""}>
          <p>Token B</p>
          <p>
            <b>
              {addInvisibleTokenToText(
                getRightToken(comparison, correctToTheLeft)
              )}
            </b>
          </p>
        </div>
      </div>
      <div className="radios">
        <p>A is more likely to be correct</p>
        {percentages.map(function (percent, i) {
          return (
            <label key={`percentage_${i}`}>
              {percent}%<br />
              <input
                type="radio"
                id={`percentage_${i}`}
                value={percent}
                checked={guess === percent}
                onChange={function () {
                  if (!hasGuessed) {
                    setGuess(percent);
                    setError("");
                  }
                }}
              />
            </label>
          );
        })}
        <p>B is more likely to be correct</p>
      </div>

      <div className="submit-button">
        <button onClick={handleSubmit} disabled={hasGuessed}>
          {hasGuessed ? "Submitted" : "Submit guess"}
        </button>
        <span style={{ width: "2em" }} />
        <button
          onClick={function () {
            if (comparisonStep >= 0) goToNextComparison(comparisonStep);
            else goToNextComparison();
          }}
          disabled={!hasGuessed}
        >
          Next completion
        </button>
      </div>

      <p className="error">{error}</p>
      <br />
    </div>
  );
}

export default WhichOneScoredApp;
