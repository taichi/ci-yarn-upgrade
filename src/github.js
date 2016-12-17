import giturl from "git-url-parse";
import _ from "lodash";

import GitHub from "github";

import pkg from "../package.json";
import { toMarkdown, toTextTable } from "./compare";
import rpt from "./promise/read-package-tree";

function toTag(tags, version) {
    let v = `v${version}`;
    if (tags.has(v)) {
        return v;
    }
    return tags.has(version) && version;
}

function diffURL(cm, to) {
    if (cm.repo) {
        if (cm.current === to) {
            let tag = toTag(cm.tags, cm.current);
            return tag && `${cm.repo}/tree/${tag}`;
        }
        let ft = toTag(cm.tags, cm.current);
        let tt = toTag(cm.tags, to);
        return ft && tt && `${cm.repo}/compare/${ft}...${tt}`;
    }
    return "";
}

function versionRange(current, to) {
    if (current === to) {
        return current;
    }
    return `${current}...${to}`;
}

class CompareModel {
    constructor(a) {
        [this.name, this.current, this.wanted, this.latest, this.packageType] = a;
        this.repo = "";
        this.homepage = "";
        this.tags = new Set();
    }

    rangeWanted() {
        return versionRange(this.current, this.wanted);
    }

    rangeLatest() {
        return versionRange(this.current, this.latest);
    }

    diffWantedURL() {
        return diffURL(this, this.wanted);
    }

    diffLatestURL() {
        return diffURL(this, this.latest);
    }
}

function selectGetTagsPromise(LOG, github, c) {
    let handler = (prev, res) => {
        let tags = prev.concat(res.map(t => t.ref.split("/")[2]));
        if (github.hasNextPage(res)) {
            return github.getNextPage(res).then(r => handler(tags, r));
        }
        return tags;
    };
    if (c.repo) {
        let url = giturl(c.repo);
        if (url.owner && url.name) {
            LOG(`BEGIN getTags from ${url.toString("https")}`);
            return Promise.all([
                github.gitdata.getTags({ owner: url.owner, repo: url.name })
                    .then(res => handler([], res))
            ]).then(([tags]) => {
                LOG(`END   getTags ${tags}`);
                c.tags = new Set(tags);
                return c;
            });
        }
    }
    return Promise.resolve(c);
}

function reconcile(LOG, github, dep, c) {
    LOG(`BEGIN reconcile CompareModel ${c.name}`);
    c.homepage = dep.homepage;
    if (dep.repository) {
        if (dep.repository.url) {
            let u = giturl(dep.repository.url);
            c.repo = u && u.toString("https");
        }
        if (_.isString(dep.repository) && 2 === dep.split("/")) {
            c.repo = `https://github.com/${dep.repository}`;
        }
    }
    return selectGetTagsPromise(LOG, github, c).then(c => {
        LOG(`END   reconcile CompareModel ${c.name}`);
        return c;
    });
}

function toCompareModels(LOG, github, cwd, diff) {
    let map = new Map(diff.map(d => {
        let c = new CompareModel(d);
        return [c.name, c];
    }));
    LOG("BEGIN read-package-tree");
    return rpt(cwd, (n, k) => map.get(k)).then(data => {
        LOG("END   read-package-tree");
        let ps = data.children.map(e => reconcile(LOG, github, e.package, map.get(e.package.name)));
        return Promise.all(ps).then(() => map);
    });
}

// for tesing purpose
export const __test__ = [CompareModel, diffURL, toTag, versionRange];

export default class {
    constructor(options, remote) {
        this.options = options;
        this.LOG = options.logger;
        this.url = giturl(remote);
        let ghopt = {
            headers: {
                "user-agent": `${pkg.name}/${pkg.version}`
            }
        };
        if (this.url.resource !== "github.com") {
            // for GHE
            ghopt.host = this.url.resource;
            ghopt.pathPrefix = "/api/v3";
        }
        this.original = new GitHub(ghopt);
        this.original.authenticate({
            type: "token", token: options.token
        });
    }

    pullRequest(baseBranch, newBranch, diff) {
        this.LOG(`prepare PullRequest ${this.url.toString("https")} ${baseBranch}...${newBranch}`);
        if (this.options.execute) {
            this.LOG("Create Markdown Report for PullRequest.");
            return toCompareModels(this.LOG, this.original, this.options.workingdir, diff)
                .then(toMarkdown)
                .then(view => {
                    return {
                        owner: this.url.owner,
                        repo: this.url.name,
                        base: baseBranch,
                        head: newBranch,
                        title: `update dependencies at ${this.options.now}`,
                        body: view
                    };
                }).then(value => {
                    this.LOG("BEGIN Send PullRequest.");
                    return this.original.pullRequests.create(value).then(body => {
                        this.LOG(`END   Send PullRequest. ${body.html_url}`);
                    });
                });
        } else {
            this.LOG("Sending PullRequest is skipped because --execute is not specified.");
            return toCompareModels(this.LOG, this.original, this.options.workingdir, diff)
                .then(toTextTable);
        }
    }
}
