#!/usr/bin/env python3
"""Builds the film list datasets in src/data/lists/ (run by hand; the output is committed).

Sources (download them next to this script, or pass a directory as the first argument):
  * Sight & Sound 2012, critics' and directors' polls: the per-film vote counts scraped from
    the BFI's 2012 poll site, https://github.com/serve-and-volley/sight-and-sound-poll-data
    (2012/csv_query_results/{critics,directors}_poll_2012.csv). Ranks are recomputed from the
    votes the way the BFI ranks them (ties share a rank, the next rank skips), and every film
    ranked 250 or better is kept, so ties at the cut-off can make a list a little longer.
  * They Shoot Pictures, Don't They? 1,000 Greatest Films (latest edition):
    https://www.theyshootpictures.com/gf1000_all1000films_table.php saved as tspdt.html.

Every film is resolved to a Wikidata item, for its IMDb id and its titles in English, Hebrew
and the original language (used to match against the cinematheque's titles):
  * S&S films by their BFI id (Wikidata P4438), falling back to a title search.
  * TSPDT films (and S&S films without a BFI id) by a title search, accepted only when the
    candidate's year is within a year of the list's and a director's surname matches.
Films that can't be resolved are kept with only the list's own title and year.

Usage: python3 scripts/lists/build-lists.py <sources-dir>
"""

import csv
import hashlib
import html
import json
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

SOURCES = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).parent)
OUT_DIR = Path(__file__).resolve().parents[2] / 'src' / 'data' / 'lists'
SPARQL = 'https://query.wikidata.org/sparql'
USER_AGENT = 'cinema-lists/1.0 (https://github.com/dividded/cinema)'
MAX_RANK = 250


CACHE_DIR = SOURCES / '.sparql-cache'


def sparql(query: str) -> list[dict]:
    """Runs a query, caching results on disk so reruns don't hit Wikidata again."""
    CACHE_DIR.mkdir(exist_ok=True)
    cached = CACHE_DIR / (hashlib.sha1(query.encode()).hexdigest() + '.json')
    if cached.exists():
        return json.loads(cached.read_text(encoding='utf-8'))
    rows = run_sparql(query)
    cached.write_text(json.dumps(rows, ensure_ascii=False), encoding='utf-8')
    return rows


def run_sparql(query: str) -> list[dict]:
    for attempt in range(5):
        try:
            request = urllib.request.Request(
                SPARQL + '?' + urllib.parse.urlencode({'query': query}),
                headers={'Accept': 'application/sparql-results+json', 'User-Agent': USER_AGENT},
            )
            with urllib.request.urlopen(request, timeout=120) as response:
                data = json.loads(response.read().decode('utf-8'), strict=False)
            return [{k: v['value'] for k, v in row.items()} for row in data['results']['bindings']]
        except Exception as error:  # noqa: BLE001 - retry anything (timeouts, 429s)
            print(f'  sparql retry {attempt + 1}: {error}', file=sys.stderr)
            time.sleep(5 * (attempt + 1))
    raise RuntimeError('SPARQL query kept failing')


def fold(text: str) -> str:
    text = unicodedata.normalize('NFKD', text)
    return ''.join(c for c in text if not unicodedata.combining(c)).lower()


def surnames(directors: str) -> set[str]:
    """Last words of each director's name (TSPDT writes 'Ozu, Yasujiro', S&S 'Ozu Yasujirô')."""
    names = set()
    for part in re.split(r'\s*(?:/|&|\band\b|;)\s*', directors):
        part = part.strip()
        if not part:
            continue
        if ',' in part:
            names.add(fold(part.split(',')[0]).split()[-1])
        else:
            words = fold(part).replace('.', ' ').split()
            names.update(words[-1:] + words[:1])  # East Asian names are often family-name first
    return {n for n in names if len(n) > 1}


def lit(text: str) -> str:
    return json.dumps(text, ensure_ascii=False)


# --- Sources -----------------------------------------------------------------------------

