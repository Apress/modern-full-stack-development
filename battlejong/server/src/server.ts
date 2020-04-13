// Node imports.
import path from "path";

// Library imports.
import express, { Express } from "express";
import WebSocket from "ws";


// Our collection players.  Each element is an object: { pid, score, stillPlaying }
const players: any = { };


// Construct Express server for client resources.
const app: Express = express();
app.use("/", express.static(path.join(__dirname, "../../client/dist")));
app.listen(80, () => {
  console.log("BattleJong Express server ready");
});


// Construct WebSocket server.
const wsServer = new WebSocket.Server({ port : 8080 }, function() {
  console.log("BattleJong WebSocket server ready");
});
wsServer.on("connection", (socket: WebSocket) => {

  console.log("Player connected");

  // First things first: hook up message handler.
  socket.on("message", (inMsg: string) => {

    console.log(`Message: ${inMsg}`);

    const msgParts: string[] = inMsg.toString().split("_");
    const message: string = msgParts[0];
    const pid: string = msgParts[1];
    switch (message) {

      // When a tile pair is matched: match_<pid>_<points>
      case "match":
        players[pid].score += parseInt(msgParts[2]);
        // Broadcast score updates to both players.
        wsServer.clients.forEach(function each(inClient: WebSocket) {
          inClient.send(`update_${pid}_${players[pid].score}`);
        });
      break;

      // When the player dead-ends or clears: done_<pid>
      case "done":
        players[pid].stillPlaying = false;
        // See if both players are done playing.
        let playersDone: number = 0;
        for (const player in players) {
          if (players.hasOwnProperty(player)) {
            if (!players[player].stillPlaying) {
              playersDone++;
            }
          }
        }
        // They are both done playing, now see who won.
        if (playersDone === 2) {
          let winningPID: string;
          const pids: string[] = Object.keys(players);
          if (players[pids[0]].score > players[pids[1]].score) {
            winningPID = pids[0];
          } else {
            winningPID = pids[1];
          }
          // Broadcast the outcome to both players.
          wsServer.clients.forEach(function each(inClient: WebSocket) {
            inClient.send(`gameOver_${winningPID}`);
          });
        }
      break;

    } /* End switch. */

  }); /* End message handler. */

  // Now, construct PID for this player and add the player to the collection.
  const pid: string = `pid${new Date().getTime()}`;
  players[pid] = { score : 0, stillPlaying : true };

  // Inform the player that we're connected and give them their ID.
  socket.send(`connected_${pid}`);

  // If there are now two players, transition state on the clients.  This broadcasts to ALL clients, even the one
  // that sent the current message, which is what we want in this case.
  if (Object.keys(players).length === 2) {
    // Shuffle the tiles in the layout so we can send the layout to both clients.
    const shuffledLayout: number[][][] = shuffle();
    wsServer.clients.forEach(function each(inClient: WebSocket) {
      inClient.send(`start_${JSON.stringify(shuffledLayout)}`);
    });
  }


}); /* End WebSocket server construction. */


// ---------------------------------------- Game code. ----------------------------------------

// 0 = no tile, 1 = tile.
// Each layer is 15x9 (135 per layer, 675 total).  Tiles are 36x44.
// When board is shuffled, all 1's become 101-142 (matching the 42 tile type filenames).
// Tile 101 is wildcard.
const layout: number[][][] = [
  /* Layer 1. */
  [
    [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0 ],
    [ 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0 ],
    [ 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0 ],
    [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0 ],
    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
    [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0 ],
    [ 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0 ],
    [ 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0 ],
    [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0 ],
  ],
  /* Layer 2. */
  [
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
  ],
  /* Layer 3. */
  [
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
  ],
  /* Layer 4. */
  [
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
  ],
  /* Layer 5. */
  [
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
  ]
]; /* End layout. */


/**
 * Shuffles the tiles in the layout, randomizing tile placement.  Note that this uses the "American-style
 * totally random approach, which means that not every shuffle will be "winnable" (meaning that there may be no
 * path to completely clear the board).
 *
 * @return A shuffled layout.
 */
function shuffle(): number[][][] {

  // Clone the layout.
  const cl: number[][][] = layout.slice(0);

  // We need to ensure no more than 4 wildcards are placed, so this will count them.
  let numWildcards: number = 0;

  // Iterate over the entire board, randomly choosing a tile for each position that isn't supposed to be blank.
  const numTileTypes: number = 42;
  for (let l: number = 0; l < cl.length; l++) {
    const layer: number[][] = cl[l];
    for (let r: number = 0; r < layer.length; r++) {
      const row: number[] = layer[r];
      for (let c: number = 0; c < row.length; c++) {
        const tileVal: number = row[c];
        // tileVal > 0 indicates there is supposed to be a tile at this position.
        if (tileVal === 1) {
          row[c] = (Math.floor(Math.random() * numTileTypes)) + 101;
          // If this is a wildcard and no more are allowed then bump to the next tile type, otherwise bump
          // wildcard count.  Doing this is a cheap way of having to randomly select a tile again, which at this
          // point could actually be a little tricky if we want to avoid duplicate code.
          if (row[c] === 101 && numWildcards === 3) {
            row[c] = 102;
          } else {
            numWildcards += numWildcards;
          }
        } /* End tileVal > 0 check. */
      } /* End column iteration. */
    } /* End row iteration. */
  } /* End layer iteration. */

  return cl;

} /* End shuffle(). */
