"""Validate all reference implementations and their practice contracts, without third-party services."""
import copy
import json
import sqlite3
from pathlib import Path

root = Path(__file__).resolve().parents[1]
python = json.loads((root/'src/lib/coding/python.json').read_text())
sql = json.loads((root/'src/lib/coding/sql.json').read_text())
assert len(python) == 75
assert len(sql) == 40
assert len({p['id'] for p in python+sql}) == 115
checks = 0
PANELS = {'array','grid','tree','graph','intervals','list','kv','stack','bits'}
for lesson in python:
    assert 'pass' not in lesson['solution'].split(), (lesson['title'], 'placeholder solution')
    trace = lesson.get('trace') or []
    assert len(trace) >= 2, (lesson['title'], 'missing step-by-step trace')
    for frame in trace:
        assert frame['note'].strip() and frame['panels'], (lesson['title'], frame)
        assert all(p['type'] in PANELS for p in frame['panels']), (lesson['title'], frame)
    namespace = {}
    exec(lesson['solution'], namespace)
    assert len(lesson['tests']) >= 3
    for test in lesson['tests']:
        actual = namespace['solve'](*copy.deepcopy(test['input']))
        assert actual == test['expected'], (lesson['title'], test, actual)
        json.dumps(actual, allow_nan=False)
        checks += 1
for lesson in sql:
    for test in lesson['tests']:
        db = sqlite3.connect(':memory:')
        db.executescript(test['setup'])
        actual = None
        for statement in lesson['solution'].split(';'):
            if statement.strip():
                cursor = db.execute(statement)
                if cursor.description:
                    actual = {'columns':[c[0] for c in cursor.description], 'values':[list(r) for r in cursor.fetchall()]}
        if lesson.get('verifyQuery'):
            cursor = db.execute(lesson['verifyQuery'])
            actual = {'columns':[c[0] for c in cursor.description], 'values':[list(r) for r in cursor.fetchall()]}
        assert actual == test['expected'], (lesson['title'],test['label'],actual,test['expected'])
        for probe in lesson.get('mustReject', []):
            try:
                db.execute(probe)
            except sqlite3.IntegrityError:
                checks += 1
            else:
                raise AssertionError((lesson['title'], 'Missing constraint', probe))
        db.close()
        checks += 1
print(f'PASS: {len(python)} Python problems, {len(sql)} SQL patterns, {checks} reference checks.')
