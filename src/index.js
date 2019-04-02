import moment from "moment";
import { isString } from "lodash";
import { Command } from "commander";
import colors from "colors/safe";

import pkg from "../package.json";
import ur from "./upgrade-request";

let cmd = new Command(pkg.name);
let defaultPrefix = "yarn-upgrade/";
cmd.version(pkg.version)
    .description(pkg.description)
    .option("-n, --username <username>", "specify the commit auther name. You may set GIT_USER_NAME to environment variable.", process.env.GIT_USER_NAME)
    .option("-e, --useremail <useremail>", "specify the commit auther email. You may set GIT_USER_EMAIL to environment variable.", process.env.GIT_USER_EMAIL)
    .option("-t, --token <token>", "specify personal access token for GitHub. use only for debugging purpose. You should set GITHUB_ACCESS_TOKEN to environment variable.", process.env.GITHUB_ACCESS_TOKEN)
    .option("--execute", "if you don't specify this option, allows you to test this application.", false)
    .option("-L, --latest", "if you specify this option, upgrades packages ignores the version range specified in package.json", false)
    .option("-v, --verbose", `shows details about the running ${pkg.name}`, false)
    .option("-k, --keep", "if you specify this option, keep working branch after all.", false)
    .option("--prefix <prefix>", `specify working branch prefix. default prefix is "${defaultPrefix}"`, defaultPrefix)
    .option("--workingdir <path>", `specify project root dir. it contains package.json. default path is ${process.cwd()}`, process.cwd())
    .option("--with-shadows", "if you specify this option, shows shadow dependencies changes.", false)
    .option("--bitbucket", "if you specify this option, pull request will be created on bitbucket", false)
    .parse(process.argv);

/* eslint-disable no-console */
if (cmd.username && cmd.useremail && cmd.token) {
    cmd.now = moment().format("YYYYMMDDhhmmss");
    cmd.logger = cmd.verbose ? m => console.log(`> ${m}`) : () => { };
    Promise.all([ur(cmd)])
        .then(([msg]) => {
            msg && console.log(msg);
            cmd.logger("All done!!");
        })
        .catch((err) => {
            if (isString(err)) {
                console.log(err);
            } else {
                console.error(err);
                process.exit(1);
            }
        });
} else {
    console.log(colors.red("Please set required parameters: username, useremail, token"));
    cmd.help();
}
/* eslint-enable no-console */
