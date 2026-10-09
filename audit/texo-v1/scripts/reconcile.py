#!/usr/bin/env python3
"""Texo V1 backlog reconciler (deterministic).

Reads  audit/texo-v1/tickets/*.json            (363 draft tickets, never modified)
       audit/texo-v1/reviews/reconcile-rules.json (authored reconciliation rules)
Writes audit/texo-v1/backlog/<epic>.json, _index.json, epics.json, RECONCILIATION.md

Precedence encoded in the rules: DECISIONS.md > R1 ownership (ADR-R4) > R2 mechanics.
Run:   python3 audit/texo-v1/scripts/reconcile.py
Exit code 1 if the validator finds any violation.
"""
import copy
import fnmatch
import glob
import hashlib
import heapq
import json
import os
import re
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)  # audit/texo-v1
TICKETS_DIR = os.path.join(ROOT, "tickets")
RULES_PATH = os.path.join(ROOT, "reviews", "reconcile-rules.json")
OUT_DIR = os.path.join(ROOT, "backlog")

STR_FIELDS = ["title", "problem", "value"]
LIST_FIELDS = ["scope", "outOfScope", "acceptance", "validation", "evidence", "risks", "dod", "filesTouched"]
REQUIRED_NONEMPTY = ["scope", "outOfScope", "acceptance", "validation", "evidence", "risks", "dod", "filesTouched"]
REQUIRED = ["id", "epic", "type", "title", "priority", "labels", "problem", "value", "scope", "outOfScope",
            "acceptance", "dependencies", "validation", "evidence", "risks", "dod", "filesTouched", "size", "semver"]
EPICS = ["E%d" % i for i in range(1, 19)]
ID_RE = re.compile(r"^E(\d+)-(\d+)$")
EXT_RE = re.compile(r"^PLRNUI-\d+$")
PREFIX_RE = re.compile(r"^\(from (E\d+-\d+)\) ")
LOG = []


def log(msg):
    LOG.append(msg)


def idkey(i):
    m = ID_RE.match(i)
    return (int(m.group(1)), int(m.group(2))) if m else (999, 999)


def norm_item(s):
    return re.sub(r"\s+", " ", PREFIX_RE.sub("", s)).strip().lower()


def dedupe(items):
    seen, out = set(), []
    for x in items:
        k = norm_item(x)
        if k not in seen:
            seen.add(k)
            out.append(x)
    return out


def uniq(seq):
    seen, out = set(), []
    for x in seq:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out


# ---------------------------------------------------------------- load
def load():
    files = sorted(glob.glob(os.path.join(TICKETS_DIR, "*.json")),
                   key=lambda p: int(re.search(r"E(\d+)\.json$", p).group(1)))
    tickets = []
    for f in files:
        with open(f) as fh:
            tickets.extend(json.load(fh))
    with open(RULES_PATH) as fh:
        rules = json.load(fh)
    return tickets, rules


# ---------------------------------------------------------------- text ops
def selects(rule, t):
    if rule.get("all"):
        return True
    if t["id"] in rule.get("ids", []):
        return True
    return t["id"].split("-")[0] in rule.get("epics", [])


def apply_replace(s, rule):
    if rule.get("regex"):
        return re.sub(rule["find"], rule["replace"], s)
    return s.replace(rule["find"], rule["replace"])


def text_replace(T, rules):
    n = 0
    for rule in rules["textReplace"]:
        for t in T.values():
            if not selects(rule, t):
                continue
            for f in STR_FIELDS:
                new = apply_replace(t[f], rule)
                if new != t[f]:
                    t[f] = new
                    n += 1
            for f in LIST_FIELDS:
                new = [apply_replace(x, rule) for x in t[f]]
                if new != t[f]:
                    t[f] = new
                    n += 1
    return n


def comp_files(spec, rules):
    names = rules["existingComponents"] if spec["names"] == "existing" else spec["names"]
    return [spec["template"].replace("{N}", n) for n in names]


def remove_re(items, pats):
    return [x for x in items if not any(re.search(p, x) for p in pats)]


def apply_rescope(t, r, rules):
    for f in ("title", "problem", "value", "size", "semver", "priority", "epic"):
        if f in r:
            t[f] = r[f]
    for f in ("scope", "acceptance", "outOfScope", "risks", "dod", "validation", "evidence"):
        if f in r:
            t[f] = list(r[f])
        if f + "Remove" in r:
            t[f] = remove_re(t[f], r[f + "Remove"])
        if f + "Add" in r:
            t[f] = t[f] + r[f + "Add"]
    if "filesTouched" in r:
        t["filesTouched"] = list(r["filesTouched"])
    if "filesFromComponents" in r:
        t["filesTouched"] = t["filesTouched"] + comp_files(r["filesFromComponents"], rules)
    if "filesRemove" in r:
        t["filesTouched"] = [x for x in t["filesTouched"] if x not in r["filesRemove"]]
    if "filesAdd" in r:
        t["filesTouched"] = t["filesTouched"] + r["filesAdd"]
    if "labelsAdd" in r:
        t["labels"] = t["labels"] + r["labelsAdd"]
    if "labelsRemove" in r:
        t["labels"] = [x for x in t["labels"] if x not in r["labelsRemove"]]


# ---------------------------------------------------------------- merges
def merge_targets(m):
    return m["into"] if isinstance(m["into"], list) else [m["into"]]


