"""Generate a problem-specific visual trace for every Python lesson.

Each tracer replays the reference algorithm on the lesson's first example and
records frames: a short note, visual panels (array, grid, tree, graph,
intervals, linked list, key-value map, stack/heap, bits) and the live variables.
Run: python3 scripts/build-traces.py  (rewrites src/lib/coding/python.json)
"""
import heapq
import json
from collections import Counter, defaultdict, deque
from pathlib import Path

root = Path(__file__).resolve().parents[1]
path = root / "src/lib/coding/python.json"
lessons = json.loads(path.read_text())


# ---------- panel helpers ----------
def A(values, hl=(), ptr=None, win=None, label="", done=(), labels=None):
    p = {"type": "array", "values": list(values), "hl": list(hl), "label": label}
    if ptr:
        p["ptr"] = {k: v for k, v in ptr.items() if v is not None}
    if win is not None:
        p["win"] = list(win)
    if done:
        p["done"] = list(done)
    if labels:
        p["labels"] = list(labels)
    return p


def G(cells, hl=(), marks=(), label="", rows=None, cols=None):
    p = {"type": "grid", "cells": [list(r) for r in cells], "hl": [list(x) for x in hl],
         "marks": [list(x) for x in marks], "label": label}
    if rows:
        p["rows"] = list(rows)
    if cols:
        p["cols"] = list(cols)
    return p


def T(values, hl=(), label="", done=()):
    return {"type": "tree", "values": list(values), "hl": list(hl), "done": list(done), "label": label}


def GR(n, edges, directed=False, hl=(), visited=(), labels=None, label="", hledges=()):
    p = {"type": "graph", "n": n, "edges": [list(e) for e in edges], "directed": directed,
         "hl": list(hl), "visited": list(visited), "label": label, "hledges": [list(e) for e in hledges]}
    if labels:
        p["labels"] = list(labels)
    return p


def IV(items, hl=(), label="", result=None):
    p = {"type": "intervals", "items": [list(x) for x in items], "hl": list(hl), "label": label}
    if result is not None:
        p["result"] = [list(x) for x in result]
    return p


def L(values, hl=(), ptr=None, cycle=None, label=""):
    p = {"type": "list", "values": list(values), "hl": list(hl), "label": label}
    if ptr:
        p["ptr"] = {k: v for k, v in ptr.items() if v is not None}
    if cycle is not None:
        p["cycle"] = cycle
    return p


def KV(d, label="", hl=None):
    return {"type": "kv", "entries": [[str(k), json.dumps(v) if not isinstance(v, str) else v] for k, v in d.items()],
            "label": label, "hl": [] if hl is None else [str(h) for h in hl]}


def S(items, label="", hl=()):
    return {"type": "stack", "items": [x if isinstance(x, str) else json.dumps(x) for x in items], "label": label, "hl": list(hl)}


def B(value, width=8, hl=(), label=""):
    bits = format(value & ((1 << width) - 1), f"0{width}b")
    return {"type": "bits", "bits": bits, "hl": list(hl), "label": label}


def F(note, *panels, **vars_):
    return {"note": note, "panels": list(panels), "vars": {k: (v if isinstance(v, str) else json.dumps(v)) for k, v in vars_.items()}}


TRACERS = {}


def tracer(name):
    def wrap(fn):
        TRACERS[name] = fn
        return fn
    return wrap


# ---------- arrays & hashing ----------
@tracer("two-sum")
def _(nums, target):
    fr, seen = [], {}
    for i, v in enumerate(nums):
        need = target - v
        if need in seen:
            fr.append(F(f"need = {target} - {v} = {need}, and {need} is in the map at index {seen[need]}. Return [{seen[need]}, {i}].",
                        A(nums, hl=[seen[need], i], ptr={"i": i}, label="nums"), KV(seen, "seen value → index", hl=[need]), need=need))
            return fr
        fr.append(F(f"need = {target} - {v} = {need} is not in the map yet. Store {v} → {i}.",
                    A(nums, hl=[i], ptr={"i": i}, label="nums"), KV({**seen, v: i}, "seen value → index", hl=[v]), need=need))
        seen[v] = i
    return fr


@tracer("best-time-to-buy-and-sell-stock")
def _(prices):
    fr, low, best, li = [], float("inf"), 0, None
    for i, p in enumerate(prices):
        if p < low:
            low, li = p, i
        gain = p - low
        note = f"Price {p}. Cheapest so far is {low}"
        if gain > best:
            best = gain
            note += f"; selling now earns {gain}, the new best."
        else:
            note += f"; selling now earns {gain}, best stays {best}."
        fr.append(F(note, A(prices, hl=[i], ptr={"buy": li, "sell": i}, label="prices"), low=low, best=best))
    return fr


@tracer("contains-duplicate")
def _(nums):
    fr, seen = [], set()
    for i, v in enumerate(nums):
        if v in seen:
            fr.append(F(f"{v} is already in the set: a duplicate. Return True.", A(nums, hl=[i], ptr={"i": i}, label="nums"),
                        S(sorted(seen), "seen set", hl=[sorted(seen).index(v)])))
            return fr
        seen.add(v)
        fr.append(F(f"{v} is new. Add it to the set.", A(nums, hl=[i], ptr={"i": i}, label="nums"), S(sorted(seen), "seen set")))
    fr.append(F("Finished the scan with no repeats. Return False.", A(nums, label="nums"), S(sorted(seen), "seen set")))
    return fr


@tracer("product-of-array-except-self")
def _(nums):
    n, fr = len(nums), []
    out, pre = [1] * n, 1
    for i in range(n):
        out[i] = pre
        fr.append(F(f"Left pass: out[{i}] = product of everything left of index {i} = {pre}.",
                    A(nums, hl=[i], ptr={"i": i}, label="nums"), A(out, hl=[i], label="out (prefix products)"), prefix=pre))
        pre *= nums[i]
    suf = 1
    for i in range(n - 1, -1, -1):
        out[i] *= suf
        fr.append(F(f"Right pass: multiply out[{i}] by the product of everything right of it ({suf}). out[{i}] = {out[i]}.",
                    A(nums, hl=[i], ptr={"i": i}, label="nums"), A(out, hl=[i], label="out"), suffix=suf))
        suf *= nums[i]
    return fr


@tracer("maximum-subarray")
def _(nums):
    fr, cur, best, start, bs, be = [], 0, nums[0], 0, 0, 0
    for i, v in enumerate(nums):
        if cur + v < v:
            cur, start = v, i
            note = f"Running sum would be worse than {v} alone: restart the window at index {i}."
        else:
            cur += v
            note = f"Extend the window with {v}; running sum = {cur}."
        if cur > best:
            best, bs, be = cur, start, i
            note += f" New best {best}."
        fr.append(F(note, A(nums, hl=list(range(bs, be + 1)), win=[start, i], ptr={"i": i}, label="nums (green = best so far, bracket = current window)"),
                    current=cur, best=best))
    return fr


@tracer("maximum-product-subarray")
def _(nums):
    fr = []
    hi = lo = best = nums[0]
    fr.append(F(f"Start with {nums[0]}: max and min products both {nums[0]}.", A(nums, hl=[0], ptr={"i": 0}, label="nums"), hi=hi, lo=lo, best=best))
    for i in range(1, len(nums)):
        v = nums[i]
        cands = (v, hi * v, lo * v)
        hi, lo = max(cands), min(cands)
        best = max(best, hi)
        tip = " A negative flips max and min, which is why we keep both." if v < 0 else ""
        fr.append(F(f"Value {v}: candidates {list(cands)} → max {hi}, min {lo}.{tip}", A(nums, hl=[i], ptr={"i": i}, label="nums"), hi=hi, lo=lo, best=best))
    return fr


