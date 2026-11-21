"""Lost & Found Pets · does a found pet match a lost report?

When someone finds a pet, this rule decides what the owner of a lost pet sees:
"match" (go and look now), "maybe" (worth a look) or "no".
A wrong "match" gives false hope; a missed match keeps a pet from home.

Press ▶ Run in the Terminal tab, then pick 1 to see the seven reports,
or 2 to type in your own lost pet and found pet.
"""

# ── Knobs: the numbers that shape this rule. Ask the AI agent to change them ──
COLOUR_POINTS = 2        # same colour
LOOKALIKE_POINTS = 1     # colours that look alike in photos
LOOKALIKE = [{"white", "cream"}, {"black", "dark grey"}, {"brown", "ginger"}]
NEAR_KM = 2.0            # found within this distance of where it was lost
NEAR_POINTS = 2
SIZE_POINTS = 1          # same size (small, medium, large)
MATCH_AT = 5             # this many points or more: "match"
MAYBE_AT = 2             # this many points or more: "maybe"

# Time is now a clue, not a cut-off: recent finds get a boost, old ones lose points.
FRESH_DAYS = 7           # found this soon after it went missing: a fresh lead
FRESH_POINTS = 1
OLD_DAYS = 30            # found later than this: still possible, but lower priority
OLD_PENALTY = -2


# ── The rule ───────────────────────────────────────────────────────────────
def clues(lost, found):
    """The points each clue gives, as (clue, points)."""
    points = []
    if lost["colour"] == found["colour"]:
        points.append(("same colour", COLOUR_POINTS))
    elif {lost["colour"], found["colour"]} in LOOKALIKE:
        points.append(("look-alike colour", LOOKALIKE_POINTS))
    if found["km_apart"] <= NEAR_KM:
        points.append(("nearby", NEAR_POINTS))
    if lost["size"] == found["size"]:
        points.append(("same size", SIZE_POINTS))
    days = found["day"] - lost["day"]
    if days <= FRESH_DAYS:
        points.append(("found quickly", FRESH_POINTS))
    elif days > OLD_DAYS:
        points.append(("found long after", OLD_PENALTY))
    return points


def match(lost, found):
    """'match', 'maybe' or 'no'."""
    if lost["species"] != found["species"]:
        return "no"
    if found["day"] < lost["day"]:
        return "no"
    score = sum(points for _, points in clues(lost, found))
    if score >= MATCH_AT:
        return "match"
    if score >= MAYBE_AT:
        return "maybe"
    return "no"


def why(lost, found):
    """The one sentence the owner sees."""
    if lost["species"] != found["species"]:
        return f"A {found['species']} was found, but you lost a {lost['species']}."
    if found["day"] < lost["day"]:
        return "It was found before yours went missing."
    points = clues(lost, found)
    score = sum(p for _, p in points)
    parts = " + ".join(f"{name} {p}" for name, p in points) or "no clues"
    sentence = f"{parts} = {score} points (match from {MATCH_AT}, maybe from {MAYBE_AT})."
    if found["day"] - lost["day"] > OLD_DAYS:
        sentence += " Found long ago, so it sits lower in the list."
    return sentence


def pet(species, colour, size, km_apart, day):
    """km_apart: how far the found pet was from where the lost pet went missing."""
    return {"species": species, "colour": colour, "size": size, "km_apart": km_apart, "day": day}


# ── Seven real reports, and what the team expects ──────────────────────────
#   (km_apart = distance between where it was lost and where it was found,
#    day = day number)
SCENARIOS = [
    (pet("dog", "black", "medium", 0.4, 1), pet("dog", "black", "medium", 0.4, 2), "match", "Same dog, nearby, the next day"),
    (pet("dog", "black", "medium", 0.0, 1), pet("cat", "black", "small", 0.1, 1), "no", "A different animal"),
    (pet("cat", "grey", "small", 0.0, 1), pet("cat", "grey", "small", 6.0, 2), "maybe", "Cats wander, so don't rule it out"),
    (pet("dog", "white", "medium", 0.0, 3), pet("dog", "cream", "small", 0.3, 3), "maybe", "Looks alike in a photo, worth a look"),
    (pet("dog", "brown", "large", 0.0, 1), pet("dog", "brown", "large", 0.2, 40), "maybe", "Found weeks later: still worth a look"),
    (pet("cat", "black", "small", 0.0, 5), pet("cat", "black", "small", 0.2, 3), "no", "Found before it was lost"),
    (pet("dog", "black", "large", 0.0, 1), pet("dog", "black", "small", 3.0, 3), "maybe", "Same black dog, 3 km away, two days later, wrong size"),
]


def show():
    print("Lost & Found Pets · seven reports\n")
    holding = 0
    for lost, found, expected, label in SCENARIOS:
        answer = match(lost, found)
        ok = answer == expected
        holding += ok
        print(f"{'✓' if ok else '✗'}  {answer:<6} {label}  (expected {expected})")
        print(f"          {why(lost, found)}")
    print(f"\n{holding}/{len(SCENARIOS)} expectations hold.", end=" ")
    if holding == len(SCENARIOS):
        print("Ask the AI agent to change a knob or try an idea, then press ▶ Run again.")
    else:
        print("Is the rule wrong, or the expectation?")


# ── Try your own pets ──────────────────────────────────────────────────────
def ask_text(question, allowed, example):
    """Keep asking until the answer is one of the allowed words."""
    while True:
        answer = input(f"{question} {allowed} (e.g. {example}): ").strip().lower()
        if answer in allowed:
            return answer
        if answer == "":
            print("  Please type one of the words shown.")
        else:
            print(f"  '{answer}' isn't one of the choices.")


def ask_number(question, example, whole=False):
    """Keep asking until the answer is a number."""
    while True:
        answer = input(f"{question} (e.g. {example}): ").strip().replace(",", ".")
        try:
            value = float(answer)
        except ValueError:
            print("  Please type a number.")
            continue
        if value < 0:
            print("  Please type a number of 0 or more.")
            continue
        return int(value) if whole else value


def ask_pet(who, ask_distance):
    print(f"\n{who}")
    species = ask_text("  Animal?", ["dog", "cat"], "dog")
    colour = ask_text("  Colour?", ["black", "white", "cream", "grey", "dark grey", "brown", "ginger"], "black")
    size = ask_text("  Size?", ["small", "medium", "large"], "medium")
    if ask_distance:
        km_apart = ask_number("  How far was it found from where it went missing, in km?", "1.5")
    else:
        km_apart = 0.0  # the lost pet's own spot: distance is measured from here
    day = ask_number("  Which day number?", "1", whole=True)
    return pet(species, colour, size, km_apart, day)


def try_your_own():
    lost = ask_pet("Your lost pet:", ask_distance=False)
    found = ask_pet("The pet someone found:", ask_distance=True)
    answer = match(lost, found)
    print(f"\nResult: {answer.upper()}")
    print(f"  {why(lost, found)}")
    if answer == "no" and lost["species"] == found["species"] and found["day"] >= lost["day"]:
        score = sum(p for _, p in clues(lost, found))
        print(f"  It scored {score}, and a 'maybe' needs {MAYBE_AT}.")


# ── The menu ───────────────────────────────────────────────────────────────
def menu():
    while True:
        print("\n1) run the seven reports   2) try your own pets   q) quit")
        choice = input("Pick one: ").strip().lower()
        if choice == "1":
            show()
        elif choice == "2":
            try_your_own()
        elif choice in ("q", ""):
            print("Bye — good luck finding them.")
            return
        else:
            print("Please pick 1, 2 or q.")


if __name__ == "__main__":
    menu()
