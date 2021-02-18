import { Game } from '../core/game.class';
import { GameTextAdapter } from './game-text-adapter';

describe('Game Text Adapter Class', () => {

    class TestableGameTextAdapter extends GameTextAdapter {
        /**
         * Provide accessors to protected member functions while avoiding violating encapsulation
         * typescript@4.1.5 does not yet support cpp-like friend scoping for external access of private members
         */
        public doBoundsCheck = this.boundsCheck;
        public doValidateInputSyntax = this.validateInputSyntax
        public doPreventRepeatBombings = this.preventRepeatBombings;
    }

    describe('Game output callback', () => {

        it('Should call the callback with string output if a callback is provided', () => {
            const game = new Game();
            const cb = jest.fn();
            const gameTextAdapter = new TestableGameTextAdapter(game, cb);
            expect(cb).toBeCalled();
        });

        it('Should allow creation with no callback provided', () => {
            const game = new Game();
            expect(() => new TestableGameTextAdapter(game)).not.toThrow();
        });
    });

    describe('Input guess parsing', () => {

        describe('Validating input syntax', () => {

            it('Should pass syntax validation when receiving two numbers separated by a comma, e.g. 1,1', () => {
                const game = new Game(8, 8);
                const gameTextAdapter = new TestableGameTextAdapter(game);
                expect(() => gameTextAdapter.doValidateInputSyntax('1,1')).not.toThrow();
            });
            it('Should pass syntax validation if spaces are prefixed, suffixed, or added between numerals and commas', () => {
                const game = new Game(8, 8);
                const gameTextAdapter = new TestableGameTextAdapter(game);
                expect(() => gameTextAdapter.doValidateInputSyntax(' 1,1')).not.toThrow();
                expect(() => gameTextAdapter.doValidateInputSyntax('1,1 ')).not.toThrow();
                expect(() => gameTextAdapter.doValidateInputSyntax('1 ,1')).not.toThrow();
                expect(() => gameTextAdapter.doValidateInputSyntax('1, 1')).not.toThrow();
                expect(() => gameTextAdapter.doValidateInputSyntax('1 , 1')).not.toThrow();
                expect(() => gameTextAdapter.doValidateInputSyntax(' 1 , 1 ')).not.toThrow();
            });
            it('Should fail syntax validation when only one coordinate is received', () => {
                const game = new Game(8, 8);
                const gameTextAdapter = new TestableGameTextAdapter(game);
                expect(() => gameTextAdapter.doValidateInputSyntax('1')).toThrow();
            });
            it('Should fail syntax validation if more than two coordinate dimensions received', () => {
                const game = new Game(8, 8);
                const gameTextAdapter = new TestableGameTextAdapter(game);
                expect(() => gameTextAdapter.doValidateInputSyntax('1,1,1')).toThrow();
            });
            it('Should fail syntax validation if prefixed by non-numeral characters', () => {
                const game = new Game(8, 8);
                const gameTextAdapter = new TestableGameTextAdapter(game);
                expect(() => gameTextAdapter.doValidateInputSyntax('aaa1,1')).toThrow();
            });
            it('Should fail syntax validation if suffixed by non-numeral characters', () => {
                const game = new Game(8, 8);
                const gameTextAdapter = new TestableGameTextAdapter(game);
                expect(() => gameTextAdapter.doValidateInputSyntax('1,1aaa')).toThrow();
            });
            it('Should fail syntax validation if negative numbers are received', () => {
                const game = new Game(8, 8);
                const gameTextAdapter = new TestableGameTextAdapter(game);
                expect(() => gameTextAdapter.doValidateInputSyntax('-1,-1')).toThrow();
            });
            it('Should fail syntax validation if Infinity is received', () => {
                const game = new Game(8, 8);
                const gameTextAdapter = new TestableGameTextAdapter(game);
                expect(() => gameTextAdapter.doValidateInputSyntax('Infinity,Infinity')).toThrow();
            });
            it('Should fail syntax validation if floating point values are received', () => {
                const game = new Game(8, 8);
                const gameTextAdapter = new TestableGameTextAdapter(game);
                expect(() => gameTextAdapter.doValidateInputSyntax('0.1,0.1')).toThrow();
            });
            it('Should pass syntax validation if 0 is received. This is a semantic error handled by bounds checking', () => {
                const game = new Game(8, 8);
                const gameTextAdapter = new TestableGameTextAdapter(game);
                expect(() => gameTextAdapter.doValidateInputSyntax('0,0')).not.toThrow();
            });
        });

        describe('Bounds checking edge cases on an 8x8 board', () => {

            it('Should pass bounds checking when x is 1', () => {
                const game = new Game(8, 8);
                const gameTextAdapter = new TestableGameTextAdapter(game);
                expect(() => gameTextAdapter.doBoundsCheck(1, 4)).not.toThrow();
            });
            it('Should fail bounds checking when x is 0', () => {
                const game = new Game(8, 8);
                const gameTextAdapter = new TestableGameTextAdapter(game);
                expect(() => gameTextAdapter.doBoundsCheck(0, 4)).toThrow();
            });
            it('Should pass bounds checking when y is 1', () => {
                const game = new Game(8, 8);
                const gameTextAdapter = new TestableGameTextAdapter(game);
                expect(() => gameTextAdapter.doBoundsCheck(4, 1)).not.toThrow();
            });
            it('Should fail bounds checking when y is 0', () => {
                const game = new Game(8, 8);
                const gameTextAdapter = new TestableGameTextAdapter(game);
                expect(() => gameTextAdapter.doBoundsCheck(4, 0)).toThrow();
            });
            it('Should pass bounds checking when x is 8', () => {
                const game = new Game(8, 8);
                const gameTextAdapter = new TestableGameTextAdapter(game);
                expect(() => gameTextAdapter.doBoundsCheck(8, 4)).not.toThrow();
            });
            it('Should fail bounds checking when x is 9', () => {
                const game = new Game(8, 8);
                const gameTextAdapter = new TestableGameTextAdapter(game);
                expect(() => gameTextAdapter.doBoundsCheck(9, 4)).toThrow();
            });
            it('Should pass bounds checking when y is 8', () => {
                const game = new Game(8, 8);
                const gameTextAdapter = new TestableGameTextAdapter(game);
                expect(() => gameTextAdapter.doBoundsCheck(4, 8)).not.toThrow();
            });
            it('Should fail bounds checking when y is 9', () => {
                const game = new Game(8, 8);
                const gameTextAdapter = new TestableGameTextAdapter(game);
                expect(() => gameTextAdapter.doBoundsCheck(4, 9)).toThrow();
            });
        });

        describe('Preventing wasting guesses on repeat bombings of the same coordinates', () => {

            it('Should pass repeat prevention testing when consecutively guessing different coordinates', () => {
                const game = new Game(8, 8);
                const gameTextAdapter = new TestableGameTextAdapter(game);
                game.handleGuess(1,1);
                expect(() => gameTextAdapter.doPreventRepeatBombings(1,2)).not.toThrow();
            });
            it('Should fail repeat prevention testing when consecutively guessing the same coordinates', () => {
                const game = new Game(8, 8);
                const gameTextAdapter = new TestableGameTextAdapter(game);
                game.handleGuess(1,1);
                expect(() => gameTextAdapter.doPreventRepeatBombings(1,1)).toThrow();
            });
            it('Should fail repeat prevention testing when non-consecutively guessing the same coordinates', () => {
                const game = new Game(8, 8);
                const gameTextAdapter = new TestableGameTextAdapter(game);
                game.handleGuess(1,1);
                game.handleGuess(1,2);
                expect(() => gameTextAdapter.doPreventRepeatBombings(1,1)).toThrow();
            });
        });
    });
});