@tracer("find-minimum-in-rotated-sorted-array")
def _(nums):
    fr, lo, hi = [], 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]:
            note = f"nums[mid]={nums[mid]} > nums[hi]={nums[hi]}: the drop is to the right. lo = mid + 1."
            fr.append(F(note, A(nums, hl=[mid], win=[lo, hi], ptr={"lo": lo, "mid": mid, "hi": hi}, label="nums"), lo=lo, hi=hi))
            lo = mid + 1
        else:
            note = f"nums[mid]={nums[mid]} ≤ nums[hi]={nums[hi]}: the minimum is at mid or left. hi = mid."
            fr.append(F(note, A(nums, hl=[mid], win=[lo, hi], ptr={"lo": lo, "mid": mid, "hi": hi}, label="nums"), lo=lo, hi=hi))
            hi = mid
    fr.append(F(f"lo == hi at index {lo}: the minimum is {nums[lo]}.", A(nums, hl=[lo], ptr={"lo": lo}, label="nums")))
    return fr


@tracer("search-in-rotated-sorted-array")
def _(nums, target):
    fr, lo, hi = [], 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        base = A(nums, hl=[mid], win=[lo, hi], ptr={"lo": lo, "mid": mid, "hi": hi}, label=f"nums, target {target}")
        if nums[mid] == target:
            fr.append(F(f"nums[{mid}] = {target}. Found it.", base))
            return fr
        if nums[lo] <= nums[mid]:
            if nums[lo] <= target < nums[mid]:
                fr.append(F(f"Left half [{nums[lo]}..{nums[mid]}] is sorted and holds {target}: hi = mid - 1.", base)); hi = mid - 1
            else:
                fr.append(F(f"Left half [{nums[lo]}..{nums[mid]}] is sorted but {target} is outside it: lo = mid + 1.", base)); lo = mid + 1
        else:
            if nums[mid] < target <= nums[hi]:
                fr.append(F(f"Right half [{nums[mid]}..{nums[hi]}] is sorted and holds {target}: lo = mid + 1.", base)); lo = mid + 1
            else:
                fr.append(F(f"Right half is sorted but {target} is outside it: hi = mid - 1.", base)); hi = mid - 1
    fr.append(F("Window is empty: target not present. Return -1.", A(nums, label="nums")))
    return fr


@tracer("3sum")
def _(nums):
    a, fr, res = sorted(nums), [], []
    fr.append(F(f"Sort first: {a}. Fix one number, then close in with two pointers.", A(a, label="sorted nums")))
    for i in range(len(a) - 2):
        if i and a[i] == a[i - 1]:
            fr.append(F(f"Skip index {i}: {a[i]} repeats the previous anchor.", A(a, hl=[i], ptr={"i": i}, label="sorted nums")))
            continue
        l, r = i + 1, len(a) - 1
        while l < r:
            s = a[i] + a[l] + a[r]
            panel = A(a, hl=[i, l, r], ptr={"i": i, "l": l, "r": r}, label="sorted nums")
            if s == 0:
                res.append([a[i], a[l], a[r]])
                fr.append(F(f"{a[i]} + {a[l]} + {a[r]} = 0. Record the triplet, move both pointers past duplicates.", panel, S([json.dumps(t) for t in res], "triplets")))
                l += 1; r -= 1
                while l < r and a[l] == a[l - 1]:
                    l += 1
            elif s < 0:
                fr.append(F(f"Sum {s} < 0: move l right to grow it.", panel)); l += 1
            else:
                fr.append(F(f"Sum {s} > 0: move r left to shrink it.", panel)); r -= 1
    return fr


@tracer("container-with-most-water")
def _(h):
    fr, l, r, best = [], 0, len(h) - 1, 0
    while l < r:
        area = min(h[l], h[r]) * (r - l)
        best = max(best, area)
        side = "l" if h[l] < h[r] else "r"
        fr.append(F(f"Width {r - l} × min({h[l]}, {h[r]}) = {area}. Move the shorter wall ({side}); the taller one can't help a narrower box.",
                    A(h, hl=[l, r], win=[l, r], ptr={"l": l, "r": r}, label="heights"), area=area, best=best))
        if h[l] < h[r]:
            l += 1
        else:
            r -= 1
    return fr


# ---------- bits ----------
@tracer("sum-of-two-integers")
def _(a, b):
    fr, mask = [], 0xFFFFFFFF
    while b & mask:
        carry = (a & b) << 1
        fr.append(F(f"XOR adds without carry: {a} ^ {b} = {a ^ b}. AND then shift gives the carry: {carry}.",
                    B(a, 8, label="a"), B(b, 8, label="b"), B(a ^ b, 8, label="a ^ b (sum bits)"), B(carry, 8, label="carry"), a=a, b=b))
        a, b = (a ^ b) & mask, carry & mask
    fr.append(F(f"No carry left. The answer is {a}.", B(a, 8, label="result")))
    return fr


@tracer("number-of-1-bits")
def _(n):
    fr, c = [], 0
    while n:
        low = n & -n
        pos = 7 - (low.bit_length() - 1)
        c += 1
        fr.append(F(f"n & (n - 1) clears the lowest 1-bit. Count = {c}.", B(n, 8, hl=[pos], label="n"), B(n & (n - 1), 8, label="n & (n - 1)"), count=c))
        n &= n - 1
    fr.append(F(f"n is 0. There were {c} set bits.", B(0, 8, label="n")))
    return fr


@tracer("counting-bits")
def _(n):
    fr, dp = [], [0] * (n + 1)
    fr.append(F("dp[0] = 0 bits.", A(dp, hl=[0], label="dp")))
    for i in range(1, n + 1):
        dp[i] = dp[i >> 1] + (i & 1)
        fr.append(F(f"{i} = {i:b}: drop the last bit to get {i >> 1} ({dp[i >> 1]} ones) and add the last bit {i & 1}. dp[{i}] = {dp[i]}.",
                    A(dp, hl=[i, i >> 1], ptr={"i": i}, label="dp"), B(i, 4, label=f"{i} in binary")))
    return fr


@tracer("missing-number")
def _(nums):
    fr, x = [], len(nums)
    fr.append(F(f"Start with x = n = {x}. XOR every index and value; pairs cancel.", A(nums, label="nums"), x=x))
    for i, v in enumerate(nums):
        x ^= i ^ v
        fr.append(F(f"x ^= {i} ^ {v} → {x}.", A(nums, hl=[i], ptr={"i": i}, label="nums"), x=x))
    fr.append(F(f"Every present number cancelled with its index. The missing number is {x}.", A(nums, label="nums"), x=x))
    return fr


@tracer("reverse-bits")
def _(n):
    fr, out = [], 0
    for i in range(32):
        out = (out << 1) | (n & 1)
        if i < 4 or i == 31:
            fr.append(F(f"Step {i + 1}: shift result left and copy n's lowest bit ({n & 1}); then shift n right.",
                        B(n, 16, hl=[15], label="n (low 16 bits)"), B(out, 16, hl=[15], label="result (low 16 bits)"), result=out))
        n >>= 1
    fr.append(F(f"After 32 shifts the bits are mirrored. Result = {out}.", B(out, 16, label="result (low 16 bits)")))
    return fr


