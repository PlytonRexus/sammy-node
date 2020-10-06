const http = require ('http');

const exp = require ('./exp');

const server = http.createServer(exp);
const port = process.env.PORT || 8080;

server.listen(port, () => {
    console.log(`HTTP server active on port ${port}.`);
});