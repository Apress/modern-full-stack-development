// React imports.
import React from "react";

// App imports.
import { createSocketComm } from "./socketComm";


// Interfaces.
interface ISelectedTile { layer: number, row: number, column: number, type: number }
interface IScores { player: number, opponent: number }


/**
 * This function must be called once and only once from BaseLayout.
 */
export function createState(inParentComponent: React.Component) {

  return {

    // The current board layout.
    // During play, -1 replaces a 1 when tiles are cleared.
    // When selected (highlighted), they become 1001-1042.
    layout : <number[][][]>[ ],

    // Used to keep track of what tiles, if any, are currently selected.
    selectedTiles : <ISelectedTile[]>[ ],

    // Player and opponent's current score.
    scores : <IScores>{ player : 0, opponent : 0 },

    // What state the game is currently in: "awaitingOpponent", "playing", "deadEnd", "cleared" or "gameOver".
    gameState : <string>"awaitingOpponent",

    // The outcome of the game.
    gameOutcome : <string>"",

    // The player ID as returned by the server.
    pid : <string>"",

    // The socketComm object used to make server calls.
    socketComm : <Function>createSocketComm(inParentComponent),

    // The time since the player last matched a tile pair.
    timeSinceLastMatch : <number>0,


    // ---------------------------------------- Message Handler Functions ----------------------------------------


    /**
     * Handle 'connected' message.  Occurs when this player connects to the server.
     *
     * @parain inPID The player's ID.
     */
    handleMessage_connected : function(inPID: string) {

      this.setState({ pid : inPID });

    }.bind(inParentComponent), /* End handleMessage_connected(). */


    /**
     * Handle 'start' message.  Occurs when two players have connected to the server.
     *
     * @param inLayout The board layout.
     */
    handleMessage_start: function(inLayout: number[][][]) {

      this.setState({
        timeSinceLastMatch : new Date().getTime(),
        layout : inLayout,
        gameState : "playing"
      });

    }.bind(inParentComponent), /* End handleMessage_start(). */


    /**
     * Handle 'update' message.  Occurs when a player matches a tile pair.
     *
     * @param inPID   The player ID of the player.
     * @param inScore The new score for the player.
     */
    handleMessage_update: function(inPID: string, inScore: number) {

      // This player's score is always up to date, so we only need to update the opponent's score.
      if (inPID !== this.state.pid) {
        const scores: IScores = { ...this.state.scores };
        scores.opponent = inScore;
        this.setState({ scores : scores });
      }

    }.bind(inParentComponent), /* End handleMessage_update(). */


    /**
     * Handle 'gameOver' message.  Occurs when both players have each either dead-ended or cleared the board.
     *
     * @param inPID The player ID of the winning player.
     */
    handleMessage_gameOver: function(inPID: string) {

      if (inPID === this.state.pid) {
        this.setState({ gameState : "gameOver", gameOutcome : "**** YOU WON! ****" });
      } else {
        this.setState({ gameState : "gameOver", gameOutcome : "Tough luck, you lost :(" });
      }

    }.bind(inParentComponent), /* End handleMessage_update(). */


    // ---------------------------------------- Game Functions ----------------------------------------


    /**
     * Called when a tile is clicked..
     *
     * @param inLayer  The layer number the tile is in.
     * @param inRow    The row number the tile is in.
     * @param inColumn The column number the tile is in.
     */
    tileClick : function(inLayer: number, inRow: number, inColumn: number) {

      // Abort if not in "playing" state.
      if (this.state.gameState !== "playing") {
        return;
      }

      // See if this tile can be selected (vis a vis, if it's "free"), abort if not.
      if (!this.state.canTileBeSelected(inLayer, inRow, inColumn)) {
        return;
      }

      // Find the current value of the clicked tile.
      const layout: number[][][] = this.state.layout.slice(0);
      const currentTileValue: number = layout[inLayer][inRow][inColumn];

      // Make sure they can only click tiles, not blank spaces (or removed tiles).
      if (currentTileValue <= 0) {
        return;
      }

      // Grab some other values out of state that we're going to need.
      const scores: IScores = { ...this.state.scores };
      let gameState: string = this.state.gameState;
      let timeSinceLastMatch: number = this.state.timeSinceLastMatch;
      let selectedTiles: ISelectedTile[] = this.state.selectedTiles.slice(0);

      // Tile is currently highlighted, so de-highlight it and remove its selected status.
      if (currentTileValue > 1000) {
        layout[inLayer][inRow][inColumn] = currentTileValue - 1000;
        for (let i: number = 0; i < selectedTiles.length; i++) {
          const selectedTile: ISelectedTile = selectedTiles[i];
          if (selectedTile.layer == inLayer && selectedTile.row == inRow && selectedTile.column == inColumn) {
            selectedTiles.splice(i, 1);
            break;
          }
        }
      // Not currently highlighted, so highlight it now and record it as selected.
      } else {
        layout[inLayer][inRow][inColumn] = currentTileValue + 1000;
        selectedTiles.push({ layer : inLayer, row : inRow, column : inColumn, type : currentTileValue });
      }

      // Now, if two tiles are selected, we have to see if we have a match.  If so, remove the tiles and bump
      // score.  If not, de-highlight them both and clear selectedTiles.  Remember to take wildcard (101) into account!
      if (selectedTiles.length === 2) {
        // Matched.
        if (selectedTiles[0].type === selectedTiles[1].type ||
          selectedTiles[0].type == 101 || selectedTiles[1].type == 101
        ) {
          // "Clear" the pair.
          layout[selectedTiles[0].layer][selectedTiles[0].row][selectedTiles[0].column] = -1;
          layout[selectedTiles[1].layer][selectedTiles[1].row][selectedTiles[1].column] = -1;
          // Calculate how many points they get.  For every half a second they took since their last match,
          // deduct 1 point.  Ensure they get at least 1 point, 'cause we're nice!
          // Also, don't forget to update timeSinceLastMatch!
          let calculatedPoints: number = 10;
          const now: number = new Date().getTime();
          const timeTaken: number = now - timeSinceLastMatch;
          const numHalfSeconds: number = Math.trunc(timeTaken / 500);
          calculatedPoints -= numHalfSeconds;
          if (calculatedPoints <= 0) {
            calculatedPoints = 1;
          }
          scores.player += calculatedPoints;
          timeSinceLastMatch = now;
          // Send score to server.
          this.state.socketComm.send(`match_${this.state.pid}_${calculatedPoints}`);
          // See if the board has dead-ended, or if they just cleared it.  Note that we have to pass cl to
          // anyMovesLeft() because state won't have been updated at this point and isn't current.
          const anyMovesLeft: string = this.state.anyMovesLeft(layout);
          switch (anyMovesLeft) {
            case "no":
              gameState = "deadEnd";
              this.state.socketComm.send(`done_${this.state.pid}`);
            break;
            case "cleared":
              scores.player += 100;
              gameState = "cleared";
              this.state.socketComm.send(`match_${this.state.pid}_100`);
              this.state.socketComm.send(`done_${this.state.pid}`);
            break;
          }
        // Not matched.
        } else {
          layout[selectedTiles[0].layer][selectedTiles[0].row][selectedTiles[0].column] =
            layout[selectedTiles[0].layer][selectedTiles[0].row][selectedTiles[0].column] - 1000;
          layout[selectedTiles[1].layer][selectedTiles[1].row][selectedTiles[1].column] =
            layout[selectedTiles[1].layer][selectedTiles[1].row][selectedTiles[1].column] - 1000;
        }
        selectedTiles = [ ];
      }

      // Set state so React re-draws the tile(s) as appropriate.
      this.setState({
        gameState : gameState,
        layout : layout,
        selectedTiles : selectedTiles,
        scores : scores,
        timeSinceLastMatch : timeSinceLastMatch
      });

    }.bind(inParentComponent), /* End tileClick(). */


    /**
     * Determines if a given tile can be selected according to the game rules.  This means that the tiles must have
     * no tile on top of it (which shouldn't really be possible anyway given the click handler) and that it is free
     * on at least one side.
     *
     * @param  inLayer  The layer number the tile is in.
     * @param  inRow    The row number the tile is in.
     * @param  inColumn The column number the tile is in.
     * @return          True if the tile can be selected, false if not.
     */
    canTileBeSelected : function(inLayer: number, inRow: number, inColumn: number): boolean {

      // If the tile is in the top layer or there is no tile above it, AND if it's in the first column, last column,
      // or there's no tile to the left or right of it, then it's "free".
      return (inLayer == 4 || this.state.layout[inLayer + 1][inRow][inColumn] <= 0) &&
        (inColumn === 0 || inColumn === 14 || this.state.layout[inLayer][inRow][inColumn - 1] <= 0 ||
        this.state.layout[inLayer][inRow][inColumn + 1] <= 0);

    }.bind(inParentComponent), /* End canTileBeSelected(). */


    /**
     * Determines if there is at least one move left for the player to make.
     *
     * @param  inLayout The clone of the current layout from tileClick().
     * @return          "yes" if there is at least one move left, "no" if there are none left and "cleared" if there
     *                  are none left as a result of the player clearing the board.
     */
    anyMovesLeft : function(inLayout: number[][][]): string {

      // First, find all free tiles, that is, tiles that can be selected.  Simultaneously, count how many tiles there
      // are left at all.
      let numTiles: number = 0;
      const selectableTiles: number[] = [ ];
      for (let l: number = 0; l < inLayout.length; l++) {
        const layer = inLayout[l];
        for (let r: number = 0; r < layer.length; r++) {
          const row = layer[r];
          for (let c: number = 0; c < row.length; c++) {
            const tileVal: number = row[c];
            if (tileVal > 0) {
              numTiles += 1;
              if (this.state.canTileBeSelected(l, r, c)) {
                // If any of them is a wildcard then we can short-circuit this whole mess because there will always be
                // at least one move left when there's a wildcard.
                if (tileVal === 101) {
                  return "yes";
                }
                // Otherwise, we need to keep checking and record this selectable tile.
                selectableTiles.push(tileVal);
              }
            }
          } /* End column iteration. */
        } /* End row iteration. */
      } /* End layer iteration. */

      // If there are no tiles at all left then they cleared the board.
      if (numTiles === 0) {
        return "cleared";
      }

      // Now, iterate over selectable tiles and for each, count how many times they occur.
      const counts: number[] = [];
      for (let i: number = 0; i < selectableTiles.length; i++) {
        if (counts[selectableTiles[i]] === undefined) {
          counts[selectableTiles[i]] = 1;
        } else {
          counts[selectableTiles[i]]++;
        }
      }

      // Finally, make sure we have at least one count >= 2.
      for (let i: number = 0; i < counts.length; i++) {
        if (counts[i] >= 2) {
          return "yes";
        }
      }

      // If we're here, then there are no free tile pairs, so the game cannot continue.
      return "no";

    }.bind(inParentComponent) /* End anyMovesLeft(). */


  }; /* End state object. */

} /* End createState(). */
