const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
app.use(express.json());

const initializingDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running");
    });
  } catch (e) {
    console.log(`DB error : ${e.message}`);
    process.exit(1);
  }
};
initializingDBAndServer();

//converting playerDetails
const convertPlayerDetails = (newObject) => {
  return {
    playerId: newObject.player_id,
    playerName: newObject.player_name,
  };
};
//converting matchDetails
const convertMatchDetails = (newObject) => {
  return {
    matchId: newObject.match_id,
    match: newObject.match,
    year: newObject.year,
  };
};
//convert matchScoreDetails
const convertMatchScoreDetails = (newObject) => {
  return {
    playerId: newObject.player_id,
    playerName: newObject.player_name,
    totalScore: newObject.score,
    totalFours: newObject.fours,
    totalSixes: newObject.sixes,
  };
};

//get all players in player table
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT *
    FROM player_details;`;
  const playersList = await db.all(getPlayersQuery);
  const playersArray = playersList.map((each) => {
    return convertPlayerDetails(each);
  });

  response.send(playersArray);
});
//get a player in player table
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT *
    FROM player_details
    WHERE player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  const playerResult = convertPlayerDetails(player);
  response.send(playerResult);
});

//update details on player_id
app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const updatePlayerQuery = `
            UPDATE
                player_details
            SET
            player_name = '${playerName}'
            WHERE
              player_id = ${playerId};`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//returns match details
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT *
    FROM match_details
    WHERE match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  const matchResult = convertMatchDetails(match);
  response.send(matchResult);
});

//returns matches based on player id
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchesQuery = `
    SELECT *
    FROM player_match_score 
    NATURAL JOIN match_details
    WHERE player_id = ${playerId};`;
  const playerMatches = await db.all(playerMatchesQuery);
  response.send(playerMatches.map((each) => convertMatchDetails(each)));
});

//returns a list of player of specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
	    SELECT
	      *
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const matchPlayers = await db.all(getMatchPlayersQuery);
  response.send(matchPlayers.map((each) => convertPlayerDetails(each)));
});

//return all statistics
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes 
    FROM 
    player_match_score NATURAL JOIN player_details  
    WHERE player_id = ${playerId};
    `;
  const playerScore = await db.get(getPlayerScored);
  response.send(playerScore);
});
module.exports = app;
