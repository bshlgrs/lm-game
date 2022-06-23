import "./App.css";

function LeaderBoard(props) {
  const { leaderboard } = props;

  return (
    <div className="whichone-App">
      <h1>Language modelling game!</h1>
      <h2>Leaderboard</h2>
      {leaderboard.map(function (v) {
        return (
          <p>
            {v.username} {v.score}
          </p>
        );
      })}
    </div>
  );
}

export default LeaderBoard;
