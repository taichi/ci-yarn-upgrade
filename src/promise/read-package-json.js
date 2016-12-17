var rpj = require("read-package-json");

export default function (pathToRoot, strict = false) {
    return new Promise((resolve, reject) => {
        rpj(pathToRoot, strict, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}
