import spawn from "./promise/spawn";

let COMMAND = "yarnpkg";
export default class {
    constructor(workingdir, LOG) {
        this.cwd = workingdir;
        this.LOG = LOG;
    }

    install() {
        this.LOG("BEGIN yarnpkg install");
        return spawn(COMMAND, ["install"], { cwd: this.cwd })
            .then(() => this.LOG("END   yarnpkg install"));
    }

    outdated() {
        this.LOG("BEGIN yarnpkg outdated");
        return spawn(COMMAND, ["outdated", "--json"], { cwd: this.cwd })
            .then(out => {
                this.LOG("END   yarnpkg outdated");
                return out.stdout.trim();
            })
            .catch(out => {
                this.LOG("END   yarnpkg outdated");
                return out.stdout.trim();
            });
    }

    upgrade() {
        this.LOG("BEGIN yarnpkg upgrade");
        return spawn(COMMAND, ["upgrade", "--json"], { cwd: this.cwd })
            .then(out => {
                this.LOG("END   yarnpkg upgrade");
                return out.stdout.trim();
            });
    }
}
