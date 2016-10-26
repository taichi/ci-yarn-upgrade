import url from "url";

import git from "nodegit";
import hash from "sha.js";

import Yarnpkg from "./yarnpkg";
import sendPullRequest from "./pullrequest";

function findOutdatedDeps(LOG, out) {
    LOG("Find some outdated dependencies.");
    let raw = out.split(/[\r]?\n/);
    if (1 < raw.length) {
        let diff = JSON.parse(raw[0]).data.body;
        if (diff.some(v => v[1] !== v[2])) {
            LOG("Found outdated dependencies.");
            let hex = new hash.sha1().update(raw[0], "utf8").digest("hex");
            return [diff, hex];
        }
    }
    LOG("Did not find outdated dependencies.");
    return Promise.reject("dependencies are not up to date.");
}

function findExistingBranch(LOG, options, names, baseRef, diff, hex) {
    LOG("Find existing branch.");
    let newBranch = `${options.prefix}${options.now}/${hex}`;
    let found = names.find(n => n.endsWith(hex));
    if (found) {
        LOG(`Found existing branch ${found}`);
        return Promise.reject("PullRequest is already exists.");
    }
    return [newBranch, baseRef, diff];
}

function selectPushPromise(LOG, options, remote, newRef) {
    if (options.execute) {
        LOG("BEGIN git push origin");
        return remote.push([newRef], {
            callbacks: toCallbackOptions(options)
        }).then(() => LOG("END   git push origin"));
    }
    LOG("`git push` is skipped because --execute is not specified.");
    return Promise.resolve();
}

function toCallbackOptions(options) {
    return {
        credentials: function (targetURL, name) {
            let u = url.parse(targetURL);
            if (-1 < u.protocol.indexOf("http")) {
                return git.Cred.userpassPlaintextNew(options.token, "x-oauth-basic");
            }
            return git.Cred.sshKeyFromAgent(name);
        },
        certificateCheck: function () {
            return 1;
        }
    };
}

// for tesing purpose
export const __test__ = [findOutdatedDeps, findExistingBranch, selectPushPromise];

export default function (options) {
    let LOG = options.logger;
    LOG(`Open Repository from ${options.workingdir}`);
    return git.Repository.open(options.workingdir).then(repo => {
        let yarnpkg = new Yarnpkg(options.workingdir, LOG);
        return yarnpkg.install()
            .then(() => yarnpkg.outdated())
            .then(out => findOutdatedDeps(LOG, out))
            .then(([diff, hex]) => {
                LOG("BEGIN git fetch origin");
                return repo.fetch("origin", {
                    callbacks: toCallbackOptions(options)
                }).then(() => LOG("END   git fetch origin"))
                    .then(() => [diff, hex]);
            })
            .then(([diff, hex]) => repo.getCurrentBranch()
                .then(baseRef => [baseRef, diff, hex]))
            .then(([baseRef, diff, hex]) => repo.getReferenceNames(git.Reference.TYPE.LISTALL)
                .then(names => [names, baseRef, diff, hex]))
            .then(([names, baseRef, diff, hex]) =>
                findExistingBranch(LOG, options, names, baseRef, diff, hex)
            ).then(([newBranch, baseRef, diff]) => {
                LOG(`git checkout from ${baseRef.shorthand()} to ${newBranch}`);
                return repo.getHeadCommit()
                    .then(commit => repo.createBranch(newBranch, commit))
                    .then(newRef => repo.checkoutBranch(newRef)
                        .then(() => [baseRef, newRef, diff])
                    );
            }).then(([baseRef, newRef, diff]) =>
                yarnpkg.upgrade().then(() => [baseRef, newRef, diff])
            ).then(([baseRef, newRef, diff]) => {
                LOG("Create commit on HEAD.");
                let sig = git.Signature.now(options.username, options.useremail);
                return repo.createCommitOnHead(
                    ["yarn.lock"], sig, sig, "update dependencies")
                    .then(() => [baseRef, newRef, diff]);
            })
            .then(([baseRef, newRef, diff]) =>
                repo.getRemote("origin").then(remote => [remote, baseRef, newRef, diff]))
            .then(([remote, baseRef, newRef, diff]) =>
                selectPushPromise(LOG, options, remote, newRef)
                    .then(() => [remote, baseRef, newRef, diff])
            )
            .then(([remote, baseRef, newRef, diff]) =>
                sendPullRequest(options, remote, baseRef, newRef, diff));
    });
}
