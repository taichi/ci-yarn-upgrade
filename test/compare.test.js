import test from "ava";

import pkg from "../package.json";
import { __test__ } from "../src/compare.js";

const [CompareView, toMarkdown, toTextTable] = __test__;

test("CompareView#rangeWanted", t => {
    let cw = new CompareView(["wayway", "0.0.1", "0.2.0", "3.1.6"]);
    t.true(cw.rangeWanted() === "v0.0.1...v0.2.0");
});

test("CompareView#rangeLatest", t => {
    let cw = new CompareView(["wayway", "0.0.1", "0.2.0", "3.1.6"]);
    t.true(cw.rangeLatest() === "v0.0.1...v3.1.6");
});

test("CompareView#versionRange#noRange", t => {
    let cw = new CompareView(["wayway", "0.0.1", "0.2.0", "3.1.6"]);
    t.true(cw.versionRange("0.0.1") === "v0.0.1");
});

test("CompareView#diffWantedURL#norepo", t => {
    let cw = new CompareView(["wayway", "0.0.1", "0.2.0", "3.1.6"]);
    t.true(cw.diffWantedURL() === "");
});

test("CompareView#diffWantedURL", t => {
    let cw = new CompareView(["wayway", "0.0.1", "0.2.0", "3.1.6"]);
    cw.repo = "http://github.com/taichi/test-project";
    t.true(cw.diffWantedURL() === `${cw.repo}/compare/v0.0.1...v0.2.0`);
});

test("CompareView#diffLatestURL", t => {
    let cw = new CompareView(["wayway", "0.0.1", "0.2.0", "3.1.6"]);
    cw.repo = "http://github.com/taichi/test-project";
    t.true(cw.diffLatestURL() === `${cw.repo}/compare/v0.0.1...v3.1.6`);
});

test("CompareView#diffURL#tree", t => {
    let cw = new CompareView(["wayway", "0.0.1", "0.2.0", "3.1.6"]);
    cw.repo = "http://github.com/taichi/test-project";
    t.true(cw.diffURL("0.0.1") === `${cw.repo}/tree/v0.0.1`);
});

test("toMarkdown#simple", t => {
    let diff = [
        ["classnames", "2.2.0", "2.2.0", "2.2.5"],
        ["react", "15.0.0", "15.3.2", "15.3.2"]
    ];
    let map = new Map(diff.map(e => {
        let cw = new CompareView(e);
        return [cw.name, cw];
    }));
    let expected = `## Updating Dependencies

| Name | Updating | Latest |
|:---- |:--------:|:------:|
| classnames | v2.2.0 | v2.2.5 |
| react | v15.0.0...v15.3.2 | v15.3.2 |

Powered by [${pkg.name}](${pkg.homepage})`.split(/[\r]?\n/);
    let actual = toMarkdown([{}, map]).split(/[\r]?\n/);
    for (let i in expected) {
        t.is(actual[i], expected[i]);
    }
});

test("toMarkdown#complex", t => {
    let cw = new CompareView(["react", "15.0.0", "15.3.2", "15.3.2"]);
    cw.homepage = "https://facebook.github.io/react/";
    cw.repo = "https://github.com/facebook/react";
    let map = new Map().set(cw.name, cw);
    let expected = `## Updating Dependencies

| Name | Updating | Latest |
|:---- |:--------:|:------:|
| [react](${cw.homepage}) | [v15.0.0...v15.3.2](${cw.repo}/compare/v15.0.0...v15.3.2) | [v15.3.2](${cw.repo}/compare/v15.0.0...v15.3.2) |

Powered by [${pkg.name}](${pkg.homepage})`.split(/[\r]?\n/);
    let actual = toMarkdown([{}, map]).split(/[\r]?\n/);
    for (let i in expected) {
        t.is(actual[i], expected[i]);
    }
});

test("toTextTable", t => {
    let diff = [
        ["classnames", "2.2.0", "2.2.0", "2.2.5"],
        ["react", "15.0.0", "15.3.2", "15.3.2"]
    ];
    let map = new Map(diff.map(e => {
        let cw = new CompareView(e);
        return [cw.name, cw];
    }));
    let expected = `\u001b[90m============\u001b[39m\u001b[90m====================\u001b[39m\u001b[90m=========\u001b[39m
 Name       \u001b[90m|\u001b[39m Updating          \u001b[90m|\u001b[39m Latest
\u001b[90m------------\u001b[39m\u001b[90m--------------------\u001b[39m\u001b[90m---------\u001b[39m
 classnames \u001b[90m|\u001b[39m v2.2.0            \u001b[90m|\u001b[39m 2.2.5
\u001b[90m------------\u001b[39m\u001b[90m--------------------\u001b[39m\u001b[90m---------\u001b[39m
 react      \u001b[90m|\u001b[39m v15.0.0...v15.3.2 \u001b[90m|\u001b[39m 15.3.2
\u001b[90m============\u001b[39m\u001b[90m====================\u001b[39m\u001b[90m=========\u001b[39m`.split(/[\r]?\n/);

    let actual = toTextTable([{}, map]).split(/[\r]?\n/);
    for (let i in expected) {
        t.is(actual[i].trim(), expected[i].trim());
    }
});