# ---------- dynamic programming ----------
@tracer("climbing-stairs")
def _(n):
    dp, fr = [1, 1] + [0] * (n - 1), []
    fr.append(F("1 way to stand on step 0 and 1 way to reach step 1.", A(dp, hl=[0, 1], label="ways[i]")))
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
        fr.append(F(f"ways[{i}] = ways[{i-1}] + ways[{i-2}] = {dp[i-1]} + {dp[i-2]} = {dp[i]}: the last move is 1 or 2 steps.",
                    A(dp, hl=[i, i - 1, i - 2], ptr={"i": i}, label="ways[i]")))
    return fr


@tracer("coin-change")
def _(coins, amount):
    INF = amount + 1
    dp, fr = [0] + [INF] * amount, []
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and dp[a - c] + 1 < dp[a]:
                dp[a] = dp[a - c] + 1
        best = [c for c in coins if c <= a and dp[a - c] + 1 == dp[a]]
        if a <= 6 or a == amount:
            fr.append(F(f"Amount {a}: best last coin {best[0] if best else '-'} gives {dp[a]} coins (1 + dp[{a - best[0] if best else a}]).",
                        A(["∞" if v == INF else v for v in dp], hl=[a], ptr={"amt": a}, label="min coins for amount")))
    fr.append(F(f"dp[{amount}] = {dp[amount]}.", A(["∞" if v == INF else v for v in dp], hl=[amount], label="min coins for amount")))
    return fr


@tracer("longest-increasing-subsequence")
def _(nums):
    import bisect
    tails, fr = [], []
    for v in nums:
        i = bisect.bisect_left(tails, v)
        action = "append it" if i == len(tails) else f"replace tails[{i}] = {tails[i]} with a smaller tail"
        if i == len(tails):
            tails.append(v)
        else:
            tails[i] = v
        fr.append(F(f"{v}: binary-search its spot in tails and {action}. Length = {len(tails)}.",
                    A(nums, hl=[nums.index(v)], label="nums"), A(tails, hl=[i], label="tails (smallest tail per length)"), length=len(tails)))
    return fr


@tracer("longest-common-subsequence")
def _(a, b):
    m, n = len(a), len(b)
    dp, fr = [[0] * (n + 1) for _ in range(m + 1)], []
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
                note = f"'{a[i-1]}' == '{b[j-1]}': diagonal + 1 = {dp[i][j]}."
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
                note = f"'{a[i-1]}' ≠ '{b[j-1]}': take max(up, left) = {dp[i][j]}."
        fr.append(F(f"Row for '{a[i-1]}' filled. Last cell: {note}", G(dp, hl=[[i, j] for j in range(1, n + 1)], rows=[""] + list(a), cols=[""] + list(b), label="dp[i][j]")))
    fr.append(F(f"Bottom-right cell = {dp[m][n]}.", G(dp, hl=[[m, n]], rows=[""] + list(a), cols=[""] + list(b), label="dp[i][j]")))
    return fr


@tracer("word-break")
def _(s, words):
    ws, n = set(words), len(s)
    dp, fr = [True] + [False] * n, []
    fr.append(F("dp[0] = True: the empty prefix is always breakable.", A(list(" " + s), hl=[0], label="prefix end"), A(dp, hl=[0], label="dp")))
    for i in range(1, n + 1):
        for j in range(i):
            if dp[j] and s[j:i] in ws:
                dp[i] = True
                fr.append(F(f"dp[{j}] is True and '{s[j:i]}' is a word, so dp[{i}] = True.", A(list(s), hl=list(range(j, i)), label="s"), A(dp, hl=[i, j], label="dp")))
                break
    fr.append(F(f"dp[{n}] = {dp[n]}.", A(dp, hl=[n], label="dp")))
    return fr


@tracer("combination-sum")
def _(cands, target):
    fr, res = [], []

    def go(start, remain, path):
        if remain == 0:
            res.append(path[:])
            fr.append(F(f"Remainder 0: record {path}.", A(cands, hl=[cands.index(p) for p in path], label="candidates"), S([json.dumps(r) for r in res], "found"), path=path))
            return
        for i in range(start, len(cands)):
            if cands[i] > remain:
                break
            if len(fr) < 14:
                fr.append(F(f"Try {cands[i]} (remaining {remain} → {remain - cands[i]}). Reuse allowed, so recurse from index {i}.",
                            A(cands, hl=[i], ptr={"i": i}, label="candidates"), path=path + [cands[i]], remain=remain - cands[i]))
            path.append(cands[i]); go(i, remain - cands[i], path); path.pop()
    go(0, target, [])
    return fr


@tracer("house-robber")
def _(nums):
    fr, prev, cur = [], 0, 0
    for i, v in enumerate(nums):
        take = prev + v
        prev, cur = cur, max(cur, take)
        fr.append(F(f"House {i} (${v}): rob it ({take}) or skip it ({prev}). Best = {cur}.", A(nums, hl=[i], ptr={"i": i}, label="houses"), best=cur))
    return fr


@tracer("house-robber-ii")
def _(nums):
    fr = []

    def line(arr, label, offset):
        prev = cur = 0
        for i, v in enumerate(arr):
            prev, cur = cur, max(cur, prev + v)
            fr.append(F(f"{label}: house {i + offset} (${v}) → best {cur}.", A(nums, hl=[i + offset], win=[offset, offset + len(arr) - 1], label=f"houses ({label})"), best=cur))
        return cur
    if len(nums) == 1:
        return [F(f"One house: rob it for {nums[0]}.", A(nums, hl=[0]))]
    a = line(nums[:-1], "skip last", 0)
    b = line(nums[1:], "skip first", 1)
    fr.append(F(f"The circle means first and last can't both be robbed: answer = max({a}, {b}) = {max(a, b)}.", A(nums, label="houses")))
    return fr


@tracer("decode-ways")
def _(s):
    n = len(s)
    dp, fr = [1] + [0] * n, []
    for i in range(1, n + 1):
        one, two = s[i - 1], s[i - 2:i] if i > 1 else ""
        if one != "0":
            dp[i] += dp[i - 1]
        if i > 1 and "10" <= two <= "26":
            dp[i] += dp[i - 2]
        fr.append(F(f"Prefix '{s[:i]}': single '{one}' {'adds' if one != '0' else 'cannot add'} dp[{i-1}]"
                    + (f"; pair '{two}' {'adds' if i > 1 and '10' <= two <= '26' else 'is not valid for'} dp[{i-2}]" if i > 1 else "")
                    + f". dp[{i}] = {dp[i]}.", A(list(s), hl=list(range(max(0, i - 2), i)), label="s"), A(dp, hl=[i], label="dp")))
    return fr


@tracer("unique-paths")
def _(m, n):
    dp, fr = [[1] * n for _ in range(m)], []
    fr.append(F("First row and first column have exactly one path.", G(dp, hl=[[0, j] for j in range(n)] + [[i, 0] for i in range(m)], label="paths to cell")))
    for i in range(1, m):
        for j in range(1, n):
            dp[i][j] = dp[i - 1][j] + dp[i][j - 1]
        fr.append(F(f"Row {i}: each cell = from above + from left.", G(dp, hl=[[i, j] for j in range(1, n)], label="paths to cell")))
    fr.append(F(f"Bottom-right holds {dp[-1][-1]} paths.", G(dp, hl=[[m - 1, n - 1]], label="paths to cell")))
    return fr


@tracer("jump-game")
def _(nums):
    fr, reach = [], 0
    for i, v in enumerate(nums):
        if i > reach:
            fr.append(F(f"Index {i} is beyond the farthest reach {reach}. Stuck.", A(nums, hl=[i], win=[0, reach], label="nums")))
            return fr
        reach = max(reach, i + v)
        fr.append(F(f"From index {i} we can jump {v}: farthest reach = {reach}.", A(nums, hl=[i], win=[0, min(reach, len(nums) - 1)], ptr={"i": i}, label="nums (bracket = reachable)"), reach=reach))
        if reach >= len(nums) - 1:
            fr.append(F("Reach covers the last index. True.", A(nums, hl=[len(nums) - 1], win=[0, len(nums) - 1], label="nums")))
            return fr
    return fr


