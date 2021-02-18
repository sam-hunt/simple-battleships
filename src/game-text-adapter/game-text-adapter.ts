import { EGameStatus } from '../core/game-status.enum';
import { Game } from '../core/game.class';
import { ETileState } from '../core/tile-state.enum';

/**
 * Parses string input into game commands and returns natural language responses
 */
export class GameTextAdapter {
    private _game: Game;
    private _gameTextCallback: (output: string) => any;

    public get isGameEnd() {
        return this._game.gameStatus !== EGameStatus.IN_PROGRESS;
    }

    public constructor(game: Game, gameTextCallback: (output: string) => any) {
        this._game = game;
        this._gameTextCallback = gameTextCallback;

        gameTextCallback(
            this.cleanText(`
        Welcome to Battleships.

        ${this._game.shipsRemaining} ships are hiding in the 8x8 battle area.
        ${this._game.maxMoves} bombs are available for the search and destroy operation.
        Each bomb has a sonar pulse revealing approximate distance to the closest ship

        The symbolic battlefield display is represented as follows:
        (.) fogged
        (X) hit
        (h) hot! the closest ship is 1-2 cells away
        (w) warm! the closest ship is 3-4 cells away
        (c) cold. the closest ship is >= 5 cells away
      `),
        );

        this._gameTextCallback(
            `The current board state is: \n${this.prettyBoardState(
                this._game.foggedBoardState,
            )}\n`,
        );
        this._gameTextCallback(`Where should we strike, commander?`);
    }

    public handleInput(input: string): void {
        let guess: { x: number; y: number };
        try {
            guess = this.parseInput(input);
        } catch (e) {
            this._gameTextCallback(e.message);
            return;
        }
        const { tileState, gameStatus } = this._game.handleGuess(
            guess.x,
            guess.y,
        );

        const guessResult: string = {
            [ETileState.HIT]: 'hit!',
            [ETileState.HOT]: 'miss, but hot!',
            [ETileState.WARM]: 'miss, but warm!',
            [ETileState.COLD]: 'miss, cold. try again',
        }[tileState];

        this._gameTextCallback(`${guess.x}, ${guess.y} was a ${guessResult}\n`);
        this._gameTextCallback(
            `${this._game.shipsRemaining} enemy ships remain`,
        );
        this._gameTextCallback(
            `${this._game.maxMoves - this._game.movesMade} bombs remain\n`,
        );

        if (gameStatus === EGameStatus.VICTORY) {
            this._gameTextCallback(
                `The final board state is: \n` +
                    this.prettyBoardState(this._game.foggedBoardState),
            );
            this._gameTextCallback(`We are victorious commander!`);
            return;
        }
        if (gameStatus === EGameStatus.DEFEAT) {
            this._gameTextCallback(
                `We are out of bombs and defeat is upon us! Try again next time!`,
            );
            return;
        }

        this._gameTextCallback(
            `The current board state is: \n` +
                this.prettyBoardState(this._game.foggedBoardState),
        );
        this._gameTextCallback(`Where should we strike, commander?`);
    }

    private parseInput(input: string): { x: number; y: number } {
        // Syntax validation
        if (!/\s*\d+\s*,\s*\d+\s*/.test(input)) {
            throw new Error(
                `The bombardier needs integer x and y coordinates separated by a comma! e.g. 3,2`,
            );
        }
        const [x, y] = input.split(',').map((val) => parseInt(val, 10));
        // Semantic validation
        // Check both coordinates are within board bounds
        if (
            x < 1 ||
            x > this._game.boardSize.x ||
            y < 1 ||
            y > this._game.boardSize.y
        ) {
            throw new Error(
                `The bombardier needs coordinates within the battle area! i.e. 1<x<=${this._game.boardSize.x}, 1<y<=${this._game.boardSize.y}`,
            );
        }
        // Check we that cell hasn't already been bombed
        if (this._game.foggedBoardState[x-1][y-1] !== ETileState.FOGGED) {
            throw new Error(
                `The bombardier has already bombed those coordinates!`,
            );
        }
        return { x, y };
    }

    /**
     * Remove additional spacing which keeps string constants nicely aligned in source files
     */
    private cleanText(text: string): string {
        return text
            .split('\n')
            .map((row) => row.trim())
            .join('\n');
    }

    /**
     * Unlike its name, this function's internals will not be pretty as it needs flipping
     *
     * @todo This will need work to support pretty game boards with > single-digit bounds
     */
    private prettyBoardState(boardState: ETileState[][]): string {
        // Print x axis labels first across top
        let prettyBoardState = '  ';
        for (let x = 0; x < boardState[0].length; x++) {
            prettyBoardState += (x+1).toString() + ((x+1) < 9 ? ' ' : '');
        }
        prettyBoardState += '\n';
        // Print each row
        for (let y = 0; y < boardState[0].length; y++) {
            // Print y axis labels on the left of each row
            prettyBoardState += (y+1).toString() + ((y+1) < 9 ? ' ' : '');
            for (let x = 0; x < boardState[0].length; x++) {
                // Print the board state at the coordinates of each cell
                prettyBoardState += boardState[x][y].toString() + ' ';
            }
            prettyBoardState += '\n';
        }
        return prettyBoardState;
    }
}