def build_canon(rules):
    single = {}
    multi = {}
    for m in rules["merges"]:
        tg = merge_targets(m)
        if len(tg) == 1:
            single[m["id"]] = tg[0]
        else:
            multi[m["id"]] = tg
    return single, multi


def resolve(i, single):
    seen = set()
    while i in single:
        if i in seen:
            raise SystemExit("merge cycle at " + i)
        seen.add(i)
        i = single[i]
    return i


def prefixed(src_id, item):
    return item if PREFIX_RE.match(item) else "(from %s) %s" % (src_id, item)


def do_merges(T, rules, single, multi):
    removed = {}
    merged_deps = defaultdict(list)
    for m in rules["merges"]:
        src = T[m["id"]]
        content = m.get("content", "all")
        targets = [resolve(x, single) for x in merge_targets(m)]
        for raw, tid in zip(merge_targets(m), targets):
            tgt = T[tid]
            if content == "all":
                ex = m.get("excludeRe", [])
                for f in ("scope", "acceptance", "risks"):
                    add = [prefixed(src["id"], x) for x in remove_re(src[f], ex)]
                    tgt[f] = dedupe(tgt[f] + add)
                oos = [x for x in src["outOfScope"] if not re.search(r"Renaming|Changes to files owned", x)]
                tgt["outOfScope"] = dedupe(tgt["outOfScope"] + oos)
            elif content == "route":
                rt = m["route"].get(raw, {"scope": [], "acceptance": []})
                for f in ("scope", "acceptance"):
                    tgt[f] = dedupe(tgt[f] + [prefixed(src["id"], x) for x in rt.get(f, [])])
            if m.get("files", "union") == "union":
                exf = m.get("excludeFilesRe", [])
                tgt["filesTouched"] = uniq(tgt["filesTouched"] + remove_re(src["filesTouched"], exf))
            if m.get("deps", "union") == "union":
                merged_deps[tid].extend(src["dependencies"])
            tgt["labels"] = uniq(tgt["labels"] + [l for l in src["labels"] if l not in ("blocked-decision",)])
        removed[m["id"]] = {"id": m["id"], "title": src["title"], "kind": m.get("kind", "merge"),
                            "into": targets, "source": m.get("source", ""), "reason": m.get("reason", "")}
        del T[m["id"]]
    return removed, merged_deps


# ---------------------------------------------------------------- splits
def do_splits(T, rules, defaults):
    split_map = {}
    for pid, sp in rules["splits"].items():
        parent = T[pid]
        children = []
        route = sp.get("absorbedRoute", {})
        child_ids = [c["id"] for c in sp["children"]]
        for idx, c in enumerate(sp["children"]):
            ch = copy.deepcopy(parent) if idx == 0 else copy.deepcopy(parent)
            ch["id"] = c["id"]
            for f in ("title", "problem", "value", "size", "priority", "semver"):
                if f in c:
                    ch[f] = c[f]
            for f in ("scope", "acceptance"):
                absorbed = []
                for x in parent[f]:
                    m = PREFIX_RE.match(x)
                    if m:
                        dest = route.get(m.group(1), child_ids[0])
                        if dest == c["id"]:
                            absorbed.append(x)
                ch[f] = dedupe(list(c.get(f, parent[f] if idx == 0 else [])) + absorbed)
            for f in ("outOfScope", "risks", "dod", "validation", "evidence"):
                if f in c:
                    ch[f] = list(c[f])
            files = list(c.get("filesTouched", parent["filesTouched"]))
            if c.get("inheritFiles"):
                files = uniq(files + parent["filesTouched"])
            ch["filesTouched"] = files
            ch["dependencies"] = (list(parent["dependencies"]) if idx == 0 else [child_ids[0]]) + c.get("depsAdd", [])
            if idx == 0:
                ch["splitInto"] = child_ids[1:]
            else:
                ch["splitFrom"] = pid
                ch["origin"] = "split"
                ch["absorbs"] = []
            children.append(ch)
        del T[pid]
        for ch in children:
            T[ch["id"]] = ch
        split_map[pid] = child_ids
    return split_map


# ---------------------------------------------------------------- deps
class Remapper:
    def __init__(self, single, multi, split_map, ids):
        self.single, self.multi, self.split, self.ids = single, multi, split_map, ids

    def targets(self, d, subject=None):
        """dependency target id -> list of canonical ids.
        Multi-target merges map dependents to their primary (first) target; split parents map
        dependents to every child, except inside the split group itself (children depend on child 1)."""
        if EXT_RE.match(d):
            return [d]
        if d in self.multi:
            return self.targets(self.multi[d][0], subject)
        r = resolve(d, self.single)
        if r in self.split:
            group = self.split[r]
            if subject in group:
                return [r] if subject != r else []
            return list(group)
        return [r]

    def subject(self, i):
        """rule subject id -> list of canonical ids (split parent keeps its id = first child)"""
        if i in self.multi:
            return uniq([resolve(x, self.single) for x in self.multi[i]])
        return [resolve(i, self.single)]


def ui_dirs(t):
    out = []
    for f in t["filesTouched"]:
        m = re.match(r"^src/components/([A-Za-z0-9]+)((?:/[A-Za-z0-9]+)*)/\*\*$", f)
        if m:
            out.append((m.group(1), m.group(2).strip("/")))
    return out


