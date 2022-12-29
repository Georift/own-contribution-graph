import { spawn } from "child_process";

export const onExit = (eventEmitter: ReturnType<typeof spawn>) => {
	return new Promise((resolve, reject) => {
		eventEmitter.once("exit", (exitCode, signalCode) => {
			if (exitCode === 0) {
				// (B)
				resolve({ exitCode, signalCode });
			} else {
				reject(
					new Error(`Non-zero exit: code ${exitCode}, signal ${signalCode}`),
				);
			}
		});
		eventEmitter.once("error", (err) => {
			// (C)
			reject(err);
		});
	});
};
