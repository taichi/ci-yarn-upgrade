import giturl from "git-url-parse";
import { toMarkdown, toTextTable } from "./compare";
const bpr = require("bitbucket-pull-request");

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

  toMarkdown() {
    return toMarkdown(this);
  }

  toTextTable() {
    return toTextTable(this);
  }
}

async function toCompareModels(diff) {
  return new Map(
    diff.map(d => {
      let c = new CompareModel(d);
      return [c.name, c];
    })
  );
}

export default class {
  constructor(options, remote) {
    this.options = options;
    this.LOG = options.logger;
    this.url = giturl(remote);
  }

  pullRequest(baseBranch, newBranch, diff) {
    this.LOG(
      `prepare PullRequest ${this.url.toString(
        "https"
      )} ${baseBranch}...${newBranch}`
    );
    if (this.options.execute) {
      this.LOG("Create Markdown Report for PullRequest.");
      return toCompareModels(diff)
        .then(toMarkdown)
        .then(markdown => {
          this.LOG("BEGIN Send PullRequest.");
          bpr.create(
            this.url.owner, // repository user
            this.url.name, // repository name
            `update dependencies at ${this.options.now}`, // title
            markdown, // description
            newBranch, // source branch
            baseBranch // destination branch
          );
          this.LOG("END   Send PullRequest.");
        });
    } else {
      this.LOG(
        "Sending PullRequest is skipped because --execute is not specified."
      );
      return toCompareModels(
        this.LOG,
        this.original,
        this.options.workingdir,
        diff
      ).then(toTextTable);
    }
  }
}
