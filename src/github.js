import giturl from "git-url-parse";

import GitHub from "github";

import pkg from "../package.json";
import { markdownView, simpleView } from "./compare";

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
            return markdownView(this.options.workingdir, diff).then(view => {
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
            return simpleView(this.options.workingdir, diff);
        }
    }
}
