import _ from "lodash";
import hash from "sha.js";
import fs from "mz/fs";
import path from "path";

import Yarnpkg from "./yarnpkg";
import Git from "./git";
import GitHub from "./github";
import BitBucket from "./bitBucket";
import rpj from "./promise/read-package-json";

function findOutdatedDeps(LOG, out) {
    LOG("Find some outdated dependencies.");
    LOG(`all of output ${out}`);
    let json = _.last(out.split(/\r?\n/)); // skip Color legend
    LOG(`difference table ${json}`);
    if (json) {
        let diff = JSON.parse(json).data.body;
        if (diff && diff.some(v => v[1] !== v[2])) {
            LOG("Found outdated dependencies.");
            let hex = new hash.sha1().update(json, "utf8").digest("hex");
            return [diff, hex];
        }
    }
    LOG("Did not find outdated dependencies.");
    return Promise.reject("dependencies are up to date.");
}

function collectModuleVersions(options) {
    if (options.withShadows) {
        let modules = path.join(options.workingdir, "node_modules");
        return fs.readdir(modules).then(files => {
            let ps = files
                .map(n => path.join(modules, n))
                .map(n => [n, fs.statSync(n)])
                .filter(v => v[1].isDirectory())
                .map(v => path.join(v[0], "package.json"))
                .map(n => [n, fs.existsSync(n)])
                .filter(v => v[1])
                .map(v => rpj(v[0]));
            return Promise.all(ps).then(pkgs => {
                return new Map(pkgs.map(pkg => [pkg.name, pkg.version]));
            });
        });
    }
    return Promise.resolve(new Map());
}

function computeUpdatedDependencies(LOG, options, diff, mv, out) {
    LOG("compute shadow dependencies");
    if (options.withShadows) {
        let msgs = out.split(/[\r]?\n/);
        let tree = JSON.parse(msgs[msgs.length - 1]);

        let names = new Set(diff.map(d => d[0]));
        let shadows = tree.data.trees
            .map(v => v.name.split(/@/))
            .filter(([name, version]) => {
                let cur = mv.get(name);
                return cur ? cur !== version : true;
            })
            .map(([name, version]) => {
                let cur = mv.get(name);
                return [name, cur || version, version, undefined, "shadow"];
            })
            .filter(v => names.has(v[0]) === false);
        return diff.concat(shadows.sort((left, right) => {
            return left[0].localeCompare(right[0]);
        }));
    }
    return diff;
}

function findExistingBranch(LOG, options, names, diff, hex) {
    LOG("Find existing branch.");
    let newBranch = `${options.prefix}${options.now}/${hex}`;
    let found = names.find(n => n.endsWith(hex));
    if (found) {
        LOG(`Found existing branch ${found}`);
        return Promise.reject("Working Branch is already exists.");
    }
    return [newBranch, diff];
}

function addTargetFiles(LOG, options, git) {
    let targets = [];
    if (options.latest) {
        LOG("Added package.json into request files because --latest is specified.");
        targets.push("package.json");
    }
    targets.push("yarn.lock");
    return targets.reduce(
        (promise, target) => promise.then(() => git.add(target)),
        Promise.resolve()
    );
}

function selectPushPromise(LOG, options, git, remote, branch) {
    if (options.execute) {
        return git.push(remote, branch);
    }
    LOG("`git push` is skipped because --execute is not specified.");
    return Promise.resolve();
}

function selectDeletePromise(LOG, options, git, branch, report) {
    let p;
    if (options.keep) {
        LOG("Working branch is kept.");
        p = Promise.resolve();
    } else {
        LOG("Delete working branch because --keep is not specified.");
        p = git.deleteBranch(branch);
    }
    return p.then(() => report);
}

// for tesing purpose
export const __test__ = [findOutdatedDeps, findExistingBranch, addTargetFiles, selectPushPromise, selectDeletePromise];

export default function (options) {
    let LOG = options.logger;
    let yarnpkg = new Yarnpkg(options.workingdir, LOG);
    let git = new Git(options.workingdir, LOG);
    return yarnpkg.install()
        .then(() => yarnpkg.outdated())
        .then(out => findOutdatedDeps(LOG, out))
        .then(([diff, hex]) => git.fetch("origin").then(() => [diff, hex]))
        .then(([diff, hex]) => git.branchList().then(names => [names, diff, hex]))
        .then(([names, diff, hex]) => findExistingBranch(LOG, options, names, diff, hex))
        .then(([newBranch, diff]) => git.checkoutWith(newBranch).then(() => diff))
        .then(diff => collectModuleVersions(options).then(mv => [mv, diff]))
        .then(([mv, diff]) => yarnpkg.upgrade(options.latest).then(out => computeUpdatedDependencies(LOG, options, diff, mv, out)))
        .then(diff => git.setup(options.username, options.useremail).then(() => [diff, options]))
        .then(([diff, options]) => addTargetFiles(LOG, options, git).then(() => diff))
        .then(diff => git.commit("update dependencies").then(() => diff))
        .then(diff => git.currentBranch().then(newBranch => [newBranch, diff]))
        .then(([newBranch, diff]) => git.checkout("-").then(() => ([newBranch, diff])))
        .then(([newBranch, diff]) => git.currentBranch().then(baseBranch => [baseBranch, newBranch, diff]))
        .then(([baseBranch, newBranch, diff]) =>
            selectPushPromise(LOG, options, git, "origin", newBranch)
                .then(() => [baseBranch, newBranch, diff]))
        .then(([baseBranch, newBranch, diff]) => git.remoteurl("origin")
            .then(remote => {
                if (options.bitbucket) {
                    return [new BitBucket(options, remote), baseBranch, newBranch, diff];
                } else {
                    return [new GitHub(options, remote), baseBranch, newBranch, diff];
                }
            }))
        .then(([github, baseBranch, newBranch, diff]) =>
            github.pullRequest(baseBranch, newBranch, diff)
                .then(report => [report, newBranch]))
        .then(([report, newBranch]) =>
            selectDeletePromise(LOG, options, git, newBranch, report));
}
