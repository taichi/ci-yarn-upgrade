import Table from "cli-table2";

import pkg from "../package.json";

class Column {
    constructor(name, layout, render, simpleLayout, simpleRender) {
        this.name = name;
        this.layout = layout;
        this.render = render;
        this.simpleLayout = simpleLayout;
        this.simpleRender = simpleRender;
    }
}

function makeColumns(rootDef, map) {
    let columns = [];
    columns.push(new Column("Name", ":---- ", cw => {
        return cw.homepage ? `[${cw.name}](${cw.homepage})` : cw.name;
    }, "right", cw => cw.name));
    columns.push(new Column("Updating", ":--------:", cw => {
        return cw.repo ? `[${cw.rangeWanted()}](${cw.diffWantedURL()})` : cw.rangeWanted();
    }, "center", cw => cw.rangeWanted()));
    columns.push(new Column("Latest", ":------:", cw => {
        return cw.repo ? `[v${cw.latest}](${cw.diffLatestURL()})` : `v${cw.latest}`;
    }, "center", cw => `v${cw.latest}`));
    let depnames = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies", "bundledDependencies"];
    depnames.forEach(n => {
        let deps = rootDef[n];
        if (deps && Array.from(map.keys()).find(k => deps[k])) {
            let fn = cw => deps[cw.name] ? "*" : " ";
            columns.push(new Column(n, ":-:", fn, "center", fn));
        }
    });

    return columns;
}

function headers(columns) {
    let a = columns.map(col => col.name);
    return "| " + a.join(" | ") + " |";
}

function layouts(columns) {
    let a = columns.map(col => col.layout);
    return "|" + a.join("|") + "|";
}

function rows(columns, entries) {
    return entries.map(c => {
        let a = columns.map(col => col.render(c));
        return "| " + a.join(" | ") + " |";
    }).join("\n");
}

export function toMarkdown(rootDef, map) {
    let columns = makeColumns(rootDef, map);
    let entries = Array.from(map.values());
    return `## Updating Dependencies

${headers(columns)}
${layouts(columns)}
${rows(columns, entries)}

Powered by [${pkg.name}](${pkg.homepage})`;
}

export function toTextTable(rootDef, map) {
    let columns = makeColumns(rootDef, map);
    let entries = Array.from(map.values());
    let t = new Table({
        head: columns.map(col => col.name),
        chars: {
            "top": "=", "top-mid": "=", "top-left": "", "top-right": ""
            , "bottom": "=", "bottom-mid": "=", "bottom-left": "", "bottom-right": ""
            , "left": "", "left-mid": "", "mid": "-", "mid-mid": "-"
            , "right": "", "right-mid": "", "middle": "|"
        },
        colAligns: columns.map(col => col.simpleLayout),
        style: {
            head: [],
            "padding-left": 1,
            "padding-right": 1
        }
    });

    entries.forEach(c => {
        t.push(columns.map(col => col.simpleRender(c)));
    });
    return t.toString();
}
