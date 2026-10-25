const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const { loadPyodide } = require("pyodide");
const initSqlJs = require("sql.js");
const root = path.resolve(__dirname, "..");
let response;
const context = vm.createContext({
  console,
  self: {
    postMessage: (data) => {
      if (data.status === "done" || data.status === "error") response = data;
    },
  },
  importScripts: () => {},
  loadPyodide: (opts) =>
    loadPyodide({
      ...opts,
      indexURL: path.dirname(require.resolve("pyodide")) + "/",
    }),
  initSqlJs: () =>
    initSqlJs({
      locateFile: (f) => path.join(path.dirname(require.resolve("sql.js")), f),
    }),
});
vm.runInContext(
  fs.readFileSync(root + "/public/coding/runner.js", "utf8"),
  context,
);
(async () => {
  let count = 0;
  for (const track of ["python", "sql"]) {
    const lessons = JSON.parse(
      fs.readFileSync(root + `/src/lib/coding/${track}.json`, "utf8"),
    );
    for (const lesson of lessons) {
      response = null;
      await context.self.onmessage({
        data: {
          track,
          code: lesson.solution,
          tests: lesson.tests,
          verifyQuery: lesson.verifyQuery,
          mustReject: lesson.mustReject,
        },
      });
      if (
        response?.status !== "done" ||
        response.results.length !== lesson.tests.length ||
        response.results.some((r) => !r.passed)
      ) {
        console.error("FAIL", lesson.title, JSON.stringify(response));
        process.exit(1);
      }
      count += response.results.length;
    }
    console.log(
      `PASS: ${lessons.length} ${track} lessons through actual worker message handler`,
    );
  }
  await context.self.onmessage({
    data: {
      track: "python",
      code: "def solve(nums, target):\n    return []",
      tests: [{ input: [[2, 7], 9], expected: [0, 1] }],
    },
  });
  if (response.results[0].passed) throw new Error("Wrong answer passed");
  await context.self.onmessage({
    data: { track: "python", code: "this is broken syntax !", tests: [] },
  });
  if (!response.results[0].error) throw new Error("Syntax error missing");
  await context.self.onmessage({
    data: {
      track: "python",
      code: "def solve(x):\n    return x*2",
      tests: [],
      custom: [7],
    },
  });
  if (response.results[0].actual !== 14 || !response.custom)
    throw new Error("Custom input failed");
  await context.self.onmessage({
    data: {
      track: "sql",
      code: "SELEC bad;",
      tests: [
        {
          label: "error",
          setup: "CREATE TABLE t(id);",
          expected: { columns: [], values: [] },
        },
      ],
    },
  });
  if (!response.results[0].error) throw new Error("SQL error missing");
  const l = JSON.parse(
    fs.readFileSync(root + "/src/lib/coding/sql.json", "utf8"),
  ).find((l) => l.mustReject);
  await context.self.onmessage({
    data: {
      track: "sql",
      code: "CREATE TABLE balances(account_id INTEGER PRIMARY KEY, amount INTEGER NOT NULL); INSERT INTO balances VALUES(1,100);",
      tests: l.tests,
      verifyQuery: l.verifyQuery,
      mustReject: l.mustReject,
    },
  });
  if (response.results.some((r) => r.passed))
    throw new Error("Missing CHECK constraint passed");
  console.log(
    `PASS: ${count} runtime fixture checks plus wrong-answer, Python syntax, custom input, SQL syntax and missing-constraint cases`,
  );
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
