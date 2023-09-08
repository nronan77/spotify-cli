let request = require("request");
let config = require("config");

// Function to refresh the user's OAuth access token
module.exports.refreshAccessToken = function () {
    let clientId = config.get("client_id");
    let clientSecret = config.get("client_secret");
    let refreshToken = config.get("refresh_token");
    let authOptions = {
        url: "https://accounts.spotify.com/api/token",
        headers:{
            "Authorization": "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64")
        },
        form: {
            grant_type: "refresh_token",
            refresh_token: refreshToken
        }
    };

    return new Promise((resolve, reject) => {
        request.post(authOptions, (err, res, body) => {
            let data = JSON.parse(body);

            if (!err && res.statusCode === 200) {
                console.log(data.access_token);
                resolve(data.access_token);
            }
            else {
                reject(err);
            }
        });
    });
}
