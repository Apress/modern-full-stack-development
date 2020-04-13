require("http").createServer((inRequest, inResponse) => {
  inResponse.end("Hello from my first Node Web server");
}).listen(80);
