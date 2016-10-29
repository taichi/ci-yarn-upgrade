import giturl from "git-url-parse";
import _ from "lodash";

import GitHub from "github";

import pkg from "../package.json";
import { toMarkdown, toTextTable } from "./compare";
import rpt from "./promise/read-package-tree";

class CompareModel {
    constructor(a) {
        [this.name, this.current, this.wanted, this.latest] = a;
        this.repo = "";
        this.homepage = "";
    }

    rangeWanted() {
        return this.versionRange(this.wanted);
    }

    rangeLatest() {
        return this.versionRange(this.latest);
    }

    versionRange(to) {
        if (this.current === to) {
            return `v${this.current}`;
        }
        return `v${this.current}...v${to}`;
    }

    diffWantedURL() {
        return this.diffURL(this.wanted);
    }

    diffLatestURL() {
        return this.diffURL(this.latest);
    }

    diffURL(to) {
        if (this.repo) {
            if (this.current === to) {
                return `${this.repo}/tree/v${this.current}`;
            }
            return `${this.repo}/compare/${this.versionRange(to)}`;
        }
        return "";
    }
}

function toCompareModels(cwd, diff) {
    let map = new Map(diff.map(d => {
        let c = new CompareModel(d);
        return [c.name, c];
    }));
    return rpt(cwd, (n, k) => map.get(k)).then(data => {
        data.children.forEach(e => {
            let pkg = e.package;
            let c = map.get(pkg.name);
            c.homepage = pkg.homepage;
            if (pkg.repository) {
                if (pkg.repository.url) {
                    let u = giturl(pkg.repository.url);
                    c.repo = u && u.toString("https");
                }
                if (_.isString(pkg.repository) && 2 === pkg.split("/")) {
                    c.repo = `https://github.com/${pkg.repository}`;
                }
            }
        });
        return [data.package, map];
    });
}

// for tesing purpose
export const __test__ = [CompareModel, toCompareModels];

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
            return toCompareModels(this.options.workingdir, diff)
                .then(([rootDef, map]) => toMarkdown(rootDef, map))
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
            return toCompareModels(this.options.workingdir, diff)
                .then(([rootDef, map]) => toTextTable(rootDef, map));
        }
    }
}