def is_component(t, rules):
    cd = rules["componentDeps"]
    if t["id"] in cd["exempt"]:
        return False
    return bool(ui_dirs(t)) or t["id"] in cd["extra"]


def kebab(n):
    return re.sub(r"(?<!^)(?=[A-Z])", "-", n).lower()


def docs_area(t):
    ep = t["epic"]
    if ep == "E5":
        return "form"
    if ep == "E7":
        return "data-display"
    if ep == "E6":
        for l in ("overlay", "feedback", "navigation"):
            if any(l in x for x in t["labels"]):
                return l
        return "patterns"
    if ep == "E4":
        return "layout"
    return "misc"


# ---------------------------------------------------------------- files / collisions
def expand(p):
    p = re.sub(r"\s*\(.*\)\s*$", "", p).strip()
    m = re.search(r"\{([^{}]*)\}", p)
    if not m:
        return [p]
    out = []
    for alt in m.group(1).split(","):
        out.extend(expand(p[:m.start()] + alt + p[m.end():]))
    return out


def has_wild(p):
    return any(c in p for c in "*?[")


def lit_prefix(p):
    m = re.search(r"[*?\[]", p)
    return p[:m.start()] if m else p


def pmatch(pat, path):
    if pat.endswith("/**"):
        base = pat[:-3]
        return path == base or path.startswith(base + "/")
    return fnmatch.fnmatchcase(path, pat)


def overlap(a, b):
    if a == b:
        return True
    wa, wb = has_wild(a), has_wild(b)
    if not wa and not wb:
        return False
    if wa and not wb:
        return pmatch(a, b)
    if wb and not wa:
        return pmatch(b, a)
    pa, pb = lit_prefix(a), lit_prefix(b)
    return pa.startswith(pb) or pb.startswith(pa)


def file_sets(T):
    return {i: uniq([x for f in t["filesTouched"] for x in expand(f)]) for i, t in T.items()}


def shared(fa, fb):
    out = []
    for a in fa:
        for b in fb:
            if overlap(a, b):
                out.append(a if a == b else "%s ~ %s" % (a, b))
    return out


# ---------------------------------------------------------------- graph
def topo(T, key):
    indeg = {i: 0 for i in T}
    rev = defaultdict(list)
    for i, t in T.items():
        for d in t["dependencies"]:
            if d in T:
                indeg[i] += 1
                rev[d].append(i)
    heap = [(key(i), i) for i in T if indeg[i] == 0]
    heapq.heapify(heap)
    order = []
    while heap:
        _, i = heapq.heappop(heap)
        order.append(i)
        for j in rev[i]:
            indeg[j] -= 1
            if indeg[j] == 0:
                heapq.heappush(heap, (key(j), j))
    return order


def find_cycle(T):
    color, stack = {}, []

    def dfs(u):
        color[u] = 1
        stack.append(u)
        for v in T[u]["dependencies"]:
            if v not in T:
                continue
            if color.get(v) == 1:
                return stack[stack.index(v):] + [v]
            if color.get(v) is None:
                r = dfs(v)
                if r:
                    return r
        stack.pop()
        color[u] = 2
        return None

    sys.setrecursionlimit(10000)
    for u in sorted(T, key=idkey):
        if color.get(u) is None:
            r = dfs(u)
            if r:
                return r
    return None


def ancestors(T, order):
    pos = {i: k for k, i in enumerate(order)}
    anc = {}
    for i in order:
        a = 0
        for d in T[i]["dependencies"]:
            if d in pos:
                a |= anc[d] | (1 << pos[d])
        anc[i] = a
    return anc, pos


def waves(T, order):
    w = {}
    for i in order:
        ds = [w[d] for d in T[i]["dependencies"] if d in w]
        w[i] = (max(ds) + 1) if ds else 0
    return w


# ---------------------------------------------------------------- vague AC heuristic
VAGUE_WORDS = re.compile(r"\b(correctly|cleanly|properly|good|clean|nicely|appropriately|reasonable|works)\b", re.I)
CUE = re.compile(r"(test|grep|exit|npm |npx |node |tsc|returns|prints|lists|contains|exists|equal|assert|pass|fail|"
                 r"ls |find |git |snapshot|type|log|file|render|has |shows|spy|mock|\.md|\.ts|\.json|\.mjs|count|"
                 r"defined|matches|called|validat|check|>=|<=|attached|link)", re.I)


def vague(ac):
    if VAGUE_WORDS.search(ac):
        return "vague word"
    if not CUE.search(ac) and len(ac.split()) < 8:
        return "no verification cue"
    return None


