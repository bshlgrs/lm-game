import { useState } from "react";
import "./App.css";

const mulNumber = 400;
const percentages = [99, 90, 80, 70, 60, 50, 40, 30, 20, 10, 1];
const modelNames = ["2 layers", "12 layers", "24 layers"];

// To make the score more readable
const scoreFactor = 1000;

const trainingComparisonStep = 10; //10
const gameComparisonStep = 80 + 1; //80+1
const maxComparisonStep = trainingComparisonStep + gameComparisonStep;

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

function getScoreComponent(score, delta) {
  return (
    <>
      <b>{score.toFixed(0)}</b>{" "}
      <span className="delta">
        {" "}
        ({delta > 0 && "+"}
        {delta.toFixed(0)})
      </span>
    </>
  );
}

function getModelGuess(i, comparison) {
  const p_good = Math.exp(comparison["correct_logprobs"][i]);
  const p_bad = Math.exp(comparison["generated_logprobs"][i]);
  const ratio = p_good / (p_good + p_bad);
  let guess = Math.round(ratio * 10) * 10; // round to 0, 10, ..., or 100
  if (guess === 0) guess = 1;
  if (guess === 100) guess = 99;
  return guess;
}

function WhichOneScored2App(props) {
  const { initialComparison, lowestComparisonId } = props;

  const [name, setName] = useState(localStorage.getItem("name") || "anon");
  const comparisonNb = ((hashCode(name) % mulNumber) + mulNumber) % mulNumber;

  const [comparison, setComparison] = useState(
    makeMultiComparisonComparison(initialComparison)
  );
  const [correctToTheLeft, setCorrectToTheLeft] = useState(randomBool());

  const [guess, setGuess] = useState(-1);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [error, setError] = useState("");

  const [score, setScore] = useState(0);
  const [lastDelta, setLastDelta] = useState(0);

  const [modelsScore, setModelsScore] = useState([0, 0, 0]);
  const [modelsLastDelta, setModelsLastDelta] = useState([0, 0, 0]);

  const [comparisonStep, setComparisonStep] = useState(1);
  const inTraining = comparisonStep <= trainingComparisonStep;
  const inTrueGame = !inTraining && comparisonStep < maxComparisonStep;
  const gameOver = comparisonStep >= maxComparisonStep;

  const [showScoreDetails, setShowScoreDetails] = useState(false);
  const [showModelsScores, setShowModelsScores] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  function changeName(newName) {
    setName(newName);
    if (comparisonStep > 1) {
      setComparisonStep(0);
      goToNextComparison(0);
    }
  }

  function resetScores() {
    setScore(0);
    setLastDelta(0);
    setModelsScore([0, 0, 0]);
    setModelsLastDelta([0, 0, 0]);
  }

  function skipToTrueGame() {
    setComparisonStep(trainingComparisonStep);
    goToNextComparison(trainingComparisonStep);
    resetScores();
  }

  // function skipToPlayForFun() {
  //   setComparisonStep(maxComparisonStep);
  //   goToNextComparison(maxComparisonStep);
  //   setScore(0);
  // }
  function makeMultiComparisonComparison(comparison) {
    comparison["generated_logprobs"] = comparison["generated_logprobss"].map(
      function (a) {
        return a[comparisonNb];
      }
    );
    comparison["generated_token_str"] =
      comparison["generated_token_strs"][comparisonNb];
    return comparison;
  }

  function getNewComparison(step) {
    if (step === trainingComparisonStep) {
      resetScores();
    }

    fetch("/get_multi_comparison/" + (step + lowestComparisonId))
      .then((response) => response.json())
      .then((comparison) => {
        // Convert multi comparison to simple comparison

        makeMultiComparisonComparison(comparison);
        if (
          comparison["generated_token_str"] === comparison["correct_token_str"]
        ) {
          if (inTrueGame) sendAnswer(comparison, 50);
          getNewComparison(step + 1);
        } else {
          setComparison(comparison);
          setComparisonStep(step + 1);
          setIsLoading(false);
        }
      });
    if (maxComparisonStep - 1 === step) {
      fetch("/submit_whichonescored_leaderboard", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: name + " (v2)",
          score: Math.round(score),
        }),
      });
    }
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
    setIsLoading(true);
    setCorrectToTheLeft(randomBool());
    getNewComparison(step);
    setError("");
  }
  function handleSubmit(e) {
    if (guess === -1) {
      setError("Please give your confidence level.");
      return;
    }

    // compute your delta
    const delta = computeDelta(
      comparison,
      computeAbsoluteGuess(guess, correctToTheLeft)
    );
    setLastDelta(delta);

    //Compute models delta
    const modelNewDelta = modelNames.map(function (_, i) {
      const g = getModelGuess(i, comparison);
      return computeDelta(comparison, g);
    });
    setModelsLastDelta(modelNewDelta);
    setModelsScore(
      modelsScore.map(function (score, i) {
        return score + modelNewDelta[i];
      })
    );

    setScore((score) => score + delta);
    setHasGuessed(true);
    if (inTrueGame) {
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
        {"  "}Show score details{" "}
        <input
          type="checkbox"
          checked={showScoreDetails}
          onChange={function () {
            setShowScoreDetails(!showScoreDetails);
          }}
        />
        {"  "}Show models score{" "}
        <input
          type="checkbox"
          checked={showModelsScores}
          onChange={function () {
            setShowModelsScores(!showModelsScores);
          }}
        />
      </div>
      <div className={showModelsScores ? "score-grid" : ""}>
        <div>Your current score: {getScoreComponent(score, lastDelta)}</div>
        {showModelsScores &&
          modelNames.map(function (name, i) {
            return (
              <div>
                {name}: {getScoreComponent(modelsScore[i], modelsLastDelta[i])}
                {hasGuessed && (
                  <>
                    {" "}
                    (
                    {computeAbsoluteGuess(
                      // Put it on the right scale (the inverse of computeAbsoluteGuess is computeAbsoluteGuess)
                      getModelGuess(i, comparison),
                      correctToTheLeft
                    )}
                    %)
                  </>
                )}
              </div>
            );
          })}
      </div>
      {hasGuessed && showScoreDetails && (
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
              {computeAbsoluteGuess(guess, correctToTheLeft) / 100} / 0.5)
            </span>
          </div>
          <div>
            = 1000 * P(token according to the model, against all other tokens) *
            log(your probability / 0.5)
          </div>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center" }}>
        {inTraining ? (
          <>
            <p>
              You are currently in training mode. Please train a bit to
              understand how the scoring system works, then launch the true
              game.{" "}
            </p>
            <button
              onClick={skipToTrueGame}
              style={{ height: "2em", flexShrink: 0 }}
            >
              Start the true game
            </button>
          </>
        ) : gameOver ? (
          <p>
            <b>Thank you for playing!</b>
          </p>
        ) : (
          <p>
            You are currenly playing the true game. Think wisely! If you want to
            train more,{" "}
            <a href="https://rr-lm-game.herokuapp.com/whichonescoredold">
              click here
            </a>
            .
          </p>
        )}
      </div>
      {isLoading && <p>Loading...</p>}
      {!gameOver && !isLoading && (
        <>
          <p>
            Read the following prompt. Token A or token B is a token that
            appeared next in the original text. The other one was generated by a
            language model. How confident are you that <b>token A</b> is the one
            that appeared in the original text?
          </p>
          <p>
            {inTraining && (
              <>
                Training progress:{" "}
                {((100 * comparisonStep) / trainingComparisonStep).toFixed(0)}%{" "}
              </>
            )}
            {inTrueGame && (
              <>
                True game progress:{" "}
                {(
                  (100 * (comparisonStep - trainingComparisonStep)) /
                  (maxComparisonStep - trainingComparisonStep)
                ).toFixed(0)}
                %{" "}
              </>
            )}
            (comparison number: {comparison.id})
          </p>
          <p className={inTrueGame ? "prompt prompt-activated" : "prompt"}>
            {addInvisibleTokenToText(comparison.input_str)}
          </p>
          <div className="token-list">
            <div
              className={correctToTheLeft && hasGuessed ? "token-correct" : ""}
            >
              <p>Token A</p>
              <p>
                <b>
                  {addInvisibleTokenToText(
                    getLeftToken(comparison, correctToTheLeft)
                  )}
                </b>
              </p>
            </div>
            <div
              className={!correctToTheLeft && hasGuessed ? "token-correct" : ""}
            >
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
                goToNextComparison(comparisonStep);
              }}
              disabled={!hasGuessed}
            >
              Next completion
            </button>
          </div>

          <p className="error">{error}</p>
          <br />
        </>
      )}
    </div>
  );
}

export default WhichOneScored2App;
