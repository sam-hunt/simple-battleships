import * as uuid from 'uuid';
import { ETileState } from './tile-state.enum';
import { EGameStatus } from './game-status.enum';

type Position = { x: number; y: number };

/**
 * A class encapsulating the core logic of the simplified battleship game
 * Internal state such as the secret positions of ships is denied to API consumers
 * At its core, guesses are passed as coordinate pairs, and the gamestate is updated
 *
 * @remarks board positions are 1-based while access to the internal boardState array
 * is 0-based which may be slightly convuluting to read.
 */
export class Game {
    private _id: string;
    private _movesMade: number;
    private _maxMoves: number;
    private _boardState: ETileState[][];
    private _shipPositions: Position[];

    // Readonly properties
    public get id() {
        return this._id;
    }
    public get movesMade() {
        return this._movesMade;
    }
    public get maxMoves() {
        return this._maxMoves;
    }
    public get shipsRemaining() {
        return this._shipPositions.length;
    }

    public get boardSize(): { x: number; y: number } {
        return { x: this._boardState.length, y: this._boardState[0].length };
    }

    /**
     * Hide ship positions from consumers so they cannot cheat
     */
    public get foggedBoardState(): ETileState[][] {
        return this._boardState.map((boardStateRow) =>
            boardStateRow.map((tileState) =>
                [ETileState.EMPTY, ETileState.SHIP].includes(tileState)
                    ? ETileState.FOGGED
                    : tileState,
            ),
        );
    }

    /**
     * Whether the game was won, lost, or is still in progress
     */
    public get gameStatus(): EGameStatus {
        if (this.shipsRemaining === 0 && this._movesMade <= this._maxMoves) {
            return EGameStatus.VICTORY;
        } else if (this._movesMade >= this._maxMoves) {
            return EGameStatus.DEFEAT;
        } else {
            return EGameStatus.IN_PROGRESS;
        }
    }

    /**
     * Create a new game instance
     *
     * @param x the number of the cells across the board should have
     * @param y the number of the cells down the board should have
     * @param maxMoves the number of guesses the player gets
     * @param nShips the number of ships to place on the board
     */
    public constructor(x = 8, y = 8, maxMoves = 20, nShips = 2) {
        this._id = uuid.v4();
        this._movesMade = 0;
        this._maxMoves = Math.min(maxMoves, x * y);
        this._boardState = new Array(x)
            .fill(0)
            .map(() => new Array(y).fill(ETileState.EMPTY));
        this._shipPositions = [];
        this.placeRandomShips(Math.min(nShips, x * y));
    }

    /**
     * The single external entrypoint for modifying game state
     * The player will guess to reveal a position, subtracting from their available move resources
     * and updating that position on the board to show how close their guess was.
     */
    public handleGuess(
        x: number,
        y: number,
    ): { tileState: ETileState; gameStatus: EGameStatus } {
        if (
            !(x > 0 && x <= this.boardSize.x) ||
            !(y > 0 && y <= this.boardSize.y)
        ) {
            throw new Error(
                `Guesses for this game must be within the board bounds. 1<x<=${this.boardSize.x},1<y<=${this.boardSize.y}`,
            );
        }
        // Use up one of the players guesses. This is rationalised in the fiction by likening guesses to bombs. 
        // If incrementing movesMade was conditional on the cell being not-guessed, players could cheat by retrying
        // already-guessed locations for free to see if they changed heat.
        // This behaviour would occur to coordinates near a pair of close-proximity ships after one ship has been destroyed.
        // As this grants additional information to the user, it should cost resources.
        this._movesMade++;

        if (this.isShip(x, y)) {
            this._boardState[x - 1][y - 1] = ETileState.HIT;
            this._shipPositions = this._shipPositions.filter(
                (position) => !(position.x === x && position.y === y),
            );
            return { tileState: ETileState.HIT, gameStatus: this.gameStatus };
        } else {
            const newTileStatus = this.calculateTileHeatStatus(x, y);
            this._boardState[x - 1][y - 1] = newTileStatus;
            return { tileState: newTileStatus, gameStatus: this.gameStatus };
        }
    }

    private calculateTileHeatStatus(x: number, y: number) {
        const closestShipPosition: Position = this.findClosestShipFrom(x, y);
        const distanceToClosestShip = this.manhattanDistance(
            { x, y },
            closestShipPosition,
        );
        if (distanceToClosestShip <= 2) {
            return ETileState.HOT;
        } else if (distanceToClosestShip <= 4) {
            return ETileState.WARM;
        } else {
            return ETileState.COLD;
        }
    }

    private findClosestShipFrom(x: number, y: number): Position {
        // We store a list of ship positions when they are added to the board
        // So we can find the minimum manhattan distance to any ship in the list
        // rather than running a full outwards breadth first search of the board
        const maxDistance = this.boardSize.x + this.boardSize.y;
        let closestShipSoFar = null;
        let shortestDistanceSoFar = maxDistance;
        for (const shipPosition of this._shipPositions) {
            const distanceToShip = this.manhattanDistance(
                { x, y },
                shipPosition,
            );
            if (distanceToShip < shortestDistanceSoFar) {
                shortestDistanceSoFar = distanceToShip;
                closestShipSoFar = shipPosition;
            }
        }
        return closestShipSoFar;
    }

    private manhattanDistance(p1: Position, p2: Position): number {
        return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
    }

    private placeRandomShips(nShips: number): void {
        for (let i = 0; i < nShips; i++) {
            this.placeRandomShip();
        }
    }

    private placeRandomShip(): void {
        // Avoid overflowing the board's bounds
        const boardMaxSize = this.boardSize;
        // Get random indices into the board state
        const [randX, randY] = [
            this.randomInt(1, boardMaxSize.x),
            this.randomInt(1, boardMaxSize.y),
        ];
        // Avoid overwriting existing ships
        if (this._boardState[randX - 1][randY - 1] !== ETileState.SHIP) {
            this._boardState[randX - 1][randY - 1] = ETileState.SHIP;
            this._shipPositions.push({ x: randX, y: randY });
        } else {
            this.placeRandomShip();
        }
    }

    private randomInt(inclusiveLower: number, inclusiveUpper: number) {
        return (
            Math.round(Math.random() * (inclusiveUpper - inclusiveLower)) +
            inclusiveLower
        );
    }

    private isShip(x: number, y: number): boolean {
        return this._boardState[x - 1][y - 1] === ETileState.SHIP;
    }
}
