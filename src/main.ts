import * as readline from 'readline';
import { Game } from './core/game.class';
import { GameTextAdapter } from './game-text-adapter/game-text-adapter';

async function getInput() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise<string>((resolve) => {
        rl.question('', (input) => {
            resolve(input);
            rl.close();
        });
    });
}

async function main() {
    const game = new Game();
    const gameTextAdapter = new GameTextAdapter(game, (output) =>
        console.log(output),
    );

    while (!gameTextAdapter.isGameEnd) {
        const input = await getInput();
        gameTextAdapter.handleInput(input);
    }
}
main();
