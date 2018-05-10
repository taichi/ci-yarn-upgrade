import Table from "@taichi/cli-table2";

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

function makeColumns(entries) {
    let columns = [];
    columns.push(new Column("Name", ":---- ", cw => {
        return cw.homepage ? `[${cw.name}](${cw.homepage})` : `\`${cw.name}\``;
    }, "left", cw => cw.name));
    columns.push(new Column("Updating", ":--------:", cw => {
        let u = cw.diffWantedURL();
        return u ? `[${cw.rangeWanted()}](${u})` : cw.rangeWanted();
    }, "center", cw => cw.rangeWanted()));
    columns.push(new Column("Latest", ":------:", cw => {
        let u = cw.diffLatestURL();
        return u ? `[${cw.latest}](${u})` : cw.latest;
    }, "center", cw => cw.latest));
    let depnames = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies", "bundledDependencies", "shadow"];
    depnames.forEach(n => {
        if (entries.find(v => v.packageType === n)) {
            let fn = cw => cw.packageType === n ? "*" : " ";
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

export function toMarkdown(map) {
    let entries = Array.from(map.values());
    let columns = makeColumns(entries);
    return `## Updating Dependencies

${headers(columns)}
${layouts(columns)}
${rows(columns, entries)}

Powered by [${pkg.name}](${pkg.homepage})`;
}

export function toTextTable(map) {
    let entries = Array.from(map.values());
    let columns = makeColumns(entries);
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
