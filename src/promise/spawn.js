var spawn = require("cross-spawn");

export default function (cmd, subcmd = [], options = {}) {
    return new Promise((resolve, reject) => {
        let cp = spawn(cmd, subcmd, options);
        let stdout = [], stderr = [];
        let error = "";
        let setup = (stream, msgs) => {
            if (stream) {
                stream.on("data", buf => msgs.push(buf));
            }
        };
        setup(cp.stdout, stdout);
        setup(cp.stderr, stderr);

        cp.on("error", err => {
            error = err;
        });
        let concat = (msgs) => 0 < msgs.length ? Buffer.concat(msgs).toString() : "";
        cp.on("close", code => {
            let result = {
                error: error,
                errorcode: code,
                stdout: concat(stdout),
                stderr: concat(stderr)
            };
            if (code) {
                reject(result);
            } else {
                resolve(result);
            }
        });
    });
}
