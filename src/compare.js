import giturl from "git-url-parse";

import _ from "lodash";
import Table from "cli-table2";

import pkg from "../package.json";
import rpt from "./promise/read-package-tree";

class CompareView {
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

function toCompareViews(cwd, diff) {
    let map = new Map(diff.map(d => {
        let c = new CompareView(d);
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
        return Array.from(map.values());
    });
}

function toMarkdown(entries) {
    let rows = () => entries.map(c => {
        let r = "| ";
        r += c.homepage ? `[${c.name}](${c.homepage})` : c.name;
        r += " | ";
        r += c.repo ? `[${c.rangeWanted()}](${c.diffWantedURL()})` : c.rangeWanted();
        r += " | ";
        r += c.repo ? `[v${c.latest}](${c.diffLatestURL()})` : `v${c.latest}`;
        r += " |";
        return r;
    }).join("\r\n");
    return `## Updating Dependencies

| Name | Updating | Latest |
|:---- |:--------:|:------:|
${rows()}

Powered by [${pkg.name}](${pkg.homepage})`;
}

function toTextTable(entries) {
    let t = new Table({
        head: ["Name", "Updating", "Latest"],
        chars: {
            "top": "=", "top-mid": "=", "top-left": "", "top-right": ""
            , "bottom": "=", "bottom-mid": "=", "bottom-left": "", "bottom-right": ""
            , "left": "", "left-mid": "", "mid": "-", "mid-mid": "-"
            , "right": "", "right-mid": "", "middle": "|"
        },
        style: {
            head: [],
            "padding-left": 1,
            "padding-right": 1
        }
    });

    entries.forEach(c => {
        t.push([c.name, c.rangeWanted(), c.latest]);
    });
    return t.toString();
}

// for tesing purpose
export const __test__ = [CompareView, toMarkdown, toTextTable];

export function markdownView(cwd, diff) {
    return toCompareViews(cwd, diff).then(toMarkdown);
}

export function simpleView(cwd, diff) {
    return toCompareViews(cwd, diff).then(toTextTable);
}