# ---------- graphs ----------
@tracer("clone-graph")
def _(adj):
    n, fr = len(adj), []
    edges = [[a, b] for a in range(n) for b in adj[a] if b > a]
    seen, q = {0}, deque([0])
    fr.append(F("BFS from node 0. Create its copy and map original → copy.", GR(n, edges, hl=[0], visited=[0], label="original graph"), KV({0: "copy 0"}, "old → new")))
    clones = {0: "copy 0"}
    while q:
        u = q.popleft()
        for v in adj[u]:
            if v not in seen:
                seen.add(v); q.append(v); clones[v] = f"copy {v}"
            fr.append(F(f"Edge {u}–{v}: link copy {u} → copy {v} (create copy {v} if new).", GR(n, edges, hl=[u, v], visited=sorted(seen), hledges=[[u, v]], label="original graph"), KV(clones, "old → new")))
    return fr


@tracer("course-schedule")
def _(n, pre):
    g, indeg, fr = defaultdict(list), [0] * n, []
    for a, b in pre:
        g[b].append(a); indeg[a] += 1
    edges = [[b, a] for a, b in pre]
    q, taken = deque(i for i in range(n) if indeg[i] == 0), []
    fr.append(F(f"Count prerequisites: in-degree {indeg}. Start with courses that have none: {list(q)}.", GR(n, edges, directed=True, hl=list(q), label="prereq → course"), A(indeg, label="in-degree")))
    while q:
        u = q.popleft(); taken.append(u)
        for v in g[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
        fr.append(F(f"Take course {u}; its dependents lose one prerequisite.", GR(n, edges, directed=True, hl=[u], visited=taken, label="prereq → course"), A(indeg, label="in-degree"), taken=taken))
    fr.append(F(f"Took {len(taken)} of {n} courses: {'possible' if len(taken) == n else 'a cycle blocks the rest'}.", GR(n, edges, directed=True, visited=taken)))
    return fr


@tracer("pacific-atlantic-water-flow")
def _(h):
    m, n, fr = len(h), len(h[0]), []

    def flood(starts, name):
        seen = set(starts); st = list(starts)
        while st:
            r, c = st.pop()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < m and 0 <= nc < n and (nr, nc) not in seen and h[nr][nc] >= h[r][c]:
                    seen.add((nr, nc)); st.append((nr, nc))
        fr.append(F(f"Flood uphill from the {name} edge: these cells can drain into the {name}.", G(h, hl=sorted(seen), label=f"heights · {name}-reachable")))
        return seen
    p = flood([(0, j) for j in range(n)] + [(i, 0) for i in range(m)], "Pacific")
    a = flood([(m - 1, j) for j in range(n)] + [(i, n - 1) for i in range(m)], "Atlantic")
    both = sorted(p & a)
    fr.append(F(f"Cells in both sets reach both oceans: {[list(x) for x in both]}.", G(h, hl=both, label="answer cells")))
    return fr


@tracer("number-of-islands")
def _(grid):
    g = [row[:] for row in grid]
    m, n, fr, count = len(g), len(g[0]), [], 0
    for r in range(m):
        for c in range(n):
            if g[r][c] == 1:
                count += 1
                st, cells = [(r, c)], []
                while st:
                    i, j = st.pop()
                    if 0 <= i < m and 0 <= j < n and g[i][j] == 1:
                        g[i][j] = 0; cells.append((i, j))
                        st += [(i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)]
                fr.append(F(f"Land at ({r},{c}) starts island #{count}. Sink every connected land cell so it isn't counted again.",
                            G(grid, hl=cells, marks=[(x, y) for x in range(m) for y in range(n) if g[x][y] == 0 and grid[x][y] == 1 and (x, y) not in cells], label="grid"), islands=count))
    fr.append(F(f"Scan complete: {count} islands.", G(grid, label="grid"), islands=count))
    return fr


@tracer("longest-consecutive-sequence")
def _(nums):
    s, fr, best = set(nums), [], 0
    for v in nums:
        if v - 1 in s:
            fr.append(F(f"{v - 1} exists, so {v} is not a run start. Skip.", A(nums, hl=[nums.index(v)], label="nums")))
            continue
        run = [v]
        while run[-1] + 1 in s:
            run.append(run[-1] + 1)
        best = max(best, len(run))
        fr.append(F(f"{v} starts a run: {run} (length {len(run)}). Best = {best}.", A(nums, hl=[nums.index(x) for x in run], label="nums"), best=best))
    return fr


@tracer("alien-dictionary")
def _(words):
    chars = sorted(set("".join(words)))
    idx = {c: i for i, c in enumerate(chars)}
    edges, fr = [], []
    for w1, w2 in zip(words, words[1:]):
        for a, b in zip(w1, w2):
            if a != b:
                edges.append([idx[a], idx[b]])
                fr.append(F(f"'{w1}' vs '{w2}': first difference '{a}' before '{b}'. Add edge {a} → {b}.", GR(len(chars), edges, directed=True, labels=chars, hledges=[[idx[a], idx[b]]], label="letter order constraints")))
                break
    indeg = Counter(b for _, b in edges)
    q, order = deque(i for i in range(len(chars)) if indeg[i] == 0), []
    while q:
        u = q.popleft(); order.append(u)
        for a, b in edges:
            if a == u:
                indeg[b] -= 1
                if indeg[b] == 0:
                    q.append(b)
    fr.append(F(f"Topological order of the letters: {''.join(chars[i] for i in order)}.", GR(len(chars), edges, directed=True, labels=chars, visited=order)))
    return fr


def _uf_trace(n, edges, title):
    parent, fr = list(range(n)), []

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]; x = parent[x]
        return x
    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra == rb:
            fr.append(F(f"Edge {a}–{b}: both already share root {ra}. This edge closes a cycle.", GR(n, edges, hl=[a, b], hledges=[[a, b]], label=title), A(parent, hl=[a, b], label="parent")))
            return fr, False
        parent[ra] = rb
        fr.append(F(f"Edge {a}–{b}: union root {ra} into {rb}.", GR(n, edges, hl=[a, b], hledges=[[a, b]], label=title), A(parent, hl=[ra], label="parent")))
    return fr, True


@tracer("graph-valid-tree")
def _(n, edges):
    if len(edges) != n - 1:
        return [F(f"A tree on {n} nodes needs exactly {n-1} edges; found {len(edges)}.", GR(n, edges))]
    fr, ok = _uf_trace(n, edges, "graph")
    fr.append(F(f"{n - 1} edges and no cycle: {'a valid tree' if ok else 'not a tree'}.", GR(n, edges, visited=list(range(n)))))
    return fr


@tracer("number-of-connected-components")
def _(n, edges):
    fr, _ok = _uf_trace(n, edges, "graph")
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            x = parent[x]
        return x
    comps = n
    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb; comps -= 1
    fr.append(F(f"Every successful union merged two groups: {n} − {n - comps} = {comps} components.", GR(n, edges, visited=list(range(n))), components=comps))
    return fr


