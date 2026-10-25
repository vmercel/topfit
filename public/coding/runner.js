/* Client-only execution. Never executes submitted code on the application server. */
let pythonReady;
let sqlReady;
let output = '';
const append = text => { if (output.length < 4000) output += text.slice(0, 4000-output.length) + '\n'; };
self.onmessage = async ({ data }) => {
  const { track, code, tests, custom, verifyQuery } = data;
  output = '';
  try {
    self.postMessage({ status: 'loading' });
    if (track === 'python') {
      if (!pythonReady) pythonReady = (async () => {
        importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');
        return await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/', stdout: append, stderr: append });
      })();
      const py = await pythonReady;
      self.postMessage({ status: 'running' });
      py.globals.set('_tf_code', code);
      py.globals.set('_tf_cases', JSON.stringify(custom !== undefined ? [{ input: custom }] : tests));
      const serialized = await py.runPythonAsync(`
import json as _tf_json, copy as _tf_copy
_tf_results = []
_tf_ns = {'__name__': '__practice__'}
try:
    exec(_tf_code, _tf_ns)
    if not callable(_tf_ns.get('solve')):
        raise ValueError('Define a function named solve with the arguments shown in the contract.')
    for _tf_index, _tf_case in enumerate(_tf_json.loads(_tf_cases)):
        try:
            _tf_actual = _tf_ns['solve'](*_tf_copy.deepcopy(_tf_case['input']))
            _tf_json.dumps(_tf_actual, allow_nan=False)
            _tf_results.append({'label': 'Case ' + str(_tf_index + 1), 'passed': 'expected' in _tf_case and _tf_actual == _tf_case['expected'], 'actual': _tf_actual, 'expected': _tf_case.get('expected')})
        except Exception as _tf_error:
            _tf_results.append({'label': 'Case ' + str(_tf_index + 1), 'passed': False, 'error': str(_tf_error)[:2000], 'expected': _tf_case.get('expected')})
except Exception as _tf_error:
    _tf_results = [{'label': 'Python error', 'passed': False, 'error': str(_tf_error)[:2000]}]
_tf_json.dumps(_tf_results, allow_nan=False)
`);
      py.globals.delete('_tf_code'); py.globals.delete('_tf_cases');
      self.postMessage({ status: 'done', results: JSON.parse(serialized), output, custom: custom !== undefined });
    } else {
      if (!sqlReady) sqlReady = (async () => {
        importScripts('https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/sql-wasm.js');
        return await initSqlJs({ locateFile: f => `https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/${f}` });
      })();
      const SQL = await sqlReady;
      self.postMessage({ status: 'running' });
      const results = [];
      for (const test of tests) {
        const db = new SQL.Database();
        try {
          db.run(test.setup);
          const queries = db.exec(code);
          const checked = verifyQuery ? db.exec(verifyQuery) : queries;
          const actual = checked.length ? checked[checked.length-1] : { columns: [], values: [] };
          if (actual.values.length > 2000) throw new Error('Result exceeds 2,000 rows. Narrow the query.');
          results.push({ label: test.label, actual, expected: test.expected, passed: JSON.stringify(actual) === JSON.stringify(test.expected) });
        } catch (error) {
          results.push({ label: test.label, passed: false, error: error.message, expected: test.expected });
        } finally { db.close(); }
      }
      self.postMessage({ status: 'done', results, output });
    }
  } catch (error) {
    self.postMessage({ status: 'error', error: `${error.message}. If the runtime could not load, check your connection and allow cdn.jsdelivr.net, then retry.` });
  }
};