# ---------------------------------------------------------------- main
def main():
    tickets, rules = load()
    before = {"tickets": len(tickets), "size": Counter(t["size"] for t in tickets),
              "perEpic": Counter(t["epic"] for t in tickets)}
    if len(tickets) != rules["expectedInputCount"]:
        raise SystemExit("expected %d tickets, got %d" % (rules["expectedInputCount"], len(tickets)))
    T = {t["id"]: copy.deepcopy(t) for t in tickets}
    original_ids = set(T)
    original_deps = {t["id"]: list(t["dependencies"]) for t in tickets}
    for t in T.values():
        t["origin"] = "original"
        t["absorbs"] = []

    # 1. acceptance rewrites (exact match required)
    n_rw = 0
    for tid, mp in rules["acRewrites"].items():
        for old, new in mp.items():
            acs = T[tid]["acceptance"]
            if old not in acs:
                raise SystemExit("AC rewrite: text not found in %s: %s" % (tid, old))
            T[tid]["acceptance"] = [new if a == old else a for a in acs]
            n_rw += 1

    # 2. text replacements, 3. rescopes (pre-merge)
    n_tr = text_replace(T, rules)
    rescope_deps_add, rescope_deps_rm = {}, {}
    for tid, r in rules["rescope"].items():
        if tid not in T:
            raise SystemExit("rescope of unknown ticket " + tid)
        apply_rescope(T[tid], r, rules)
        rescope_deps_add[tid] = r.get("depsAdd", [])
        rescope_deps_rm[tid] = r.get("depsRemove", [])

    # 4. new tickets (created before merges so wiring tickets can absorb E4-22/E5-29)
    defaults = rules["newTicketDefaults"]
    for nt in rules["newTickets"]:
        t = {k: copy.deepcopy(v) for k, v in defaults.items()}
        t.update(copy.deepcopy(nt))
        if "filesFromComponents" in t:
            t["filesTouched"] = t["filesTouched"] + comp_files(t.pop("filesFromComponents"), rules)
        t.setdefault("labels", [])
        t["origin"] = "new"
        t["absorbs"] = []
        if t["id"] in T:
            raise SystemExit("new ticket id collides: " + t["id"])
        T[t["id"]] = t

    # 5. merges / drops
    single, multi = build_canon(rules)
    removed, merged_deps = do_merges(T, rules, single, multi)

    # 6. splits
    split_map = do_splits(T, rules, defaults)
    remap = Remapper(single, multi, split_map, set(T))

    # absorbs (transitive)
    for rid, info in removed.items():
        for tgt in info["into"]:
            for c in remap.targets(tgt)[:1]:
                T[c]["absorbs"].append(rid)
    changed = True
    while changed:
        changed = False
        for t in T.values():
            extra = []
            for a in t["absorbs"]:
                for rid, info in removed.items():
                    if a in info["into"] and rid not in t["absorbs"] and rid not in extra:
                        extra.append(rid)
            if extra:
                t["absorbs"].extend(extra)
                changed = True
    for t in T.values():
        t["absorbs"] = sorted(uniq(t["absorbs"]), key=idkey)

    # 7. post-1.0 and decision blocks
    post = set()
    for i in rules["postV1"]:
        for c in remap.targets(i):
            post.add(c)
    needs = defaultdict(list)
    for h, d in rules["decisions"].items():
        for i in d["ids"]:
            for c in remap.subject(i):
                needs[c].append(h)
    for i, t in T.items():
        t["postV1"] = i in post
        t["decisionsNeeded"] = sorted(uniq(needs.get(i, [])), key=lambda h: int(h[1:]))
        t["blocked"] = bool(t["decisionsNeeded"])

    # 8. UI obligations (ADR-R7 meta in DoD, tests/docs paths, conventions AC)
    existing_docs = {}
    for ot in tickets:
        for f in ot["filesTouched"]:
            m = re.match(r"^docs/components/([a-z-]+)/([A-Za-z-]+)\.md$", f)
            if m:
                existing_docs.setdefault(m.group(2).lower(), f)
    ob = rules["uiObligation"]
    ui_ids = []
    for i in sorted(T, key=idkey):
        t = T[i]
        if not is_component(t, rules):
            continue
        ui_ids.append(i)
        dirs = ui_dirs(t)
        ns = set(rules.get("componentNamespaces", []))
        dirs = [(n + "/" + s.split("/")[0], "/".join(s.split("/")[1:])) if n in ns and s else (n, s) for n, s in dirs]
        if dirs:
            names = uniq([d[0].split("/")[-1] for d in dirs])
            metas = uniq(["src/components/%s%s/%s.meta.ts" % (n, ("/" + s) if s else "",
                                                              (s.split("/")[-1] if s else n.split("/")[-1]))
                          for n, s in dirs])
        else:
            tsx = [f for f in t["filesTouched"] if f.endswith(".tsx") and f.startswith("src/")]
            names = uniq([os.path.splitext(os.path.basename(f))[0] for f in tsx])
            metas = uniq([os.path.splitext(f)[0] + ".meta.ts" for f in tsx])
        fmt = {"names": ", ".join(names), "metaPaths": ", ".join(metas)}
        t["dod"] = dedupe(t["dod"] + [x.format(**fmt) for x in ob["dod"]])
        t["acceptance"] = dedupe(t["acceptance"] + [x.format(**fmt) for x in ob["acceptance"]])
        if dirs:
            if not any(f.startswith("tests/") for f in t["filesTouched"]):
                for n, s in dirs:
                    suffix = ("." + s.replace("/", ".")) if s else ""
                    n = n.split("/")[-1]
                    base = kebab(n) if n in rules["existingComponents"] else n
                    t["filesTouched"].append("tests/components/%s%s.test.tsx" % (base, suffix))
            if not any(f.startswith("docs/") for f in t["filesTouched"]):
                for n in names:
                    k = kebab(n)
                    t["filesTouched"].append(existing_docs.get(k) or existing_docs.get(n.lower())
                                             or "docs/components/%s/%s.md" % (docs_area(t), n))
        t["filesTouched"] = uniq(t["filesTouched"])

    # 9. dependency assembly
    edges = defaultdict(list)       # subject -> [(dep, source)]

    def add(subj_raw, dep_raw, source):
        for s in remap.subject(subj_raw):
            if s not in T:
                continue
            for d in remap.targets(dep_raw, s):
                if d != s:
                    edges[s].append((d, source))

    for i, t in T.items():
        for d in t["dependencies"]:
            for dd in remap.targets(d, i):
                if dd != i:
                    edges[i].append((dd, "original"))
    for tid, ds in merged_deps.items():
        for d in ds:
            add(tid, d, "absorbed")
    for tid, ds in rescope_deps_add.items():
        for d in ds:
            add(tid, d, "rescope")
    skip = {(a, b) for a, b, _ in rules["skipR2AddDeps"]}
    n_r2 = n_r2_skip = 0
    for a in rules["r2AddDeps"]:
        for d in a["dependsOn"]:
            if (a["id"], d) in skip:
                n_r2_skip += 1
                continue
            add(a["id"], d, "R2-addDeps")
            n_r2 += 1
    for a in rules["addDeps"]:
        for d in a["dependsOn"]:
            add(a["id"], d, a.get("source", "rules"))
    cd = rules["componentDeps"]
    for i in ui_ids:
        for d in cd["targets"]:
            if d != i:
                edges[i].append((d, "componentDeps"))
    for wid, spec in rules["depsAllOf"].items():
        for i, t in T.items():
            if i == wid or t["epic"] not in spec["epics"] or t["postV1"] or t["blocked"]:
                continue
            if t["id"].startswith("E14-1") and "wave-wiring" in t["labels"]:
                continue
            if any(f.startswith(spec["requirePathPrefix"]) for f in t["filesTouched"]):
                edges[wid].append((i, "depsAllOf"))
    n_chain = 0
    for ch in rules["chains"]:
        order = [x for x in ch["order"]]
        for a, b in zip(order, order[1:]):
            add(b, a, "chain:" + ch["file"])
            n_chain += 1
    # removals
    rm = defaultdict(set)
    for tid, ds in rescope_deps_rm.items():
        for d in ds:
            for s in remap.subject(tid):
                rm[s].update(remap.targets(d, s))
    for r in rules["removeDeps"]:
        for d in r["deps"]:
            for s in remap.subject(r["id"]):
                rm[s].update(remap.targets(d, s))
    dep_source = {}
    for i, t in T.items():
        lst = []
        for d, src in edges.get(i, []):
            if d in rm[i] or d == i:
                continue
            if d not in lst:
                lst.append(d)
                dep_source[(i, d)] = src
        t["dependencies"] = lst
    # prune V1 -> post-1.0
    pruned = []
    for i, t in T.items():
        if t["postV1"]:
            continue
        keep = []
        for d in t["dependencies"]:
            if d in T and T[d]["postV1"]:
                pruned.append((i, d))
            else:
                keep.append(d)
        t["dependencies"] = keep

    cyc = find_cycle(T)
    if cyc:
        for a, b in zip(cyc, cyc[1:]):
            print("  cycle edge %s -> %s (%s)" % (a, b, dep_source.get((a, b))))
        raise SystemExit("dependency cycle (explicit edges): " + " -> ".join(cyc))

    # 10. auto-serialise remaining file collisions along a V1-first topological order
    prio = {x: k for k, x in enumerate(rules["priority"])}

    def key(i):
        t = T[i]
        return (t["postV1"], t["blocked"], prio.get(i, 10 ** 6), idkey(i))

    order = topo(T, key)
    assert len(order) == len(T)
    FS = file_sets(T)
    pos = {i: k for k, i in enumerate(order)}
    anc = {}
    auto = []
    for k, i in enumerate(order):
        a = 0
        for d in T[i]["dependencies"]:
            if d in pos:
                a |= anc[d] | (1 << pos[d])
        for j in range(k - 1, -1, -1):
            jid = order[j]
            if (a >> j) & 1:
                continue
            sh = shared(FS[i], FS[jid])
            if sh:
                T[i]["dependencies"].append(jid)
                dep_source[(i, jid)] = "auto-serialise:" + sh[0]
                auto.append((i, jid, sh[0]))
                a |= anc[jid] | (1 << j)
        anc[i] = a

    # 11. labels
    for i, t in T.items():
        labels = [l for l in t["labels"] if l not in ("blocked-decision", "needs-human-input", "ready",
                                                       "awaiting-po-approval", "post-1.0", "texo-v1")
                  and not re.match(r"^needs-h\d$", l)]
        labels = ["texo-v1"] + labels
        if t["postV1"]:
            labels.append("post-1.0")
        if t["blocked"]:
            labels.append("blocked-decision")
            labels += ["needs-%s" % h.lower() for h in t["decisionsNeeded"]]
            for h in t["decisionsNeeded"]:
                d = rules["decisions"][h]
                line = "BLOCKED on %s: %s. Unblock condition: %s." % (h, d["text"], d["unblock"])
                if line not in t["risks"]:
                    t["risks"].append(line)
        else:
            labels += ["ready", "awaiting-po-approval"]
        t["labels"] = uniq(labels)
        t["dependencies"] = sorted(uniq(t["dependencies"]), key=idkey)
        t.setdefault("splitFrom", None)
        t.setdefault("splitInto", [])

    # 12. waves
    order = topo(T, key)
    W = waves(T, order)
    for i in T:
        T[i]["wave"] = W[i]

    # ------------------------------------------------------------ validate
    violations = []
    for i, t in T.items():
        for f in REQUIRED:
            if f not in t:
                violations.append("%s missing field %s" % (i, f))
        for f in REQUIRED_NONEMPTY:
            if not t.get(f):
                violations.append("%s empty field %s" % (i, f))
        for f in ("problem", "value", "title"):
            if not str(t.get(f, "")).strip():
                violations.append("%s empty %s" % (i, f))
        if not ID_RE.match(i):
            violations.append("%s bad id" % i)
        if t["epic"] not in EPICS:
            violations.append("%s bad epic %s" % (i, t["epic"]))
        if t["size"] not in ("S", "M", "L"):
            violations.append("%s bad size" % i)
        if t["priority"] not in ("High", "Medium", "Low"):
            violations.append("%s bad priority" % i)
        if t["semver"] not in ("patch", "minor", "none"):
            violations.append("%s bad semver" % i)
        if t["type"] != "Task":
            violations.append("%s bad type" % i)
        if len(t["title"]) > 100:
            violations.append("%s title > 100 chars" % i)
        for l in t["labels"]:
            if not re.match(r"^[a-z0-9]+([.-][a-z0-9]+)*$", l):
                violations.append("%s label not kebab: %s" % (i, l))
        if not (("ready" in t["labels"]) ^ ("blocked-decision" in t["labels"])):
            violations.append("%s must have exactly one of ready/blocked-decision" % i)
        for f in t["filesTouched"]:
            if f.startswith("docs/adr/"):
                violations.append("%s uses docs/adr (D1)" % i)
    unresolved = [(i, d) for i, t in T.items() for d in t["dependencies"] if d not in T and not EXT_RE.match(d)]
    externals = sorted({d for t in T.values() for d in t["dependencies"] if EXT_RE.match(d)})
    cyc = find_cycle(T)
    order = topo(T, key)
    anc, pos = ancestors(T, order)
    FS = file_sets(T)
    ids = sorted(T, key=idkey)
    collisions, ordered_pairs = [], 0
    for x in range(len(ids)):
        for y in range(x + 1, len(ids)):
            a, b = ids[x], ids[y]
            sh = shared(FS[a], FS[b])
            if not sh:
                continue
            if (anc[a] >> pos[b]) & 1 or (anc[b] >> pos[a]) & 1:
                ordered_pairs += 1
            else:
                collisions.append((a, b, sh[0]))
    v1_to_post = [(i, d) for i, t in T.items() if not t["postV1"] for d in t["dependencies"] if d in T and T[d]["postV1"]]
    large = sorted([i for i, t in T.items() if t["size"] == "L"], key=idkey)
    adr = defaultdict(set)
    for t in T.values():
        for f in t["filesTouched"]:
            m = re.match(r"^audit/adr/(\d{4})-(.+)\.md$", f)
            if m:
                adr[m.group(1)].add(m.group(2))
    adr_conflicts = {k: sorted(v) for k, v in adr.items() if len(v) > 1}
    for k, v in adr_conflicts.items():
        violations.append("ADR number %s used for %s" % (k, v))
    ui_missing = [i for i in ui_ids if not any("meta.ts" in x and "ADR-R7" in x for x in T[i]["dod"])]
    for i in ui_missing:
        violations.append("%s UI ticket lacks meta obligation" % i)
    vague_list = [(i, a, vague(a)) for i in ids for a in T[i]["acceptance"] if vague(a)]
    # every one of the 61 R2 vague criteria must be gone from the final backlog
    finals = {norm_item(a) for t in T.values() for a in t["acceptance"]}
    r2_vague_remaining = [(tid, old) for tid, mp in rules["acRewrites"].items() for old in mp if norm_item(old) in finals]
    blocked_ids = sorted([i for i in T if T[i]["blocked"]], key=idkey)
    post_ids = sorted([i for i in T if T[i]["postV1"]], key=idkey)

    report = {
        "schemaViolations": len(violations),
        "unresolvedDeps": len(unresolved),
        "cycles": 0 if not cyc else 1,
        "unorderedFileCollisions": len(collisions),
        "orderedSharedFilePairs": ordered_pairs,
        "v1DependsOnPost": len(v1_to_post),
        "sizeL": len(large),
        "r2VagueAcRemaining": len(r2_vague_remaining),
        "heuristicVagueAc": len(vague_list),
    }

    # ------------------------------------------------------------ outputs
    os.makedirs(OUT_DIR, exist_ok=True)
    FIELD_ORDER = REQUIRED + ["wave", "postV1", "blocked", "decisionsNeeded", "absorbs", "splitFrom", "splitInto", "origin"]
    final = {i: {f: T[i].get(f) for f in FIELD_ORDER} for i in ids}
    by_epic = defaultdict(list)
    for i in ids:
        by_epic[final[i]["epic"]].append(final[i])
    for ep in EPICS:
        lst = sorted(by_epic.get(ep, []), key=lambda t: (t["wave"], idkey(t["id"])))
        with open(os.path.join(OUT_DIR, "%s.json" % ep), "w") as fh:
            json.dump(lst, fh, indent=2, ensure_ascii=False)
            fh.write("\n")
    index = [{"id": i, "epic": final[i]["epic"], "title": final[i]["title"], "size": final[i]["size"],
              "wave": final[i]["wave"], "labels": final[i]["labels"], "deps": final[i]["dependencies"],
              "postV1": final[i]["postV1"], "blocked": final[i]["blocked"]}
             for i in sorted(ids, key=lambda x: (final[x]["wave"], idkey(x)))]
    with open(os.path.join(OUT_DIR, "_index.json"), "w") as fh:
        json.dump(index, fh, indent=2, ensure_ascii=False)
        fh.write("\n")

    epics_out = []
    for ep in EPICS:
        d = rules["epics"][ep]
        members = sorted(by_epic.get(ep, []), key=lambda t: (t["wave"], idkey(t["id"])))
        active = [t for t in members if not t["postV1"] and not t["blocked"]]
        k = len(d["milestones"])
        ms = []
        for n, title in enumerate(d["milestones"]):
            lo, hi = (len(active) * n) // k, (len(active) * (n + 1)) // k
            chunk = active[lo:hi]
            ms.append({"order": n + 1, "title": title, "assignment": "contiguous slice of the epic's ready V1 tickets ordered by wave",
                       "waves": [chunk[0]["wave"], chunk[-1]["wave"]] if chunk else [],
                       "tickets": [t["id"] for t in chunk]})
        blk = [t["id"] for t in members if t["blocked"] and not t["postV1"]]
        if blk:
            ms.append({"order": len(ms) + 1, "title": "Blocked on human decisions",
                       "decisions": sorted({h for t in members if t["blocked"] for h in t["decisionsNeeded"]},
                                           key=lambda h: int(h[1:])), "tickets": blk})
        pst = [t["id"] for t in members if t["postV1"]]
        if pst:
            ms.append({"order": len(ms) + 1, "title": "Post-1.0 (deferred, D14)", "tickets": pst})
        epics_out.append({"key": ep, "title": d["title"], "goal": d["goal"], "successCriteria": d["successCriteria"],
                          "ticketCount": len(members), "v1TicketCount": len([t for t in members if not t["postV1"]]),
                          "milestones": ms})
    with open(os.path.join(OUT_DIR, "epics.json"), "w") as fh:
        json.dump(epics_out, fh, indent=2, ensure_ascii=False)
        fh.write("\n")

    # ------------------------------------------------------------ RECONCILIATION.md
    after_size = Counter(t["size"] for t in final.values())
    per_epic = Counter(t["epic"] for t in final.values())
    per_wave = Counter(t["wave"] for t in final.values())
    per_label = Counter(l for t in final.values() for l in t["labels"])
    kinds = Counter(r["kind"] for r in removed.values())
    md = []
    w = md.append
    w("# Texo V1 backlog reconciliation\n")
    w("Generated by `audit/texo-v1/scripts/reconcile.py` from `tickets/*.json` (unchanged) and "
      "`reviews/reconcile-rules.json`. Precedence: DECISIONS.md > R1 ownership (ADR-R4) > R2 mechanics. "
      "Do not edit by hand; re-run the script.\n")
    w("## Validator\n")
    w("| Check | Result |\n|---|---|")
    for k2, v in report.items():
        w("| %s | %s |" % (k2, v))
    w("| externalDeps (must exist in Jira before import) | %s |" % (", ".join(externals) or "none"))
    w("| sizeL tickets | %s |" % (", ".join(large) or "none"))
    w("\n`heuristicVagueAc` is informational: a stricter word/cue heuristic than R2 §2a (it also flags short inspection-style criteria). All 61 R2-listed criteria were rewritten (`r2VagueAcRemaining` = 0) and 5 recurring weak phrasings were rewritten globally.\n")
    if violations:
        w("### Violations\n")
        for v in violations:
            w("- " + v)
    if collisions:
        w("### Unordered collisions\n")
        for a, b, s in collisions:
            w("- %s / %s: %s" % (a, b, s))
    w("\n## Counts before / after\n")
    w("| Metric | Before | After |\n|---|---|---|")
    w("| Tickets | %d | %d |" % (before["tickets"], len(final)))
    for s in ("S", "M", "L"):
        w("| Size %s | %d | %d |" % (s, before["size"].get(s, 0), after_size.get(s, 0)))
    w("| Removed (drop) | - | %d |" % kinds.get("drop", 0))
    w("| Removed (merge) | - | %d |" % kinds.get("merge", 0))
    w("| Split children added | - | %d |" % sum(len(v) - 1 for v in split_map.values()))
    w("| New tickets | - | %d |" % len(rules["newTickets"]))
    w("| Post-1.0 | - | %d |" % len(post_ids))
    w("| Blocked on human decision | - | %d |" % len(blocked_ids))
    w("| Ready | - | %d |" % per_label.get("ready", 0))
    w("| Waves | - | %d |" % (max(per_wave) + 1))
    w("| AC rewrites applied | - | %d |" % n_rw)
    w("| Text replacements applied (field edits) | - | %d |" % n_tr)
    w("| R2 addDeps applied / skipped | - | %d / %d |" % (n_r2, n_r2_skip))
    w("| Chain edges declared | - | %d |" % n_chain)
    w("| Auto-serialisation edges | - | %d |" % len(auto))
    w("| V1 -> post-1.0 edges pruned | - | %d |" % len(pruned))
    w("| UI component tickets with meta obligation | - | %d |" % len(ui_ids))
    w("\n### Per epic\n")
    w("| Epic | Before | After | Post-1.0 | Blocked |\n|---|---|---|---|---|")
    for ep in EPICS:
        w("| %s | %d | %d | %d | %d |" % (ep, before["perEpic"].get(ep, 0), per_epic.get(ep, 0),
                                         len([1 for t in final.values() if t["epic"] == ep and t["postV1"]]),
                                         len([1 for t in final.values() if t["epic"] == ep and t["blocked"]])))
    w("\n### Per wave\n")
    w("| Wave | Tickets | V1 | Post-1.0 |\n|---|---|---|---|")
    for wv in sorted(per_wave):
        w("| %d | %d | %d | %d |" % (wv, per_wave[wv],
                                    len([1 for t in final.values() if t["wave"] == wv and not t["postV1"]]),
                                    len([1 for t in final.values() if t["wave"] == wv and t["postV1"]])))
    w("\n### Per label (top 40)\n")
    w("| Label | Count |\n|---|---|")
    for l, c in sorted(per_label.items(), key=lambda x: (-x[1], x[0]))[:40]:
        w("| %s | %d |" % (l, c))
    w("\n## Conflicts resolved (R1 vs R2)\n")
    w("| Topic | R1 | R2 | Resolution | Basis |\n|---|---|---|---|---|")
    for c in rules["conflicts"]:
        w("| %s | %s | %s | %s | %s |" % (c["topic"], c["R1"], c["R2"], c["resolution"], c["basis"]))
    w("\nSkipped R2 addDeps edges:\n")
    for a, b, why in rules["skipR2AddDeps"]:
        w("- %s -> %s: %s" % (a, b, why))
    w("\n## Removed tickets (absorbed)\n")
    w("| Removed | Kind | Into | Source | Reason |\n|---|---|---|---|---|")
    for rid in sorted(removed, key=idkey):
        r = removed[rid]
        w("| %s %s | %s | %s | %s | %s |" % (rid, r["title"], r["kind"], ", ".join(r["into"]), r["source"], r["reason"]))
    w("\n## Splits (L tickets)\n")
    for pid, ch in split_map.items():
        w("- %s -> %s" % (pid, ", ".join("%s (%s)" % (c, T[c]["title"]) for c in ch)))
    w("\n## New tickets\n")
    for nt in rules["newTickets"]:
        w("- %s %s" % (nt["id"], nt["title"]))
    w("\n## Post-1.0 (label `post-1.0`, D14)\n")
    w(", ".join(post_ids))
    w("\n\nPruned V1 -> post-1.0 dependency edges: " + (", ".join("%s->%s" % p for p in sorted(pruned)) or "none"))
    w("\n## Blocked on human decisions\n")
    w("| Decision | Tickets |\n|---|---|")
    for h in rules["decisions"]:
        w("| %s | %s |" % (h, ", ".join(i for i in blocked_ids if h in T[i]["decisionsNeeded"])))
    w("\nH9 (publish / tag / PO approval) applies to every ticket and is never granted here; no ticket carries `po-approved`.\n")
    w("## Auto-serialisation edges (shared filesTouched, ordered V1-first)\n")
    w("Edges added by the script so that no two tickets sharing a path are unordered. "
      "`src/**` is owned by E14-03 (ESM specifier codemod), so most src tickets order after it.\n")
    w("<details><summary>%d edges</summary>\n" % len(auto))
    for a, b, s in auto:
        w("- %s depends on %s (%s)" % (a, b, s))
    w("\n</details>\n")
    w("## Heuristic vague-AC flags (informational)\n")
    for i, a, why in vague_list:
        w("- %s: %s [%s]" % (i, a, why))
    w("\n## Determinism\n")
    digest = hashlib.sha256(json.dumps(final, sort_keys=True).encode()).hexdigest()
    w("sha256 of the final backlog (sorted JSON): `%s`\n" % digest)
    with open(os.path.join(OUT_DIR, "RECONCILIATION.md"), "w") as fh:
        fh.write("\n".join(md) + "\n")

    # ------------------------------------------------------------ console
    print("tickets before=%d after=%d (removed=%d split+=%d new=%d)" % (
        before["tickets"], len(final), len(removed), sum(len(v) - 1 for v in split_map.values()), len(rules["newTickets"])))
    for k2, v in report.items():
        print("  %-26s %s" % (k2, v))
    print("  size: %s" % dict(after_size))
    print("  waves: %d  post-1.0: %d  blocked: %d  ready: %d  auto-edges: %d  pruned: %d" % (
        max(per_wave) + 1, len(post_ids), len(blocked_ids), per_label.get("ready", 0), len(auto), len(pruned)))
    print("  per-epic: " + " ".join("%s=%d" % (e, per_epic.get(e, 0)) for e in EPICS))
    print("  per-wave: " + " ".join("%d=%d" % (wv, per_wave[wv]) for wv in sorted(per_wave)))
    print("  sha256: " + digest)
    for v in violations[:40]:
        print("  VIOLATION " + v)
    for a, b, s in collisions[:20]:
        print("  COLLISION %s %s %s" % (a, b, s))
    for a, b in unresolved[:20]:
        print("  UNRESOLVED %s -> %s" % (a, b))
    bad = violations or unresolved or cyc or collisions or v1_to_post or large or r2_vague_remaining
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