# ---------- intervals ----------
@tracer("insert-interval")
def _(intervals, new):
    fr, res, i, s, e = [], [], 0, new[0], new[1]
    allv = intervals + [new]
    while i < len(intervals) and intervals[i][1] < s:
        res.append(intervals[i])
        fr.append(F(f"{intervals[i]} ends before {new} starts: copy it.", IV(allv, hl=[i, len(intervals)], result=res, label="intervals + new")))
        i += 1
    while i < len(intervals) and intervals[i][0] <= e:
        s, e = min(s, intervals[i][0]), max(e, intervals[i][1])
        fr.append(F(f"{intervals[i]} overlaps: grow the new interval to [{s}, {e}].", IV(allv, hl=[i, len(intervals)], result=res + [[s, e]], label="intervals + new")))
        i += 1
    res.append([s, e])
    res += intervals[i:]
    fr.append(F(f"Copy the rest. Result {res}.", IV(allv, result=res, label="intervals + new")))
    return fr


@tracer("merge-intervals")
def _(intervals):
    a, fr, res = sorted(intervals), [], []
    for k, (s, e) in enumerate(a):
        if res and s <= res[-1][1]:
            res[-1][1] = max(res[-1][1], e)
            fr.append(F(f"[{s},{e}] overlaps the last merged interval: extend it to {res[-1]}.", IV(a, hl=[k], result=res)))
        else:
            res.append([s, e])
            fr.append(F(f"[{s},{e}] starts after the last merged end: start a new interval.", IV(a, hl=[k], result=res)))
    return fr


@tracer("non-overlapping-intervals")
def _(intervals):
    a, fr, end, removed = sorted(intervals, key=lambda x: x[1]), [], float("-inf"), 0
    fr.append(F("Sort by end time: keeping the earliest-ending interval leaves the most room.", IV(a, label="sorted by end")))
    kept = []
    for k, (s, e) in enumerate(a):
        if s >= end:
            end = e; kept.append([s, e])
            fr.append(F(f"Keep [{s},{e}]; the next interval must start at or after {e}.", IV(a, hl=[k], result=kept), removed=removed))
        else:
            removed += 1
            fr.append(F(f"[{s},{e}] starts before {end}: remove it.", IV(a, hl=[k], result=kept), removed=removed))
    return fr


@tracer("meeting-rooms")
def _(intervals):
    a, fr = sorted(intervals), []
    fr.append(F("Sort by start time.", IV(a)))
    for k in range(1, len(a)):
        if a[k][0] < a[k - 1][1]:
            fr.append(F(f"{a[k]} starts before {a[k-1]} ends: conflict. False.", IV(a, hl=[k - 1, k])))
            return fr
        fr.append(F(f"{a[k]} starts after {a[k-1]} ends: fine.", IV(a, hl=[k])))
    fr.append(F("No overlaps. True.", IV(a)))
    return fr


@tracer("meeting-rooms-ii")
def _(intervals):
    a, heap, fr, best = sorted(intervals), [], [], 0
    for k, (s, e) in enumerate(a):
        if heap and heap[0] <= s:
            freed = heapq.heappop(heap)
            note = f"Room freed at {freed} is reused for [{s},{e}]."
        else:
            note = f"No room free at {s}: open a new one for [{s},{e}]."
        heapq.heappush(heap, e)
        best = max(best, len(heap))
        fr.append(F(note, IV(a, hl=[k]), S(sorted(heap), "end times (min-heap)", hl=[0]), rooms=best))
    return fr


# ---------- linked lists ----------
@tracer("reverse-linked-list")
def _(values):
    fr, done = [], []
    rest = values[:]
    while rest:
        node = rest.pop(0)
        done.insert(0, node)
        fr.append(F(f"Point {node}.next at the reversed part {done[1:] or 'None'}; prev = {node}.", L(done, hl=[0], ptr={"prev": 0}, label="reversed (prev)"), L(rest, ptr={"curr": 0} if rest else None, label="remaining (curr)")))
    return fr


@tracer("linked-list-cycle")
def _(values, pos):
    n, fr = len(values), []
    if pos < 0:
        return [F("No tail link back: fast reaches None. False.", L(values))]
    nxt = lambda i: i + 1 if i + 1 < n else pos
    s = f = 0
    while True:
        s, f = nxt(s), nxt(nxt(f))
        fr.append(F(f"slow moves 1 to {values[s]}, fast moves 2 to {values[f]}.", L(values, hl=[s, f], ptr={"slow": s, "fast": f}, cycle=pos)))
        if s == f:
            fr.append(F("slow meets fast inside the loop: a cycle exists.", L(values, hl=[s], ptr={"meet": s}, cycle=pos)))
            return fr


@tracer("merge-two-sorted-lists")
def _(a, b):
    i = j = 0
    out, fr = [], []
    while i < len(a) and j < len(b):
        take_a = a[i] <= b[j]
        out.append(a[i] if take_a else b[j])
        fr.append(F(f"Compare {a[i]} and {b[j]}: link the smaller ({out[-1]}).", L(a, hl=[i] if take_a else [], ptr={"a": i}, label="list a"), L(b, hl=[] if take_a else [j], ptr={"b": j}, label="list b"), L(out, hl=[len(out) - 1], label="merged")))
        if take_a:
            i += 1
        else:
            j += 1
    out += a[i:] + b[j:]
    fr.append(F("One list ran out: attach the remainder.", L(out, label="merged")))
    return fr


@tracer("merge-k-sorted-lists")
def _(lists):
    h = [(l[0], k, 0) for k, l in enumerate(lists) if l]
    heapq.heapify(h)
    out, fr = [], []
    while h:
        v, k, i = heapq.heappop(h)
        out.append(v)
        if i + 1 < len(lists[k]):
            heapq.heappush(h, (lists[k][i + 1], k, i + 1))
        fr.append(F(f"Pop {v} (list {k}) from the heap; push list {k}'s next value.", S([f"{x[0]} (list {x[1]})" for x in sorted(h)], "min-heap of list heads", hl=[0]), L(out, hl=[len(out) - 1], label="merged")))
    return fr


@tracer("remove-nth-node-from-end")
def _(values, n):
    fr, vals = [], ["dummy"] + values
    fast = slow = 0
    for _ in range(n + 1):
        fast += 1
    fr.append(F(f"Move fast {n + 1} steps ahead of slow (both start at a dummy head).", L(vals, ptr={"slow": slow, "fast": min(fast, len(vals) - 1)})))
    while fast < len(vals):
        fast += 1; slow += 1
        fr.append(F("Move both one step; the gap stays n + 1.", L(vals, ptr={"slow": slow, "fast": min(fast, len(vals) - 1)}, hl=[slow])))
    fr.append(F(f"fast fell off the end, so slow sits just before the target ({vals[slow + 1]}). Skip it.", L(vals, hl=[slow + 1], ptr={"slow": slow}), L(vals[1:slow + 1] + vals[slow + 2:], label="result")))
    return fr


@tracer("reorder-list")
def _(values):
    n, fr = len(values), []
    mid = (n + 1) // 2
    first, second = values[:mid], values[mid:][::-1]
    fr.append(F("Find the middle with slow/fast pointers.", L(values, hl=[mid - 1], ptr={"mid": mid - 1})))
    fr.append(F("Reverse the second half.", L(first, label="first half"), L(second, label="second half reversed")))
    out = []
    for i in range(len(first)):
        out.append(first[i])
        if i < len(second):
            out.append(second[i])
        fr.append(F("Weave: one node from the front, one from the back.", L(out, hl=[len(out) - 1], label="reordered")))
    return fr


