# Battleships

A simplified game of Battleships using text input and output.

The computer randomly chooses the location of two single-cell "ships" on a board of 8 by 8 cells.  The user then has 20 guesses to find the two ships.

The user enters a co-ordinate, for example `3,5`, and the computer locates the nearest ship to that co-ordinate and tells them they're "hot" if they're 1 to 2 cells away, "warm" if they're 3 to 4 cells away, or "cold" if they're further away.

As an example, `3,5` is three cells away from `2,7` because (3 - 2) + (7 - 5) = 3, so they'd be told they were "warm".

If the user correctly guesses a ship's location, they're told they've got a hit and that ship is removed from the board.  The game ends when both ships have been hit by the user, or the user has used up their 20 guesses.


## Installation

NodeJS v14.15.4 (Latest LTS: Fermium)

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run build
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# test coverage
$ npm run test:cov
```


## Architecture

The application is composed of 3 layers: 

1. Game Core
    A pure class encapsulating the state and control-flow of the game

2. Game Text Adapter
    A passthrough for converting structs and enums exposed by the game core into human readable strings
    A GUI could replace this layer and interface directly with the Game Core

3. Main function / Application entrypoint
    Links the runtime environment and text input/output methods between the shell, and the Game Text Adapter.
    html input and text elements handlers could replace this layer alone to easily port the game into a browser runtime environment.
    Alternatively this layer could be replaced with a websocket server and a game manager class, keeping the game state on the server. A unique game core and game text adapter could be created for connecting websocket clients to stream the human readable string input/output provided by the Game Text Adapter.
