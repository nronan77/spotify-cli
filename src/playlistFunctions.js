let config = require("config");
let request = require("request");

module.exports = {
    /**
     * Creates a new playlist with the specified details
     * @param accessToken - String : OAuth token required to call spotify api
     * @param playlistName - String : Name to give the new playlist
     * @param description - String : Description to give the new playlist
     * @param isPublic - Boolean : Whether or not to make playlist public
     * @param isCollaborative - Boolean : Whether or not to make playlist collaborative
     * @returns {Promise<unknown>} - String : Returns ID of the newly created playlist
     */
    createPlaylist: function (accessToken, playlistName, description, isPublic = true, isCollaborative = false) {
        let userId = config.get("user_id");
        let requestOptions = {
            url: `https://api.spotify.com/v1/users/${userId}/playlists`,
            headers: {
                "Authorization": `Bearer ${accessToken}`
            },
            json: {
                name: playlistName,
                public: isPublic,
                collaborative: isCollaborative,
                description: description
            }
        }

        return new Promise((resolve, reject) => {
            request.post(requestOptions, (err, res, data) => {
                if (!err && (res.statusCode === 200 || res.statusCode === 201)) {
                    resolve(data.id);
                }
                else if (res.statusCode === 403) {
                    reject(new Error("User does not have access to specified playlist."));
                }
                else {
                    reject(err);
                }
            });
        }).catch(err => console.error(`Failed to create new playlist: ${err}`));
    },

    /**
     * Gets the list of the user's playlists
     * @param accessToken - String : OAuth tokoen needed to call spotify api
     * @returns {Promise<unknown>} - JSON Object : Returns a json object with the following parameters:
     *                                  @param name - String: name of the playlist
     *                                  @param id - string: id of the playlist
     */
    getPlaylists: function (accessToken) {
        let userId = config.get("user_id");
        let requestOptions = {
            url: `https://api.spotify.com/v1/users/${userId}/playlists?limit=50`,
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        };

        return new Promise((resolve, reject) => {
            request.get(requestOptions, (err, res, body) => {
                if (!err && res.statusCode === 200) {
                    let data = JSON.parse(body);
                    let playlists = [];

                    data.items.map(playlist => {
                        playlists.push({
                            "name": playlist.name,
                            "id": playlist.id
                        });
                    });

                    resolve(playlists);
                }
                else {
                    reject(err);
                }
            });
        }).catch(err => console.error(`Failed to get user's playlists: ${err}`));
    },

    /**
     * Gets the details of the specified playlist
     * @param accessToken - String : OAuth token needed to call spotify api
     * @param playlistId - String : ID of the specified playlist
     * @returns {Promise<unknown>} - JSON Object : Details of the playlist
     */
    getPlaylistDetails: function (accessToken, playlistId) {
        let requestOptions = {
            url: `https://api.spotify.com/v1/playlists/${playlistId}`,
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        };

        return new Promise((resolve, reject) => {
            request.get(requestOptions, (err, res, body) => {
                if (!err && res.statusCode === 200) {
                    let playlist = JSON.parse(body);

                    resolve(playlist);
                }
                else if (res.statusCode === 403) {
                    reject(new Error("User does not have access to specified playlist"))
                }
                else {
                    reject(err);
                }
            })
        }).catch(err => console.error(`Failed to edit playlist details: ${err}`));
    },

    /**
     * Edits the details of the specified playlist
     * @param accessToken - String : OAUth token needed to call spotify api
     * @param playlistId - String : ID of the playlist to edit
     * @param name - String : New name for the playlist
     * @param isPublic - Boolean : Whether or not to make playlist public
     * @param isCollaborative - Boolean : Whether or not to make playlist collaborative
     * @param description - String : New description for the playlist
     * @returns {Promise<unknown>} - Function resolves without returning anything
     */
    editPlaylistDetails: function (accessToken, playlistId, name = null, isPublic = null,
                                   isCollaborative = null, description = null) {
        let requestParams = {};
        let requestOptions = {
            url: `https://api.spotify.com/v1/playlists/${playlistId}`,
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-type": "application/json"
            },
            json: requestParams
        };

        if (name !== null) {
            requestParams.name = name;
        }
        if (isPublic !== null) {
            requestParams.public = isPublic;
        }
        if (isCollaborative !== null) {
            requestParams.collaborative = isCollaborative
        }
        if (description !== null) {
            requestParams.description = description
        }

        return new Promise((resolve, reject) => {
            request.put(requestOptions, (err, res) => {
                if (!err && res.statusCode === 200) {
                    resolve();
                }
                else if (res.statusCode === 403) {
                    reject(new Error("User does not have access to specified playlist."));
                }
                else {
                    reject(err);
                }
            });
        }).catch(err => console.error(`Failed to edit playlist details: ${err}`));
    },

    /**
     * Adds songs to the specified playlist
     * @param accessToken - String : OAuth token needed to call spotify api
     * @param playlistId - String : ID of the playlist to add songs to
     * @param songUris - Array<String> : Array of song URIs to add
     * @returns {Promise<unknown>} - Resolves without returning anything
     */
    addSongs: function (accessToken, playlistId, songUris) {
        let requestOptions = {
            url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-type": "application/json"
            },
        };

        return new Promise(async (resolve, reject) => {
            let songUrisArray = Array.from(songUris);
            let totalSongs = songUrisArray.length;
            if (totalSongs === 0) {
                console.error("There are no songs being added.");
                resolve();
            }

            for (let startIndex = 0; startIndex < totalSongs; startIndex += 20) {
                let endIndex = (startIndex + 20 > totalSongs) ? totalSongs : (startIndex + 20);
                requestOptions.url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks` +
                    `?uris=${encodeURIComponent(songUrisArray.slice(startIndex, endIndex).join(","))}`;

                await new Promise(resolve => {
                    request.post(requestOptions, (err, res, body) => {
                        if (!err && res.statusCode === 201) {
                            resolve();
                        }
                        else if (res.statusCode === 403) {
                            reject(new Error("User does not have access to playlist or playlist has reached max capacity."));
                        }
                        else {
                            reject(`Failed to add songs: ${err}`);
                        }
                    });
                });
            }

            resolve();
        }).catch(err => console.error(`Ran into error when adding songs: ${err}`));
    },

    /**
     * Removes songs from the specified playlist
     * @param accessToken - OAuth token needed to call spotify api
     * @param playlistId - ID of the specified playlist
     * @param songUris - URIs of songs to remove from playlist
     * @returns {Promise<unknown>} - Resolves without returning anything
     */
    removeSongs: function (accessToken, playlistId, songUris) {
        let requestOptions = {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-type": "application/json"
            },
        };

        return new Promise(async (resolve, reject) => {
            let songUris = Array.from(songUris);
            let totalSongs = songUris.length;
            if (totalSongs === 0) {
                console.log("There are no songs being removed.");
                resolve();
            }

            for (let startIndex = 0; startIndex < totalSongs; startIndex += 20) {
                let endIndex = (startIndex + 20 > totalSongs) ? totalSongs : (startIndex + 20);
                requestOptions.url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks` +
                    `?uris=${encodeURIComponent(songUris.slice(startIndex, endIndex).join(","))}`;

                await new Promise(resolve => {
                    request.delete(requestOptions, (err, res) => {
                        if (!err && res.statusCode === 201) {
                            console.log("Songs removed successfully.");
                            resolve();
                        }
                        else if (res.statusCode === 403) {
                            reject(new Error("User does not have access to playlist."));
                        }
                        else if (res.statusCode === 400) {
                            reject(new Error("One or more songs did not exist in the playlist."));
                        }
                        else {
                            reject(`Failed to remove songs: ${err}`);
                        }
                    });
                });
            }

            resolve();
        }).catch(err => console.error(`Failed to remove songs from playlist: ${err}`));
    },

    /**
     * Lists the songs of the specified playlist
     * @param accessToken - String : OAuth token needed to call spotify api
     * @param playlistId - String : ID of the specified playlist
     * @returns {Promise<unknown>} - Array<JSON Object> : Returns an array of song objects
     */
    listSongs: function (accessToken, playlistId) {
        let requestOptions = {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            },
        };

        return new Promise(async resolve => {
            let playlistDetails = await module.exports.getPlaylistDetails(accessToken, playlistId);
            let numSongs = playlistDetails.tracks.total;

            if (numSongs === 0) {
                console.log("This playlist has no songs.");
            }
            else {
                let offset = 0;
                let requestsNeeded = Math.ceil(numSongs / 100);
                let songs = [];

                for (let requestNum = 0; requestNum < requestsNeeded; requestNum++) {
                    requestOptions.url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?market=US&` +
                        `limit=${100}&offset=${offset}`
                    songs = songs.concat(await new Promise((resolve, reject) => {
                        request.get(requestOptions, (err, res, body) => {
                            if (!err && res.statusCode === 200) {
                                let songData = JSON.parse(body);

                                resolve(songData.items);
                            } else if (res.statusCode === 403) {
                                reject(new Error("User does not have access to this playlist."));
                            } else {
                                reject(err);
                            }
                        });
                    }));

                    offset += 100;
                }

                resolve(songs);
            }
        }).catch(err => console.error(`Failed to retrieve list of songs: ${err}`));
    },

    /**
     * Merges two playlists into a new one
     * @param accessToken - String : OAuth token needed to call spotify api
     * @param firstPlaylistId - String : ID of the first playlist to merge
     * @param secondPlaylistId - String : ID of the second playlist to merge
     * @param newPlaylistDetails - JSON Object : Details for the newly created playlist
     * @returns {Promise<unknown>} - Resolves without returning anything
     */
    mergePlaylists: function (accessToken, firstPlaylistId, secondPlaylistId, newPlaylistDetails) {
        return new Promise(async resolve => {
            let firstPlaylistSongs = await module.exports.listSongs(accessToken, firstPlaylistId);
            let secondPlaylistSongs = await module.exports.listSongs(accessToken, secondPlaylistId);
            let newPlaylistId = await module.exports.createPlaylist(accessToken, newPlaylistDetails.name, newPlaylistDetails.description,
                newPlaylistDetails.isPublic, newPlaylistDetails.isCollaborative);
            let songs = new Set();

            firstPlaylistSongs.map(song => {
                songs.add(song.track.uri);
            });

            secondPlaylistSongs.map(song => {
                songs.add(song.track.uri);
            });

            await module.exports.addSongs(accessToken, newPlaylistId, songs);
            resolve();
        }).catch(err => console.error(`Failed to merge playlists: ${err}`));
    }
};