def ranked(rows: list[dict], votes_key: str) -> list[dict]:
    rows = sorted(rows, key=lambda r: -int(r[votes_key]))
    out, rank, previous = [], 0, None
    for i, row in enumerate(rows):
        votes = int(row[votes_key])
        if votes != previous:
            rank, previous = i + 1, votes
        if rank > MAX_RANK:
            break
        out.append({**row, 'rank': rank, 'votes': votes})
    return out


def sight_and_sound(poll: str) -> list[dict]:
    path = SOURCES / 'ssp' / '2012' / 'csv_query_results' / f'{poll}_poll_2012.csv'
    films = {r['film_id']: r for r in csv.DictReader(open(SOURCES / 'ssp' / '2012' / 'csv_raw_data' / 'films_2012.csv', encoding='utf-8'))}
    entries = []
    for row in ranked(list(csv.DictReader(open(path, encoding='utf-8'))), 'votes'):
        film = films.get(row['film_id'], {})
        alternates = [t.strip() for t in film.get('alternate_titles_raw', '').split('|') if t.strip()]
        entries.append({
            'rank': row['rank'],
            'votes': row['votes'],
            'title': row['normed_film_title'].strip(),
            'year': int(row['film_year']) if row['film_year'] else None,
            'director': row['film_director'].strip(),
            'bfi': row['film_id'] if not row['film_id'].isdigit() else None,
            'alt': alternates,
        })
    return entries


def display_directors(directors: str) -> str:
    """'Kubrick, Stanley' -> 'Stanley Kubrick' (also 'Powell, Michael & Emeric Pressburger')."""
    parts = [p.strip() for p in directors.split('&')]
    flipped = [f'{p.split(", ", 1)[1]} {p.split(", ", 1)[0]}' if ', ' in p else p for p in parts]
    return ' & '.join(flipped)


def tspdt() -> list[dict]:
    page = (SOURCES / 'tspdt.html').read_text(encoding='utf-8')
    body = page[page.index('<tbody>'):page.index('</tbody>')]
    entries = []
    for row in re.findall(r'<tr>(.*?)</tr>', body, re.S):
        cells = [html.unescape(re.sub(r'<[^>]+>', '', c)).strip() for c in re.findall(r'<td>(.*?)</td>', row, re.S)]
        rank, _previous, title, director, year, country, _mins = cells[:7]
        title = re.sub(r'\s*\[[^\]]*\]$', '', title)  # "Psycho [1960]", "Berlin Alexanderplatz [TV]"
        # "Rules of the Game, The" -> "The Rules of the Game" (also "Avventura, L'")
        m = re.match(r'^(.*), (The|A|An|La|Le|Les|L\'|Il|Lo|I|Gli|El|Los|Las|Der|Die|Das|Un|Une|O|Os|As)$', title)
        if m:
            title = f"{m.group(2)}{'' if m.group(2).endswith(chr(39)) else ' '}{m.group(1)}"
        entries.append({
            'rank': int(rank),
            'title': title,
            'year': int(year[:4]) if year[:4].isdigit() else None,
            'director': display_directors(director),
            'match_director': director,  # "Surname, First" pins down the surname
            'country': country,
            'alt': [],
        })
    return entries


# --- Wikidata resolution -------------------------------------------------------------------

def by_bfi(ids: list[str]) -> dict[str, str]:
    found = {}
    for i in range(0, len(ids), 150):
        values = ' '.join(lit(x) for x in ids[i:i + 150])
        for row in sparql(f'SELECT ?bfi ?item WHERE {{ VALUES ?bfi {{ {values} }} ?item wdt:P4438 ?bfi . ?item wdt:P345 [] }}'):
            found.setdefault(row['bfi'], row['item'].rsplit('/', 1)[1])
    return found


