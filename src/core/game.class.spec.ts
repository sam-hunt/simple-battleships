import { EGameStatus } from './game-status.enum';
import { Game } from './game.class';
import { ETileState } from './tile-state.enum';

describe('Core Game Class', () => {
    describe('Game Creation', () => {
        it('Should place 2 ships by default', () => {
            const game = new Game();
            expect(game.shipsRemaining).toBe(2);
        });

        it('Should create 8x8 board area by default', () => {
            const game = new Game();
            expect(game.boardSize.x).toBe(8);
            expect(game.boardSize.y).toBe(8);
        });

        it('Should start with 20 moves by default', () => {
            const game = new Game();
            expect(game.maxMoves).toBe(20);
        });

        it('Should start with 0 moves made by default', () => {
            const game = new Game();
            expect(game.movesMade).toBe(0);
        });

        it('Should create a 2x1 board if specified, with lowered moves', () => {
            const game = new Game(2, 1);
            expect(game.boardSize.x).toBe(2);
            expect(game.boardSize.y).toBe(1);
            expect(game.shipsRemaining).toBe(2);
            expect(game.maxMoves).toBe(2);
        });

        it('Should create a 1x1 board if specified, with lowered ships and moves', () => {
            const game = new Game(1, 1);
            expect(game.boardSize.x).toBe(1);
            expect(game.boardSize.y).toBe(1);
            expect(game.shipsRemaining).toBe(1);
            expect(game.maxMoves).toBe(1);
        });

        it('Should start the default game with an in-progress game status', () => {
            const game = new Game();
            expect(game.gameStatus).toBe(EGameStatus.IN_PROGRESS);
        });

        it('Should create a unique id for each game', () => {
            const game1 = new Game();
            const game2 = new Game();
            expect(game1.id).not.toEqual(game2.id);
        });
    });

    describe('General Gameplay', () => {
        it('Should increase the move count when a guess is handled', () => {
            const game = new Game();
            game.handleGuess(1, 1);
            expect(game.movesMade).toBe(1);
        });

        it('Should decrease the ships remaining count when a hit is handled', () => {
            const game = new Game(2, 1, 2, 2);
            game.handleGuess(1, 1);
            expect(game.shipsRemaining).toBe(1);
        });

        it('Should hide the position of 1 ship on the a 2x1 board from public access', () => {
            const game = new Game(2, 1, 1, 1);
            expect(game.foggedBoardState[1][1]).toEqual(
                game.foggedBoardState[1][2],
            );
        });

        it('Should return a hit tile status when a guess is handled which hits', () => {
            const game = new Game(1, 1, 1, 1);
            expect(game.handleGuess(1, 1).tileState).toEqual(ETileState.HIT);
        });

        it('Should throw an assertion error for out of bounds guesses', () => {
            const game = new Game();
            expect(() => game.handleGuess(0, 0)).toThrow();
            expect(() => game.handleGuess(9, 9)).toThrow();
            expect(() => game.handleGuess(-1, -1)).toThrow();
            expect(game.movesMade).toBe(0);
        });

        it('Should not throw off-by one errors when guessing corner cells', () => {
            const game = new Game(8, 8, 5, 5);
            expect(() => game.handleGuess(1, 1)).not.toThrow();
            expect(() => game.handleGuess(1, 8)).not.toThrow();
            expect(() => game.handleGuess(8, 1)).not.toThrow();
            expect(() => game.handleGuess(8, 8)).not.toThrow();
        });
    });

    describe('Hot, Warm, and Cold Misses', () => {
        // Some of these tests will take longer, the public class interface disallows manipulation of internal board state,
        // so we must randomly create game states until a scenario matches or breaks our assumptions, or we give up

        it('Should return HOT when a missing guess is handled but which is 1-2 tiles away from a ship', () => {
            let game: Game;
            let guess: ETileState;
            let totalGuesses = 0;
            do {
                game = new Game(3, 3, 9, 1);
                guess = game.handleGuess(2, 2).tileState;
            } while (guess !== ETileState.HOT && ++totalGuesses < 100);
            expect(guess).toBe(ETileState.HOT);
        });

        it('Should return WARM when a missing guess is handled but which is 3-4 tiles away from a ship', () => {
            let game: Game;
            let guess1: ETileState;
            let totalGuesses = 0;
            // Find board with a warm spot in the middle
            do {
                game = new Game(7, 7, 49, 1);
                guess1 = game.handleGuess(4, 4).tileState;
            } while (guess1 !== ETileState.WARM && ++totalGuesses < 100);
            // Find the ship for that board
            let found = false,
                x = 0,
                y = 0;
            for (x = 1; x <= 7; x++) {
                for (y = 1; y <= 7; y++) {
                    if (game.handleGuess(x, y).tileState === ETileState.HIT) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    break;
                }
            }
            // Check distance is between 3-4
            const distance = Math.abs(4 - x) + Math.abs(4 - y);
            expect(guess1).toBe(ETileState.WARM);
            expect(distance).toBeGreaterThanOrEqual(3);
            expect(distance).toBeLessThanOrEqual(4);
        });

        it('Should return COLD when a missing guess is handled but which is >= 5 tiles away from a ship', () => {
            let game: Game;
            let guess1: ETileState;
            let totalGuesses = 0;
            // Find board with a cold spot in the top left
            do {
                game = new Game(8, 8, 64, 1);
                guess1 = game.handleGuess(1, 1).tileState;
            } while (guess1 !== ETileState.COLD && ++totalGuesses < 100);
            // Find the ship for that board
            let found = false,
                x = 0,
                y = 0;
            for (x = 1; x <= 8; x++) {
                for (y = 1; y <= 8; y++) {
                    if (game.handleGuess(x, y).tileState === ETileState.HIT) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    break;
                }
            }
            // Check distance is between 3-4
            const distance = Math.abs(1 - x) + Math.abs(1 - y);
            expect(guess1).toBe(ETileState.COLD);
            expect(distance).toBeGreaterThanOrEqual(5);
        });
    });

    describe('Endgame', () => {
        it('Should return a defeated game status when no moves are left and ships remain', () => {
            const game = new Game(1, 2, 0, 1);
            expect(game.gameStatus).toBe(EGameStatus.DEFEAT);
        });

        it('Should return a victorious game status when no ships remain', () => {
            const game = new Game(1, 1);
            game.handleGuess(1, 1);
            expect(game.gameStatus).toBe(EGameStatus.VICTORY);
        });

        it('Should return an in-progress game status while both moves and ships remain', () => {
            const game = new Game(2, 1, 2, 2);
            game.handleGuess(1, 1);
            expect(game.gameStatus).toBe(EGameStatus.IN_PROGRESS);
        });
    });
});
