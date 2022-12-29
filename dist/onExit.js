"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onExit = void 0;
const onExit = (eventEmitter) => {
    return new Promise((resolve, reject) => {
        eventEmitter.once("exit", (exitCode, signalCode) => {
            if (exitCode === 0) {
                // (B)
                resolve({ exitCode, signalCode });
            }
            else {
                reject(new Error(`Non-zero exit: code ${exitCode}, signal ${signalCode}`));
            }
        });
        eventEmitter.once("error", (err) => {
            // (C)
            reject(err);
        });
    });
};
exports.onExit = onExit;
//# sourceMappingURL=onExit.js.map