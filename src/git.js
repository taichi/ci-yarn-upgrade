import spawn from "./promise/spawn";

export default class {
    constructor(workingdir, LOG) {
        this.cwd = workingdir;
        this.LOG = LOG;
    }

    run(subcmd = []) {
        let msg = `git ${subcmd.join(" ")}`;
        this.LOG(`BEGIN ${msg}`);
        return spawn("git", subcmd, { cwd: this.cwd }).then(result => {
            this.LOG(`END   ${msg}`);
            return result;
        });
    }

    setup(name, email) {
        return this.config("user.name", name)
            .then(() => this.config("user.email", email));
    }

    config(key, value) {
        return this.run(["config", key, value]);
    }

    fetch(remote) {
        return this.run(["fetch", "--prune", remote]);
    }

    branchList() {
        return this.run(["branch", "-a"])
            .then(out => out.stdout.split(/[\r]?\n/));
    }

    currentBranch() {
        return this.run(["rev-parse", "--abbrev-ref", "HEAD"])
            .then(out => out.stdout.trim());
    }

    checkout(branch) {
        return this.run(["checkout", branch]);
    }

    checkoutWith(newBranch) {
        return this.run(["checkout", "-b", newBranch]);
    }

    add(file) {
        return this.run(["add", file]);
    }

    commit(message) {
        return this.run(["commit", "-m", message]);
    }

    push(remote, branch) {
        return this.run(["push", remote, branch]);
    }

    remoteurl(remote) {
        return this.run(["remote", "get-url", "--push", remote]).then(out => {
            return out.stdout.trim();
        });
    }

    deleteBranch(branch) {
        return this.run(["branch", "-D", branch]);
    }
}
