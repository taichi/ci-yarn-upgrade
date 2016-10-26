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
            this.LOG(`END  ${msg}`);
            return result;
        });
    }

    fetch(remote) {
        return this.run(["fetch", remote]);
    }

    branchList() {
        return this.run(["branch", "-a"])
            .then(out => out.stdout.split(/[\r]?\n/));
    }

    currentBranch() {
        return this.run(["rev-parse", "--abbrev-ref", "HEAD"])
            .then(out => out.stdout.trim());
    }

    branch(newBranch) {
        return this.run(["branch", newBranch]);
    }

    checkout(newBranch) {
        return this.run(["checkout", newBranch]);
    }

    add(file) {
        return this.run(["add", file]);
    }

    commit(username, useremail, message) {
        let author = `"${username} <${useremail}>"`;
        return this.run(["commit", "--author", author, "-m", message]);
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
