import url from "url";

import GitHub from "github";

import pkg from "../package.json";
import { markdownView, simpleView } from "./compare";

export default function (options, remote, baseRef, newRef, diff) {
    let github = new GitHub({
        headers: {
            "user-agent": `${pkg.name}/${pkg.version}`
        }
    });
    github.authenticate({
        type: "token", token: options.token
    });
    let LOG = options.logger;
    LOG(`prepare PullRequest ${remote.url()} ${baseRef.shorthand()}...${newRef.shorthand()}`);
    if (options.execute) {
        LOG("Create Markdown Report for PullRequest.");
        return markdownView(options.workingdir, diff).then(view => {
            var parts = url.parse(remote.url()).path.split("/");
            return {
                owner: parts[1],
                repo: parts[2].replace(/\.git$/, ""),
                base: baseRef.shorthand(),
                head: newRef.shorthand(),
                title: `update dependencies at ${options.now}`,
                body: view
            };
        }).then(value => {
            LOG("BEGIN Send PullRequest.");
            return github.pullRequests.create(value).then(body => {
                LOG(`END   Send PullRequest. ${body.html_url}`);
            });
        });
    } else {
        LOG("Sending PullRequest is skipped because --execute is not specified.");
        return simpleView(options.workingdir, diff);
    }
}
