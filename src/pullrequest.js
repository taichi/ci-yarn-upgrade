import giturl from "git-url-parse";

import GitHub from "github";

import pkg from "../package.json";
import { markdownView, simpleView } from "./compare";

function newClient(options, url) {
    let ghopt = {
        debug: options.verbose,
        headers: {
            "user-agent": `${pkg.name}/${pkg.version}`
        }
    };
    if (url.resource !== "github.com") {
        // for GHE
        ghopt.host = url.resource;
        ghopt.pathPrefix = "/api/v3";
    }
    let github = new GitHub(ghopt);
    github.authenticate({
        type: "token", token: options.token
    });
    return github;
}

export default function (options, remote, baseRef, newRef, diff) {
    let LOG = options.logger;
    let u = giturl(remote);
    LOG(`prepare PullRequest ${u.toString("https")} ${baseRef}...${newRef}`);
    if (options.execute) {
        LOG("Create Markdown Report for PullRequest.");
        return markdownView(options.workingdir, diff).then(view => {
            return {
                owner: u.owner,
                repo: u.name,
                base: baseRef,
                head: newRef,
                title: `update dependencies at ${options.now}`,
                body: view
            };
        }).then(value => {
            LOG("BEGIN Send PullRequest.");
            let github = newClient(options, u);
            return github.pullRequests.create(value).then(body => {
                LOG(`END   Send PullRequest. ${body.html_url}`);
            });
        });
    } else {
        LOG("Sending PullRequest is skipped because --execute is not specified.");
        return simpleView(options.workingdir, diff);
    }
}
