let readline = require("readline");
let searchFunctions = require("./searchFunctions");
let playlistFunctions = require("./playlistFunctions");

module.exports.runCli = async function (accessToken) {
    let cli = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    listActions();
    while (1) {
        let nextAction = await requestAction(cli);

        switch (nextAction.toUpperCase()) {
            case "CREATE":
                await createPlaylistPrompt(cli, accessToken).then(playlistId => {
                    console.log(`Your new playlist's ID is ${playlistId}\n`);
                })
                break;
            case "MODIFY":
                await modifyPlaylistPrompt(cli, accessToken);
                break;
            case "PLAYLISTS":
                await listPlaylistsPrompt(cli, accessToken);
                break;
            case "GET":
                await getPlaylistDetailsPrompt(cli, accessToken);
                break;
            case "ADD":
                await addSongsPrompt(cli, accessToken);
                break;
            case "REMOVE":
                await removeSongsPrompt(cli, accessToken);
                break;
            case "EXIT":
                process.exit(0);
                break;
            case "HELP":
                listActions();
                break;
            case "LIST":
                await listSongsPrompt(cli, accessToken);
                break;
            case "MERGE":
                await mergePlaylistsPrompt(cli, accessToken);
                break;
            default:
                console.log(`${nextAction} is not a valid option. Please select a valid action. (Type 'HELP' to see actions)`);
        }
    }
}

function listActions() {
    console.log(
        "Possible Actions:\n" +
        "CREATE     Creates a new playlist.\n" +
        "MODIFY     Modify the details of an existing playlist.\n" +
        "PLAYLISTS  Lists the user's playlists.\n" +
        "GET        Get's a specified playlist's details.\n" +
        "LIST       Lists the specified playlist's songs.\n" +
        "ADD        Add's songs to a specified playlist\n" +
        "REMOVE     Removes songs from a specified playlist\n" +
        "MERGE      Merges two existing playlists into a new one\n" +
        "HELP       Displays the list of possible actions\n" +
        "EXIT       Exits the program"
    );
}

function requestAction(cli) {
    return new Promise(resolve => {
        cli.question("What would you like to do? ", action => {
            resolve(action);
        });
    });
}

function playlistDetailsPrompt(cli) {
    return new Promise(resolve => {
        cli.question("Please enter a playlist name: ", name => {
            cli.question("Enter a playlist description (Optional): ", description => {
                cli.question("Would you like this to be a public playlist? (Y/N): ", isPublic => {
                    cli.question("Would you like this playlist to be collaborative? (Y/N): ", isCollaborative => {
                        resolve({
                            name: name,
                            description: description,
                            isPublic: isPublic === "Y",
                            isCollaborative: isCollaborative === "Y"
                        });
                    });
                });
            });
        });
    });
}

function playlistIdPrompt(cli) {
    return new Promise(resolve => {
        cli.question("Please enter a playlist ID: ", playlistId => resolve(playlistId));
    });
}

function songsPrompt(cli) {
    return new Promise(resolve => {
        cli.question("Please input a song URI: ", songUri => resolve(songUri));
    });
}

function createPlaylistPrompt(cli, accessToken) {
    return new Promise(resolve => {
        playlistDetailsPrompt(cli).then(playlistDetails => playlistFunctions.createPlaylist(
            accessToken,
            playlistDetails.name,
            playlistDetails.description,
            playlistDetails.isPublic,
            playlistDetails.isCollaborative
        )).then(playlistId => resolve(playlistId));
    });
}

function modifyPlaylistPrompt(cli, accessToken) {
    return new Promise(resolve => {
        playlistIdPrompt(cli).then(playlistId => {
            playlistDetailsPrompt(cli).then(playlistDetails => playlistFunctions.editPlaylistDetails(
                accessToken,
                playlistId,
                playlistDetails.name,
                playlistDetails.isPublic,
                playlistDetails.isCollaborative,
                playlistDetails.description
            )).then(() => resolve());
        });
    });
}

function listPlaylistsPrompt(cli, accessToken) {
    return new Promise(resolve => {
        playlistFunctions.getPlaylists(accessToken).then(playlists => {
            playlists.map(playlist => {
                console.log(`Playlist Name: ${playlist.name} | Playlist ID: ${playlist.id}`);
            });
            resolve();
        });
    });
}

function getPlaylistDetailsPrompt(cli, accessToken) {
    return new Promise(resolve => {
        playlistIdPrompt(cli).then(playlistId => {
            playlistFunctions.getPlaylistDetails(accessToken, playlistId).then(playlist => {
                console.log(
                    `Playlist Name: ${playlist.name}\n` +
                    `Description: ${playlist.description}\n` +
                    `Public?: ${playlist.public ? "Yes" : "No"}\n` +
                    `Collaborative?: ${playlist.collaborative ? "Yes" : "No"}\n` +
                    `Number of Songs: ${playlist.tracks.total}\n`
                );
                resolve();
            });
        });
    });
}

function addSongsPrompt(cli, accessToken) {
    return new Promise(resolve => {
        playlistIdPrompt(cli).then(async playlistId => {
            let songUris = [];
            let inputtingSongs = true;

            while (inputtingSongs) {
                console.log("Please enter a song URI or type 'DONE': ");
                let songUri = await songsPrompt(cli);

                if (songUri.toUpperCase() === "DONE") {
                    inputtingSongs = false;
                }
                else {
                    songUris.push(songUri);
                }
            }

            if (songUris.length > 0) {
                playlistFunctions.addSongs(accessToken, playlistId, songUris).then(() => resolve());
            }
            else {
                resolve();
            }
        });
    });
}

function removeSongsPrompt(cli, accessToken) {
    return new Promise(resolve => {
        playlistIdPrompt(cli).then(async playlistId => {
            let songUris = {
                "tracks": []
            };
            let inputtingSongs = true;

            while (inputtingSongs) {
                console.log("Please enter a song URI or type 'DONE': ");
                let songUri = await songsPrompt(cli);

                if (songUri.toUpperCase() === "DONE") {
                    inputtingSongs = false;
                }
                else {
                    songUris.push({"uri": songUri});
                }
            }

            if (songUris.tracks.length > 0) {
                playlistFunctions.removeSongs(accessToken, playlistId, songUris).then(() => resolve());
            }
            else {
                resolve();
            }
        });
    });
}

function listSongsPrompt(cli, accessToken) {
    return new Promise(resolve => {
        playlistIdPrompt(cli).then(playlistId => {
            playlistFunctions.listSongs(accessToken, playlistId).then(songs => {
                songs.map(song => {
                    let artists = [];
                    song.track.artists.map(artist => artists.push(artist.name));
                    console.log(`Song: ${song.track.name} | Artist(s): ${artists.join(', ')} | ` +
                        `Album: ${song.track.album.name}`);
                });
                resolve();
            });
        });
    });
}

function mergePlaylistsPrompt(cli, accessToken) {
    return new Promise(async resolve => {
        console.log("Please enter the ID of the first playlist you'd like to merge: ");
        let firstPlaylistId = await playlistIdPrompt(cli);

        console.log("Please enter the ID the second playlist you'd like to merge: ");
        let secondPlaylistId = await playlistIdPrompt(cli);

        console.log("Please enter the details for the newly created playlist: ");
        let newPlaylistDetails = await playlistDetailsPrompt(cli)

        await playlistFunctions.mergePlaylists(accessToken, firstPlaylistId, secondPlaylistId, newPlaylistDetails);
        resolve();
    });
}
