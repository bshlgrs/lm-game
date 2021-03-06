import { useState } from "react";
import "./App.css";

const score_mult = 1.0 / 100;
const targetScore = 500;
const percentages = [99, 90, 80, 70, 60, 50, 40, 30, 20, 10, 1];
const modelNames = [
  "2 layers",
  "12 layers",
  "24 layers",
  "Ada",
  "Babbage",
  "Curie",
];

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

function computeDelta(comparison, guess) {
  const target = comparison.correct_token_is_a ? 100 : 0;
  return (50 * 50 - (target - guess) * (target - guess)) * score_mult;
}

function getScoreComponent(score, delta) {
  return (
    <>
      <b>{score.toFixed(0)}</b>
      {"pts "}
      <span className="delta">
        {" "}
        ({delta > 0 && "+"}
        {delta.toFixed(0)})
      </span>
    </>
  );
}

function getModelGuess(i, comparison) {
  const p_a = Math.exp(Math.max(comparison["logp_a"][i], -30));
  const p_the = Math.exp(Math.max(comparison["logp_the"][i]));
  const ratio = p_a / (p_a + p_the);
  let guess = Math.round(ratio * 10) * 10; // round to 0, 10, ..., or 100
  if (guess === 0) guess = 1;
  if (guess === 100) guess = 99;
  return guess;
}

function AvsTheApp(props) {
  const { initialComparison, start } = props;

  const [comparison, setComparison] = useState(initialComparison);
  const a_is_correct = comparison["correct_token_is_a"];

  const [guess, setGuess] = useState(-1);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [error, setError] = useState("");

  const [score, setScore] = useState(0);
  const [lastDelta, setLastDelta] = useState(0);

  const [modelsScore, setModelsScore] = useState(modelNames.map((_) => 0));
  const [modelsLastDelta, setModelsLastDelta] = useState(
    modelNames.map((_) => 0)
  );

  const maxScore = Math.max(score, ...modelsScore);

  const [comparisonStep, setComparisonStep] = useState(start);

  const [isLoading, setIsLoading] = useState(false);

  function getNewComparison(step) {
    fetch("/get_a_vs_the/" + step)
      .then((response) => response.json())
      .then((comparison) => {
        setComparison(comparison);
        setComparisonStep(step + 1);
        setIsLoading(false);
      });
  }

  function getScoreBarComponent(score, maxScore, lastDelta, text, guess) {
    const fullBarScore = Math.max(maxScore, targetScore);
    const percentageOfMax = score / fullBarScore;
    const percentageOfMaxPreDekta = Math.min(
      (score - lastDelta) / fullBarScore,
      percentageOfMax
    );

    return (
      <div className="score-bar-holder">
        <div
          className="score-bar top-score-bar"
          style={{
            width: (70 * percentageOfMaxPreDekta).toFixed(0) + "%",
          }}
        ></div>
        <div
          className="score-bar full-score-bar"
          style={{
            width: (70 * percentageOfMax).toFixed(0) + "%",
          }}
        ></div>

        <span>
          {text}: {getScoreComponent(score, lastDelta)}{" "}
          {guess !== undefined && <>({guess} %)</>}
        </span>
      </div>
    );
  }

  function goToNextComparison(step) {
    setGuess(-1);
    setHasGuessed(false);
    setIsLoading(true);
    getNewComparison(step);
    setError("");
  }
  function handleSubmit(e) {
    if (guess === -1) {
      setError("Please give your confidence level.");
      return;
    }

    // compute your delta
    const delta = computeDelta(comparison, guess);
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
  }

  return (
    <div className="whichone-App">
      <h1>A or The?</h1>
      <p>
        Language model can do some tasks much better than humans, even when the
        try hard. Guessing whether the next token is "
        {addInvisibleTokenToText(" a")}" or "{addInvisibleTokenToText(" the")}"
        is one of them.
      </p>
      <p>
        The additional score is (50² - (guess - target)²)/100 (where target =
        100 if the correct answer is " a", and 0 if it is " the")
      </p>
      <div
        style={{
          backgroundColor: "red",
          width: (score / 10).toFixed(0) + "px",
        }}
      ></div>
      <div className="score-bars-container">
        {getScoreBarComponent(score, maxScore, lastDelta, "You")}
        {/* <div>Your current score: {getScoreComponent(score, lastDelta)}</div> */}
        {modelNames.map(function (name, i) {
          const guess = hasGuessed ? getModelGuess(i, comparison) : undefined;
          return getScoreBarComponent(
            modelsScore[i],
            maxScore,
            modelsLastDelta[i],
            name,
            guess
          );
        })}
      </div>
      {isLoading && <p>Loading...</p>}
      {!isLoading && (
        <>
          <p>
            Read the following prompt. Token "{addInvisibleTokenToText(" a")}"
            or token "{addInvisibleTokenToText(" the")}" is a token that
            appeared next in the original text. How confident are you that "
            <b>{addInvisibleTokenToText(" a")}</b>"" is the one that appeared in
            the original text?
          </p>
          <p>
            (comparison id: {comparison.sentence_nb} - input id: {comparison.id}
            )
          </p>
          <p className="prompt">
            {addInvisibleTokenToText(comparison.input_str)}
          </p>
          <div className="radios">
            <p className={a_is_correct && hasGuessed ? "side-correct" : ""}>
              <b>{addInvisibleTokenToText(" a")}</b>{" "}
              {hasGuessed ? (
                <>is {a_is_correct ? "" : "not "}correct!</>
              ) : (
                <>is more likely to be correct</>
              )}
            </p>
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
            <p className={!a_is_correct && hasGuessed ? "side-correct" : ""}>
              <b>{addInvisibleTokenToText(" the")}</b>{" "}
              {hasGuessed ? (
                <>is {!a_is_correct ? "" : "not "}correct!</>
              ) : (
                <>is more likely to be correct</>
              )}
            </p>
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

export default AvsTheApp;
