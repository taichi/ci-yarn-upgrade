import test from "ava";

import pkg from "../package.json";
import { toMarkdown, toTextTable } from "../src/compare";
import { __test__ } from "../src/github";

const [CompareModel] = __test__;

test("toMarkdown#simple", t => {
    let diff = [
        ["classnames", "2.2.0", "2.2.0", "2.2.5", "dependencies"],
        ["react", "15.0.0", "15.3.2", "15.3.2", "devDependencies"],
        ["fsevents", "1.0.0", "1.0.7", "1.0.14", "optionalDependencies"]
    ];
    let map = new Map(diff.map(e => {
        let cw = new CompareModel(e);
        return [cw.name, cw];
    }));
    let expected = `## Updating Dependencies

| Name | Updating | Latest | dependencies | devDependencies | optionalDependencies |
|:---- |:--------:|:------:|:-:|:-:|:-:|
| classnames | 2.2.0 | 2.2.5 | * |   |   |
| react | 15.0.0...15.3.2 | 15.3.2 |   | * |   |
| fsevents | 1.0.0...1.0.7 | 1.0.14 |   |   | * |

Powered by [${pkg.name}](${pkg.homepage})`.split(/[\r]?\n/);
    let actual = toMarkdown(map).split(/[\r]?\n/);
    for (let i in expected) {
        t.is(actual[i], expected[i]);
    }
});

test("toMarkdown#complex", t => {
    let cw = new CompareModel(["react", "15.0.0", "15.3.2", "15.3.2"]);
    cw.tags = new Set(["v15.0.0", "v15.3.2", "v15.3.2"]);
    cw.homepage = "https://facebook.github.io/react/";
    cw.repo = "https://github.com/facebook/react";
    let map = new Map().set(cw.name, cw);
    let expected = `## Updating Dependencies

| Name | Updating | Latest |
|:---- |:--------:|:------:|
| [react](${cw.homepage}) | [15.0.0...15.3.2](${cw.repo}/compare/v15.0.0...v15.3.2) | [15.3.2](${cw.repo}/compare/v15.0.0...v15.3.2) |

Powered by [${pkg.name}](${pkg.homepage})`.split(/[\r]?\n/);
    let actual = toMarkdown(map).split(/[\r]?\n/);
    for (let i in expected) {
        t.is(actual[i], expected[i]);
    }
});

test("toTextTable", t => {
    let diff = [
        ["classnames", "2.2.0", "2.2.0", "2.2.5", "dependencies"],
        ["react", "15.0.0", "15.3.2", "15.3.2", "devDependencies"],
        ["fsevents", "1.0.0", "1.0.7", "1.0.14", "optionalDependencies"]
    ];
    let map = new Map(diff.map(e => {
        let cw = new CompareModel(e);
        return [cw.name, cw];
    }));
    let expected = `\u001b[90m============\u001b[39m\u001b[90m==================\u001b[39m\u001b[90m=========\u001b[39m\u001b[90m===============\u001b[39m\u001b[90m==================\u001b[39m\u001b[90m=======================\u001b[39m
 Name \u001b[90m|\u001b[39m    Updating     \u001b[90m|\u001b[39m Latest \u001b[90m|\u001b[39m dependencies \u001b[90m|\u001b[39m devDependencies \u001b[90m|\u001b[39m optionalDependencies
\u001b[90m------------\u001b[39m\u001b[90m------------------\u001b[39m\u001b[90m---------\u001b[39m\u001b[90m---------------\u001b[39m\u001b[90m------------------\u001b[39m\u001b[90m-----------------------\u001b[39m
 classnames \u001b[90m|\u001b[39m      2.2.0      \u001b[90m|\u001b[39m 2.2.5  \u001b[90m|\u001b[39m      *       \u001b[90m|\u001b[39m                 \u001b[90m|\u001b[39m
\u001b[90m------------\u001b[39m\u001b[90m------------------\u001b[39m\u001b[90m---------\u001b[39m\u001b[90m---------------\u001b[39m\u001b[90m------------------\u001b[39m\u001b[90m-----------------------\u001b[39m
 react \u001b[90m|\u001b[39m 15.0.0...15.3.2 \u001b[90m|\u001b[39m 15.3.2 \u001b[90m|\u001b[39m              \u001b[90m|\u001b[39m        *        \u001b[90m|\u001b[39m
\u001b[90m------------\u001b[39m\u001b[90m------------------\u001b[39m\u001b[90m---------\u001b[39m\u001b[90m---------------\u001b[39m\u001b[90m------------------\u001b[39m\u001b[90m-----------------------\u001b[39m
 fsevents \u001b[90m|\u001b[39m  1.0.0...1.0.7  \u001b[90m|\u001b[39m 1.0.14 \u001b[90m|\u001b[39m              \u001b[90m|\u001b[39m                 \u001b[90m|\u001b[39m          *
\u001b[90m============\u001b[39m\u001b[90m==================\u001b[39m\u001b[90m=========\u001b[39m\u001b[90m===============\u001b[39m\u001b[90m==================\u001b[39m\u001b[90m=======================\u001b[39m`.split(/[\r]?\n/);

    let actual = toTextTable(map).split(/[\r]?\n/);
    for (let i in expected) {
        t.is(actual[i].trim(), expected[i].trim());
    }
});
