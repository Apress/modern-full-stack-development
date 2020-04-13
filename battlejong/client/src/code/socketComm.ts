// React imports.
import React from "react";


export function createSocketComm(inParentComponent: React.Component) {


  // Make initial contact with the server.
  const connection: WebSocket = new WebSocket("ws://localhost:8080");


  // Handle initial connection.
  connection.onopen = () => {
    console.log("Connection opened to server");
  };


  // Handle errors.
  connection.onerror = error => {
    console.log(`WebSocket error: ${error}`)
  };


  // Handle messages.  Note: objects received.
  connection.onmessage = function(inMessage: any) {

    console.log(`WS received: ${inMessage.data}`);

    const msgParts: string[] = inMessage.data.split("_");
    const message: string = msgParts[0];

    switch (message) {

      case "connected": // connected_<pid>
        this.state.handleMessage_connected(msgParts[1]);
      break;

      case "start": // start_<shuffledLayout>
        this.state.handleMessage_start(JSON.parse(msgParts[1]));
      break;

      case "update": // update_<pid>_<score>
        this.state.handleMessage_update(msgParts[1], parseInt(msgParts[2]));
      break;

      case "gameOver": // gameOver_<winnerPID>
        this.state.handleMessage_gameOver(msgParts[1]);
      break;

    }

  }.bind(inParentComponent); /* End message handler. */


  // Send an object to the server.  Note: send is always as a string.
  this.send = function(inMessage: string) {

    console.log(`WS sending: ${inMessage}`);
    connection.send(inMessage);

  }; /* End send(). */


  // Return a reference to this function to the caller so the send() method can be used.
  return this;


} /* End createSocketComm(). */