def search_candidates(terms: list[str]) -> dict[str, set[str]]:
    """Wikidata entity search (labels and aliases, any case) for films with an IMDb id."""
    out: dict[str, set[str]] = {}
    for i in range(0, len(terms), 20):
        values = ' '.join(lit(t) for t in terms[i:i + 20])
        query = f'''SELECT ?term ?item WHERE {{
          VALUES ?term {{ {values} }}
          SERVICE wikibase:mwapi {{
            bd:serviceParam wikibase:endpoint "www.wikidata.org"; wikibase:api "EntitySearch";
              mwapi:search ?term; mwapi:language "en"; mwapi:limit "50".
            ?item wikibase:apiOutputItem mwapi:item.
          }}
          ?item wdt:P345 ?imdb . FILTER(STRSTARTS(?imdb, "tt"))
        }}'''
        for row in sparql(query):
            out.setdefault(row['term'], set()).add(row['item'].rsplit('/', 1)[1])
        time.sleep(0.3)
    return out


def fulltext_candidates(terms: list[str]) -> dict[str, set[str]]:
    """Full-text search (also matches aliases and other languages), for what EntitySearch missed."""
    out: dict[str, set[str]] = {}
    for i in range(0, len(terms), 10):
        values = ' '.join(f'({lit(t)} {lit(t + " haswbstatement:P345")})' for t in terms[i:i + 10])
        query = f'''SELECT ?term ?item WHERE {{
          VALUES (?term ?q) {{ {values} }}
          SERVICE wikibase:mwapi {{
            bd:serviceParam wikibase:endpoint "www.wikidata.org"; wikibase:api "Search";
              mwapi:srsearch ?q; mwapi:srlimit "30".
            ?item wikibase:apiOutputItem mwapi:title.
          }}
        }}'''
        for row in sparql(query):
            item = row['item'].rsplit('/', 1)[-1]
            if re.fullmatch(r'Q\d+', item):
                out.setdefault(row['term'], set()).add(item)
        time.sleep(0.5)
    return out


def details(qids: set[str]) -> dict[str, dict]:
    info: dict[str, dict] = {}
    qids = sorted(qids)
    # Small batches: one row per (director, alias) pair can make responses huge and truncated.
    batch = 80 if len(qids) < 2500 else 25
    for i in range(0, len(qids), batch):
        values = ' '.join(f'wd:{q}' for q in qids[i:i + batch])
        query = f'''SELECT ?item ?imdb ?date ?dirLabel ?en ?he ?orig ?alias WHERE {{
          VALUES ?item {{ {values} }}
          ?item wdt:P345 ?imdb . FILTER(STRSTARTS(?imdb, "tt"))
          OPTIONAL {{ ?item wdt:P577 ?date }}
          OPTIONAL {{ ?item wdt:P57 ?dir . ?dir rdfs:label ?dirLabel . FILTER(LANG(?dirLabel) IN ("en", "mul")) }}
          OPTIONAL {{ ?item rdfs:label ?en . FILTER(LANG(?en) = "en") }}
          OPTIONAL {{ ?item rdfs:label ?he . FILTER(LANG(?he) = "he") }}
          OPTIONAL {{ ?item wdt:P1476 ?orig }}
          OPTIONAL {{ ?item skos:altLabel ?alias . FILTER(LANG(?alias) = "en") }}
        }}'''
        for row in sparql(query):
            q = row['item'].rsplit('/', 1)[1]
            d = info.setdefault(q, {'imdb': row['imdb'], 'years': set(), 'directors': set(), 'titles': {}, 'aliases': set()})
            if 'date' in row and row['date'][:4].lstrip('-').isdigit() and not row['date'].startswith('-'):
                d['years'].add(int(row['date'][:4]))
            if 'dirLabel' in row:
                d['directors'].add(row['dirLabel'])
            for key in ('en', 'he', 'orig'):
                if key in row:
                    d['titles'][key] = row[key]
            if 'alias' in row:
                d['aliases'].add(row['alias'])
    return info


def director_matches(entry: dict, d: dict) -> bool:
    wanted = surnames(entry.get('match_director', entry['director']))
    have = set().union(*(surnames(name) for name in d['directors'])) if d['directors'] else set()
    return bool(wanted & have)


