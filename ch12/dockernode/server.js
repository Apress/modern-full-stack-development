const express = require("express");
const app = express();
app.get("/", (inRequest, inResponse) => {
  inResponse.send("I am running inside a container!");
});
app.listen("8080", "0.0.0.0");
console.log("dockernode ready");
