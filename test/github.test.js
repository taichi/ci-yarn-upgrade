import test from "ava";

import { __test__ } from "../src/github";

const [CompareModel] = __test__;

test("CompareModel#rangeWanted", t => {
    let cw = new CompareModel(["wayway", "0.0.1", "0.2.0", "3.1.6"]);
    t.true(cw.rangeWanted() === "v0.0.1...v0.2.0");
});

test("CompareModel#rangeLatest", t => {
    let cw = new CompareModel(["wayway", "0.0.1", "0.2.0", "3.1.6"]);
    t.true(cw.rangeLatest() === "v0.0.1...v3.1.6");
});

test("CompareModel#versionRange#noRange", t => {
    let cw = new CompareModel(["wayway", "0.0.1", "0.2.0", "3.1.6"]);
    t.true(cw.versionRange("0.0.1") === "v0.0.1");
});

test("CompareModel#diffWantedURL#norepo", t => {
    let cw = new CompareModel(["wayway", "0.0.1", "0.2.0", "3.1.6"]);
    t.true(cw.diffWantedURL() === "");
});

test("CompareModel#diffWantedURL", t => {
    let cw = new CompareModel(["wayway", "0.0.1", "0.2.0", "3.1.6"]);
    cw.repo = "http://github.com/taichi/test-project";
    t.true(cw.diffWantedURL() === `${cw.repo}/compare/v0.0.1...v0.2.0`);
});

test("CompareModel#diffLatestURL", t => {
    let cw = new CompareModel(["wayway", "0.0.1", "0.2.0", "3.1.6"]);
    cw.repo = "http://github.com/taichi/test-project";
    t.true(cw.diffLatestURL() === `${cw.repo}/compare/v0.0.1...v3.1.6`);
});

test("CompareModel#diffURL#tree", t => {
    let cw = new CompareModel(["wayway", "0.0.1", "0.2.0", "3.1.6"]);
    cw.repo = "http://github.com/taichi/test-project";
    t.true(cw.diffURL("0.0.1") === `${cw.repo}/tree/v0.0.1`);
});