# ---------- matrices ----------
@tracer("set-matrix-zeroes")
def _(matrix):
    m, n, fr = len(matrix), len(matrix[0]), []
    zr = {i for i in range(m) for j in range(n) if matrix[i][j] == 0}
    zc = {j for i in range(m) for j in range(n) if matrix[i][j] == 0}
    fr.append(F(f"Record rows {sorted(zr)} and columns {sorted(zc)} that contain a zero.", G(matrix, hl=[[i, j] for i in range(m) for j in range(n) if matrix[i][j] == 0], label="matrix")))
    out = [[0 if i in zr or j in zc else matrix[i][j] for j in range(n)] for i in range(m)]
    fr.append(F("Zero every cell in a marked row or column.", G(out, hl=[[i, j] for i in range(m) for j in range(n) if i in zr or j in zc], label="result")))
    return fr


@tracer("spiral-matrix")
def _(matrix):
    m, n, fr = len(matrix), len(matrix[0]), []
    top, bot, left, right, order, cells = 0, m - 1, 0, n - 1, [], []
    while top <= bot and left <= right:
        seg = [(top, j) for j in range(left, right + 1)]; top += 1
        seg += [(i, right) for i in range(top, bot + 1)]; right -= 1
        if top <= bot:
            seg += [(bot, j) for j in range(right, left - 1, -1)]; bot -= 1
        if left <= right:
            seg += [(i, left) for i in range(bot, top - 1, -1)]; left += 1
        cells += seg
        order += [matrix[i][j] for i, j in seg]
        fr.append(F(f"Walk one ring: right, down, left, up. Output so far {order}.", G(matrix, hl=seg, marks=cells, label="matrix")))
    return fr


@tracer("rotate-image")
def _(matrix):
    a, n, fr = [r[:] for r in matrix], len(matrix), []
    for i in range(n):
        for j in range(i + 1, n):
            a[i][j], a[j][i] = a[j][i], a[i][j]
    fr.append(F("Transpose: swap across the main diagonal.", G(matrix, label="before"), G(a, hl=[[i, j] for i in range(n) for j in range(n) if i != j], label="transposed")))
    for r in a:
        r.reverse()
    fr.append(F("Reverse each row: a 90° clockwise rotation in place.", G(a, label="rotated")))
    return fr


