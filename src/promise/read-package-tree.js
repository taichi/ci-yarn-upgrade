import rpt from "read-package-tree";

export default function (pathToRoot, filter = (node, kidName) => kidName) {
    return new Promise((resolve, reject) => {
        rpt(pathToRoot, filter, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}
