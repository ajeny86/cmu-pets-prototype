# Notes · Lost & Found Pets

**Author:** Marina

One line per try: idea → what changed → keep or drop.

Run the rule:

```bash
python3 lost_found_match.py
```

## Where it stands (2026-11-21)

7/7 expectations hold. Knobs: colour 2, look-alike 1, nearby (≤ 2 km) 2, same size 1, found within 7 days +1, found after 30 days −2, match from 5, maybe from 2.

## Tries

- Distance from where the pet went missing, not from Lisbon centre → each found report now says how far it was found from the lost pet's spot (`km_apart`) → keep
- Time as a clue, not a cut-off → instead of "more than 14 days apart = no", a find within 7 days gets +1 and a find after 30 days gets −2; the brown dog found 39 days later becomes "maybe" (expectation changed to "still worth a look"), 7/7 hold → keep
- Try your own pets → a menu to type in any lost pet and found pet and see match / maybe / no with the points → keep
