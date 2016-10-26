import test from "ava";

import { __test__ } from "../src/upgrade-request";

const [findOutdatedDeps, findExistingBranch, selectPushPromise, selectDeletePromise] = __test__;

let LOG = () => { };

test("findOutdatedDeps#worksNormally", t => {
    let json = {
        "type": "table", "data":
        {
            "head": ["Package", "Current", "Wanted", "Latest"],
            "body": [
                ["classnames", "2.2.0", "2.2.0", "2.2.5"],
                ["react", "15.0.0", "15.3.2", "15.3.2"],
                ["react-dom", "15.0.0", "15.3.2", "15.3.2"]]
        }
    };
    let fin = { "type": "finished", "data": 1502 };
    let [diff, hex] = findOutdatedDeps(LOG, JSON.stringify(json) + "\n" + JSON.stringify(fin));
    t.deepEqual(diff, json.data.body);
    t.true(hex === "f629b46a0b81cad0eb4b418daf62a1850b96755c");
});

test("findOutdatedDeps#finishOnly", t => {
    let fin = { "type": "finished", "data": 1502 };
    t.plan(1);
    return findOutdatedDeps(LOG, JSON.stringify(fin))
        .catch(m => t.pass(m));
});

test("findOutdatedDeps#latestOnly", t => {
    let json = {
        "type": "table", "data":
        {
            "head": ["Package", "Current", "Wanted", "Latest"],
            "body": [
                ["classnames", "2.2.0", "2.2.0", "2.2.5"],
                ["react", "15.0.0", "15.0.0", "15.3.2"],
                ["react-dom", "15.0.0", "15.0.0", "15.3.2"]]
        }
    };
    let fin = { "type": "finished", "data": 1502 };
    t.plan(1);
    return findOutdatedDeps(LOG, JSON.stringify(json) + "\n" + JSON.stringify(fin))
        .catch(m => t.pass(m));
});

test("findExistingBranch#worksNormally", t => {
    let options = {
        prefix: "hogehoge/",
        now: "112233"
    };
    let names = [];
    let d = { b: "c" };
    let hex = "azazazaz";
    let [newBranch, diff] = findExistingBranch(LOG, options, names, d, hex);
    t.is(newBranch, `${options.prefix}${options.now}/${hex}`);
    t.is(diff, d);
});

test("findExistingBranch#foundExistingBranch", t => {
    let options = {
        prefix: "hogehoge/",
        now: "112233"
    };
    let hex = "azazazaz";
    let names = ["3322", `hoge/22/${hex}`, "dddd"];
    let d = { b: "c" };
    t.plan(1);
    return findExistingBranch(LOG, options, names, d, hex)
        .catch(m => t.pass(m));
});

test("selectPushPromise#worksNormally", t => {
    let options = {
        execute: true
    };
    let r = "origin";
    let b = "mybranch";
    t.plan(1);
    return selectPushPromise(LOG, options, {
        push: (remote, branch) => {
            t.deepEqual([remote, branch], [r, b]);
        }
    }, r, b);
});

test("selectPushPromise#emptyPromise", t => {
    let options = {
        execute: false
    };
    t.plan(1);
    return selectPushPromise(LOG, options, {}, {}).then(() => t.pass());
});

test("selectDeletePromise#worksNormally", t => {
    let options = {
        keep: false
    };
    let branch = "mybranch";
    let report = "myReport";
    t.plan(2);
    return selectDeletePromise(LOG, options, {
        deleteBranch: b => {
            t.is(b, branch);
            return {
                then: (fn) => {
                    t.is(fn(), report);
                }
            };
        }
    }, branch, report);
});

test("selectDeletePromise#emptyPromise", t => {
    let options = {
        keep: true
    };
    let report = "myReport";
    t.plan(1);
    return selectDeletePromise(LOG, options, {}, "", report).then(r => t.is(r, report));
});