def year_matches(entry: dict, d: dict) -> bool:
    return entry['year'] is None or any(abs(y - entry['year']) <= 1 for y in d['years'])


def resolve(lists: dict[str, list[dict]]) -> None:
    entries = [e for es in lists.values() for e in es]
    bfi_ids = sorted({e['bfi'] for e in entries if e.get('bfi')})
    print(f'Resolving {len(bfi_ids)} BFI ids...')
    bfi_map = by_bfi(bfi_ids)
    for e in entries:
        if e.get('bfi') in bfi_map:
            e['qid'] = bfi_map[e['bfi']]

    pending = [e for e in entries if 'qid' not in e]
    terms = sorted({t for e in pending for t in [e['title'], *e['alt'][:3]]})
    print(f'Searching {len(terms)} titles for {len(pending)} films...')
    candidates = search_candidates(terms)
    all_qids = {e['qid'] for e in entries if 'qid' in e} | set().union(*candidates.values())
    print(f'Fetching details for {len(all_qids)} items...')
    info = details(all_qids)

    def pick(e: dict, last_pass: bool) -> None:
        names = [e['title'], *e['alt'][:3]]
        qids = set().union(*(candidates.get(t, set()) for t in names))
        good = [q for q in qids if q in info and director_matches(e, info[q]) and year_matches(e, info[q])]
        if e['year'] is not None:
            exact = [q for q in good if e['year'] in info[q]['years']]
            good = exact or good
        if len(good) == 1:
            e['qid'] = good[0]
        elif len(good) > 1:
            print(f'  ambiguous: {e["title"]} ({e["year"]}): {good}')
            e['qid'] = sorted(good, key=lambda q: int(q[1:]))[0]  # the oldest item is the canonical film
        elif last_pass:
            print(f'  unresolved: {e["title"]} ({e["year"]}) {e["director"]}')

    for e in pending:
        pick(e, last_pass=False)

    missing = [e for e in pending if 'qid' not in e]
    terms = sorted({t for e in missing for t in [e['title'], *e['alt'][:3]]})
    print(f'Full-text search for {len(missing)} unresolved films...')
    for term, qids in fulltext_candidates(terms).items():
        candidates.setdefault(term, set()).update(qids)
    new = set().union(*candidates.values()) - set(info)
    info.update(details(new))
    for e in missing:
        pick(e, last_pass=True)

    for e in entries:
        d = info.get(e.get('qid', ''))
        if not d:
            continue
        e['imdb'] = d['imdb']
        if e['year'] is None and d['years']:
            e['year'] = min(d['years'])
        e['titles'] = d['titles']
        e['aliases'] = sorted(d['aliases'])


# --- Output ----------------------------------------------------------------------------------

def write(list_id: str, entries: list[dict]) -> None:
    films = []
    for e in entries:
        titles = e.get('titles', {})
        # Display the English title (lists often use the original one); keep the list's own too.
        display = titles.get('en') or e['title']
        other = [t for t in dict.fromkeys([e['title'], titles.get('orig'), *e['alt'], *e.get('aliases', [])]) if t and t != display]
        film = {'rank': e['rank'], 'title': display, 'year': e['year'], 'director': e['director']}
        if e.get('imdb'):
            film['imdb'] = e['imdb']
        if titles.get('he'):
            film['he'] = titles['he']
        if other:
            film['aka'] = other
        if e.get('votes'):
            film['votes'] = e['votes']
        if e.get('country'):
            film['country'] = e['country']
        films.append(film)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / f'{list_id}.json'
    path.write_text(json.dumps(films, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    resolved = sum(1 for f in films if 'imdb' in f)
    print(f'{path}: {len(films)} films, {resolved} with IMDb ids')


def main() -> None:
    lists = {
        'ss-directors-2012': sight_and_sound('directors'),
        'ss-critics-2012': sight_and_sound('critics'),
        'tspdt-1000': tspdt(),
    }
    resolve(lists)
    for list_id, entries in lists.items():
        write(list_id, entries)


if __name__ == '__main__':
    main()
