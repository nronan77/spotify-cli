let request = require("request");

module.exports.songSearch = function (accessToken, songName, limit=20) {
    let requestOptions = {
        url: "https://api.spotify.com/v1/search",
        headers: {
            "Authorization": `Bearer ${accessToken}`
        },
        form: {
            "q": encodeURIComponent(songName),
            "type": "song",
            "limit": limit
        }
    };

    return new Promise((resolve, reject) => {
        request.get(requestOptions, (err, res, body) => {
            if (!err && res.statusCode === 200) {
                let songs = JSON.parse(body);

                resolve(songs);
            }
            else {
                let error = JSON.parse(body);

                reject(error);
            }
        });
    });
};
