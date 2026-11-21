# Lab 01 · Ideate on a rule

**Author:** Marina · **Project:** Lost & Found Pets

Every product has rules hiding inside it: how much something costs, when two things count as a match, what price feels fair. Designers shape those rules too, and Python is a quick way to feel how a rule behaves before anyone builds a screen.

The rule here decides what the owner of a lost pet sees when someone reports a found pet: **match** (go and look now), **maybe** (worth a look) or **no**.

## Run it

```bash
python3 lost_found_match.py
```

Pick **1** to run the seven reports and check every expectation, or **2** to type in your own lost pet and found pet.

## How the file is laid out

1. **Knobs** at the top: points for the same colour, a look-alike colour, nearby, the same size, a fresh lead and an old find, plus the match and maybe thresholds.
2. **The rule**: `clues()` adds up the points, `match()` turns them into match / maybe / no, `why()` is the one sentence the owner sees.
3. **Seven real reports**, each with what the team expects.
4. **Try your own pets**: a small menu to test any pair.

## The loop

1. Run it and read the results. Does anything surprise you?
2. Guess what a change will do, then ask the AI agent to make it.
3. Run again. Did the result match your guess? Did an expectation stop holding?
4. Decide: is the new rule better, or was the expectation wrong?
5. Write one line in [notes.md](notes.md): idea → what changed → keep or drop.