@tracer("word-search")
def _(board, word):
    m, n, fr = len(board), len(board[0]), []

    def dfs(r, c, k, path):
        if k == len(word):
            return True
        if not (0 <= r < m and 0 <= c < n) or board[r][c] != word[k] or (r, c) in path:
            return False
        path.append((r, c))
        fr.append(F(f"Match '{word[k]}' at ({r},{c}); path {''.join(board[i][j] for i, j in path)}.", G(board, hl=[path[-1]], marks=path[:-1], label=f"board · word '{word}'")))
        if any(dfs(r + dr, c + dc, k + 1, path) for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            return True
        path.pop()
        fr.append(F(f"Dead end from ({r},{c}): backtrack.", G(board, marks=path, label=f"board · word '{word}'")))
        return False
    for r in range(m):
        for c in range(n):
            if dfs(r, c, 0, []):
                fr.append(F(f"Spelled '{word}'. True.", G(board, label="board")))
                return fr
    fr.append(F("No start cell spells the word. False.", G(board)))
    return fr


# ---------- sliding window / strings ----------
@tracer("longest-substring-without-repeating-characters")
def _(s):
    last, l, best, fr = {}, 0, 0, []
    for r, ch in enumerate(s):
        if ch in last and last[ch] >= l:
            l = last[ch] + 1
            note = f"'{ch}' repeats inside the window: move left past its last spot to {l}."
        else:
            note = f"'{ch}' is new to the window."
        last[ch] = r
        best = max(best, r - l + 1)
        fr.append(F(note + f" Window '{s[l:r+1]}', best {best}.", A(list(s), hl=[r], win=[l, r], ptr={"l": l, "r": r}, label="s"), best=best))
    return fr


@tracer("longest-repeating-character-replacement")
def _(s, k):
    cnt, l, top, best, fr = Counter(), 0, 0, 0, []
    for r, ch in enumerate(s):
        cnt[ch] += 1
        top = max(top, cnt[ch])
        note = f"Add '{ch}'. Window length {r - l + 1}, most common letter appears {top} times."
        if r - l + 1 - top > k:
            cnt[s[l]] -= 1; l += 1
            note += f" More than {k} replacements needed: shrink from the left."
        best = max(best, r - l + 1)
        fr.append(F(note, A(list(s), hl=[r], win=[l, r], ptr={"l": l, "r": r}, label=f"s, k = {k}"), KV(dict(cnt), "counts"), best=best))
    return fr


@tracer("minimum-window-substring")
def _(s, t):
    need, missing, l, best, fr = Counter(t), len(t), 0, (0, 0), []
    for r, ch in enumerate(s, 1):
        if need[ch] > 0:
            missing -= 1
        need[ch] -= 1
        if missing == 0:
            while need[s[l]] < 0:
                need[s[l]] += 1; l += 1
            if not best[1] or r - l < best[1] - best[0]:
                best = (l, r)
                fr.append(F(f"Window '{s[l:r]}' covers all of '{t}'. Shrink the left edge to the first needed letter. New best '{s[l:r]}'.", A(list(s), hl=list(range(l, r)), win=[l, r - 1], ptr={"l": l, "r": r - 1}, label="s"), best=s[best[0]:best[1]]))
            need[s[l]] += 1; missing += 1; l += 1
        elif r % 3 == 0:
            fr.append(F(f"Expand right to '{ch}'; still missing {missing} letters.", A(list(s), hl=[r - 1], win=[l, r - 1], ptr={"l": l, "r": r - 1}, label="s"), missing=missing))
    fr.append(F(f"Smallest covering window: '{s[best[0]:best[1]]}'.", A(list(s), hl=list(range(*best)), label="s")))
    return fr


@tracer("valid-anagram")
def _(s, t):
    c, fr = Counter(), []
    for ch in s:
        c[ch] += 1
    fr.append(F(f"Count letters of '{s}'.", KV(dict(sorted(c.items())), "counts")))
    for i, ch in enumerate(t):
        c[ch] -= 1
        if i % 2 == 1 or i == len(t) - 1:
            fr.append(F(f"Subtract '{t[:i+1]}' from the counts.", A(list(t), hl=[i], label="t"), KV(dict(sorted(c.items())), "counts", hl=[ch])))
    fr.append(F(f"All counts {'are zero: anagram' if not any(c.values()) else 'are not zero: not an anagram'}.", KV(dict(sorted(c.items())), "counts")))
    return fr


@tracer("group-anagrams")
def _(words):
    groups, fr = defaultdict(list), []
    for w in words:
        key = "".join(sorted(w))
        groups[key].append(w)
        fr.append(F(f"'{w}' sorts to '{key}': add it to that group.", A(words, hl=[words.index(w)], label="words"), KV({k: v for k, v in groups.items()}, "sorted key → group", hl=[key])))
    return fr


@tracer("valid-parentheses")
def _(s):
    pairs, st, fr = {")": "(", "]": "[", "}": "{"}, [], []
    for i, ch in enumerate(s):
        if ch in pairs:
            ok = st and st[-1] == pairs[ch]
            fr.append(F(f"'{ch}' closes: top of stack is '{st[-1] if st else 'empty'}' → {'match, pop' if ok else 'mismatch'}.", A(list(s), hl=[i], ptr={"i": i}, label="s"), S(st[::-1], "stack (top first)", hl=[0])))
            if not ok:
                return fr
            st.pop()
        else:
            st.append(ch)
            fr.append(F(f"'{ch}' opens: push it.", A(list(s), hl=[i], ptr={"i": i}, label="s"), S(st[::-1], "stack (top first)", hl=[0])))
    fr.append(F(f"End of string, stack {'empty: valid' if not st else 'not empty: invalid'}.", S(st[::-1], "stack")))
    return fr


@tracer("valid-palindrome")
def _(s):
    t = [c.lower() for c in s if c.isalnum()]
    l, r, fr = 0, len(t) - 1, []
    fr.append(F(f"Keep letters and digits, lowercase: '{''.join(t)}'.", A(t, label="cleaned")))
    while l < r:
        same = t[l] == t[r]
        if l < 4 or not same:
            fr.append(F(f"'{t[l]}' vs '{t[r]}': {'match, move inward' if same else 'mismatch, not a palindrome'}.", A(t, hl=[l, r], ptr={"l": l, "r": r}, label="cleaned")))
        if not same:
            return fr
        l += 1; r -= 1
    fr.append(F("Pointers met with every pair matching: palindrome.", A(t, label="cleaned")))
    return fr


@tracer("longest-palindromic-substring")
def _(s):
    best, fr = (0, 1), []
    for c in range(len(s)):
        for l, r in ((c, c), (c, c + 1)):
            while 0 <= l and r < len(s) and s[l] == s[r]:
                l -= 1; r += 1
            if r - l - 1 > best[1] - best[0]:
                best = (l + 1, r)
                fr.append(F(f"Expand around center {c}: '{s[l+1:r]}' is a palindrome, the longest so far.", A(list(s), hl=list(range(l + 1, r)), ptr={"center": c}, label="s"), best=s[best[0]:best[1]]))
    fr.append(F(f"Longest: '{s[best[0]:best[1]]}'.", A(list(s), hl=list(range(*best)), label="s")))
    return fr


@tracer("palindromic-substrings")
def _(s):
    count, fr = 0, []
    for c in range(len(s)):
        for l, r in ((c, c), (c, c + 1)):
            while 0 <= l and r < len(s) and s[l] == s[r]:
                count += 1
                fr.append(F(f"'{s[l:r+1]}' is a palindrome. Count = {count}.", A(list(s), hl=list(range(l, r + 1)), ptr={"center": c}, label="s"), count=count))
                l -= 1; r += 1
    return fr


@tracer("encode-and-decode-strings")
def _(words):
    enc, fr = "", []
    for w in words:
        enc += f"{len(w)}#{w}"
        fr.append(F(f"Encode '{w}' as length + '#' + text so '#' inside words is safe.", A(words, hl=[words.index(w)], label="words"), S([enc], "encoded")))
    i, out = 0, []
    while i < len(enc):
        j = enc.index("#", i)
        k = int(enc[i:j])
        out.append(enc[j + 1:j + 1 + k])
        fr.append(F(f"Read length {k} up to '#', then take exactly {k} characters: '{out[-1]}'.", S([enc], "encoded"), A(out, hl=[len(out) - 1], label="decoded")))
        i = j + 1 + k
    return fr


# ---------- trees (level-order arrays with None) ----------
def build(vals):
    """Return children map over level-order indices."""
    if not vals or vals[0] is None:
        return {}, []
    kids, q, i = {0: [None, None]}, deque([0]), 1
    while q and i < len(vals):
        p = q.popleft()
        for side in (0, 1):
            if i < len(vals):
                if vals[i] is not None:
                    kids[p][side] = i; kids[i] = [None, None]; q.append(i)
                i += 1
    return kids, [k for k in kids]


@tracer("maximum-depth-of-binary-tree")
def _(values):
    kids, _n = build(values)
    fr, depth, q, d = [], {}, deque([(0, 1)]), 0
    while q:
        u, dd = q.popleft(); d = max(d, dd)
        fr.append(F(f"Visit {values[u]} at depth {dd}.", T(values, hl=[u], done=list(depth)), max_depth=d))
        depth[u] = dd
        for k in kids[u]:
            if k is not None:
                q.append((k, dd + 1))
    fr.append(F(f"Deepest level reached: {d}.", T(values, done=list(depth))))
    return fr


@tracer("same-tree")
def _(a, b):
    fr = []
    for i in range(max(len(a), len(b))):
        x = a[i] if i < len(a) else None
        y = b[i] if i < len(b) else None
        fr.append(F(f"Compare position {i}: {x} vs {y} → {'equal' if x == y else 'different'}.", T(a, hl=[i], label="tree a"), T(b, hl=[i], label="tree b")))
        if x != y:
            return fr
    fr.append(F("Every node matches in value and shape: True.", T(a, label="tree a"), T(b, label="tree b")))
    return fr


def levels(values):
    kids, _ = build(values)
    out, q = [], deque([0]) if kids else deque()
    while q:
        lvl = list(q); out.append(lvl); q = deque()
        for u in lvl:
            for k in kids[u]:
                if k is not None:
                    q.append(k)
    return out


def to_level_list(root):
    out, q = [], deque([root])
    while q:
        n = q.popleft()
        if n is None:
            out.append(None); continue
        out.append(n[0]); q.append(n[1]); q.append(n[2])
    while out and out[-1] is None:
        out.pop()
    return out


def to_nodes(values):
    kids, _ = build(values)
    def mk(i):
        if i is None:
            return None
        return [values[i], mk(kids[i][0]), mk(kids[i][1])]
    return mk(0) if kids else None


@tracer("invert-binary-tree")
def _(values):
    root, fr = to_nodes(values), []
    fr.append(F("Original tree.", T(values)))
    q = deque([root])
    while q:
        n = q.popleft()
        if n is None:
            continue
        n[1], n[2] = n[2], n[1]
        cur = to_level_list(root)
        fr.append(F(f"Swap the children of {n[0]}.", T(cur, hl=[cur.index(n[0])])))
        q.append(n[1]); q.append(n[2])
    return fr


@tracer("binary-tree-maximum-path-sum")
def _(values):
    kids, _ = build(values)
    fr, best = [], [float("-inf")]

    def gain(u):
        if u is None:
            return 0
        l, r = max(gain(kids[u][0]), 0), max(gain(kids[u][1]), 0)
        through = values[u] + l + r
        best[0] = max(best[0], through)
        fr.append(F(f"At {values[u]}: left gain {l}, right gain {r}. Path through it = {through}; best {best[0]}. Return {values[u] + max(l, r)} upward.", T(values, hl=[u]), best=best[0]))
        return values[u] + max(l, r)
    gain(0)
    return fr


@tracer("binary-tree-level-order-traversal")
def _(values):
    fr, out = [], []
    for lvl in levels(values):
        out.append([values[i] for i in lvl])
        fr.append(F(f"Drain the queue for this level: {out[-1]}; enqueue their children.", T(values, hl=lvl), S([json.dumps(x) for x in out], "levels so far")))
    return fr


@tracer("serialize-and-deserialize-binary-tree")
def _(values):
    fr = []
    tokens = ["#" if v is None else str(v) for v in values]
    fr.append(F("Serialize breadth-first; '#' marks a missing child.", T(values), S([",".join(tokens)], "serialized")))
    for i in range(1, len(values) + 1):
        if i in (1, 3, len(values)):
            fr.append(F(f"Deserialize: read tokens left to right, attaching children to queued parents ({i} tokens read).", A(tokens, hl=[i - 1], label="tokens"), T(values[:i])))
    return fr


@tracer("subtree-of-another-tree")
def _(values, sub):
    root = to_nodes(values); s = to_nodes(sub); fr = []

    def same(a, b):
        if a is None or b is None:
            return a is b
        return a[0] == b[0] and same(a[1], b[1]) and same(a[2], b[2])
    q = deque([root])
    while q:
        n = q.popleft()
        if n is None:
            continue
        ok = same(n, s)
        fr.append(F(f"Does the subtree rooted at {n[0]} equal the pattern? {'Yes: True.' if ok else 'No.'}", T(values, hl=[values.index(n[0])], label="tree"), T(sub, label="pattern")))
        if ok:
            return fr
        q.append(n[1]); q.append(n[2])
    return fr


@tracer("construct-binary-tree-from-traversals")
def _(pre, ino):
    fr, pos = [], {v: i for i, v in enumerate(ino)}
    idx = [0]
    root = None

    def go(lo, hi):
        if lo > hi:
            return None
        v = pre[idx[0]]; idx[0] += 1
        m = pos[v]
        fr.append(F(f"Next preorder value {v} is the root of inorder[{lo}..{hi}]; left of it ({ino[lo:m]}) is its left subtree, right ({ino[m+1:hi+1]}) its right.", A(pre, hl=[idx[0] - 1], label="preorder"), A(ino, hl=[m], win=[lo, hi], label="inorder")))
        return [v, go(lo, m - 1), go(m + 1, hi)]
    root = go(0, len(ino) - 1)
    fr.append(F("Rebuilt tree.", T(to_level_list(root))))
    return fr


@tracer("validate-binary-search-tree")
def _(values):
    kids, _ = build(values); fr = []

    def ok2(u, lo, hi):
        if u is None:
            return True
        good = lo < values[u] < hi
        fr.append(F(f"{values[u]} must lie in ({'-∞' if lo == float('-inf') else lo}, {'∞' if hi == float('inf') else hi}): {'yes' if good else 'no'}.", T(values, hl=[u])))
        return good and ok2(kids[u][0], lo, values[u]) and ok2(kids[u][1], values[u], hi)
    res = ok2(0, float("-inf"), float("inf"))
    fr.append(F(f"Every node respected its bounds: {res}.", T(values)))
    return fr


@tracer("kth-smallest-element-in-a-bst")
def _(values, k):
    kids, _ = build(values); fr, st, u, seen = [], [], 0, []
    while st or u is not None:
        while u is not None:
            st.append(u); u = kids[u][0]
        u = st.pop(); seen.append(u)
        fr.append(F(f"In-order visit #{len(seen)}: {values[u]}.", T(values, hl=[u], done=seen[:-1]), S([values[x] for x in st][::-1], "stack")))
        if len(seen) == k:
            fr.append(F(f"That's the {k}th smallest: {values[u]}.", T(values, hl=[u])))
            return fr
        u = kids[u][1]
    return fr


@tracer("lowest-common-ancestor-of-a-bst")
def _(values, p, q):
    kids, _ = build(values); fr, u = [], 0
    fr.append(F(f"Start at the root. In a BST, smaller values live left and larger values live right, so compare {p} and {q} with each node.", T(values, hl=[0])))
    while u is not None:
        v = values[u]
        if p < v and q < v:
            fr.append(F(f"{p} and {q} are both smaller than {v}: go left.", T(values, hl=[u]))); u = kids[u][0]
        elif p > v and q > v:
            fr.append(F(f"{p} and {q} are both larger than {v}: go right.", T(values, hl=[u]))); u = kids[u][1]
        else:
            fr.append(F(f"{p} and {q} split at {v} (or one equals it): the LCA is {v}.", T(values, hl=[u])))
            return fr
    return fr


# ---------- tries ----------
def trie_panel(words, label="trie (words stored)"):
    return S(sorted(words), label)


@tracer("implement-trie")
def _(ops):
    words, fr = set(), []
    for op, w in ops:
        if op == "insert":
            words.add(w); res = None
            note = f"insert('{w}'): walk/create one node per letter and mark the last node as a word end."
        elif op == "search":
            res = w in words
            note = f"search('{w}'): walk the letters; {'the end node is marked' if res else 'the end node exists but is not a word end' if any(x.startswith(w) for x in words) else 'a letter is missing'} → {res}."
        else:
            res = any(x.startswith(w) for x in words)
            note = f"startsWith('{w}'): only the path must exist → {res}."
        fr.append(F(note, A(list(w), label="letters walked"), trie_panel(words), result=res))
    return fr


@tracer("add-and-search-word")
def _(ops):
    import re
    words, fr = set(), []
    for op, w in ops:
        if op == "add":
            words.add(w)
            fr.append(F(f"add('{w}').", trie_panel(words)))
        else:
            res = any(re.fullmatch(w, x) for x in words)
            fr.append(F(f"search('{w}'): '.' branches into every child at that depth → {res}.", A(list(w), hl=[i for i, c in enumerate(w) if c == "."], label="pattern ('.' = any)"), trie_panel(words), result=res))
    return fr


@tracer("word-search-ii")
def _(board, words):
    m, n, fr, found = len(board), len(board[0]), [], []
    prefixes = {w[:i] for w in words for i in range(1, len(w) + 1)}

    def dfs(r, c, path, s):
        if not (0 <= r < m and 0 <= c < n) or (r, c) in path:
            return
        s2 = s + board[r][c]
        if s2 not in prefixes:
            return
        path = path + [(r, c)]
        if s2 in words and s2 not in found:
            found.append(s2)
            fr.append(F(f"Path spells '{s2}', a word in the trie. Record it.", G(board, hl=path, label="board"), S(found, "found")))
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            dfs(r + dr, c + dc, path, s2)
    fr.append(F(f"Build a trie of {words}; prune any path that isn't a prefix.", G(board, label="board"), trie_panel(words, "trie words")))
    for r in range(m):
        for c in range(n):
            dfs(r, c, [], "")
    fr.append(F(f"Found {sorted(found)}.", S(sorted(found), "found")))
    return fr


# ---------- heaps ----------
@tracer("top-k-frequent-elements")
def _(nums, k):
    c, fr = Counter(nums), []
    fr.append(F("Count each value.", A(nums, label="nums"), KV(dict(c), "counts")))
    buckets = defaultdict(list)
    for v, f in c.items():
        buckets[f].append(v)
    fr.append(F("Bucket values by frequency (index = count).", KV({f: buckets[f] for f in sorted(buckets, reverse=True)}, "frequency → values")))
    out = []
    for f in sorted(buckets, reverse=True):
        for v in buckets[f]:
            if len(out) < k:
                out.append(v)
                fr.append(F(f"Take {v} (seen {f} times).", A(out, hl=[len(out) - 1], label=f"top {k}")))
    return fr


@tracer("find-median-from-data-stream")
def _(nums):
    lo, hi, fr = [], [], []
    for v in nums:
        heapq.heappush(lo, -v)
        heapq.heappush(hi, -heapq.heappop(lo))
        if len(hi) > len(lo):
            heapq.heappush(lo, -heapq.heappop(hi))
        med = -lo[0] if len(lo) > len(hi) else (-lo[0] + hi[0]) / 2
        fr.append(F(f"Add {v}; rebalance so the low half (max-heap) has the same size or one more. Median = {med}.", S(sorted([-x for x in lo], reverse=True), "low half (max on top)", hl=[0]), S(sorted(hi), "high half (min on top)", hl=[0]), median=med))
    return fr


def main():
    missing = []
    for lesson in lessons:
        if lesson["track"] != "python":
            continue
        fn = TRACERS.get(lesson["id"])
        if not fn:
            missing.append(lesson["id"]); continue
        import copy
        frames = fn(*copy.deepcopy(lesson["tests"][0]["input"]))
        frames = frames[:16]
        assert len(frames) >= 2, (lesson["id"], len(frames))
        json.dumps(frames, allow_nan=False)
        lesson["trace"] = frames
    assert not missing, missing
    path.write_text(json.dumps(lessons, indent=2, ensure_ascii=False) + "\n")
    print(f"Traced {sum(1 for l in lessons if 'trace' in l)} lessons.")


if __name__ == "__main__":
    main()
