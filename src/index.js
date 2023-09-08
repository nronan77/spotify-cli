let authorization = require("./authorization");
let playlistFunctions = require("./playlistFunctions");
let cli = require("./spotify-cli");

authorization.refreshAccessToken().then(accessToken => {
    cli.runCli(accessToken);
}).catch(err => {
    console.log(err);
})