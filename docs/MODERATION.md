# Moderation pipeline

Every complaint is scanned when it is submitted (`server/lib/screen.js`). The scanner **never decides**: it produces
a risk score and highlighted reasons for a human moderator. Nothing is published automatically.

## What is checked

| Check | Flags |
|---|---|
| Blocklist (profanity, insult, threat, hate, accusation) | `profanity`, `insult`, `threat`, `hate`, `accusation` |
| Personal data | `pii_email`, `pii_phone` (AL +355 / XK +383), `pii_iban` (AL/XK), `pii_id`, `link`, `handle`, `plate`, `address` |
| A named person | `person_named` (title + capitalised name, e.g. "Zoti Arben Hoxha") |
| Defamation risk | `defamation_risk` when a named person appears together with an accusation word |
| Spam | `caps`, `repeat`, `spam_links` |
| Context | `new_account`, `prior_rejects`, `duplicate_text`, `burst` (many users, same company), `shared_ip` |

### Normalisation

Text is normalised before matching so simple evasion does not work: Unicode NFKD with accents removed (`ë` to `e`),
lower-casing, Cyrillic/Greek look-alikes, leetspeak inside words (`k0rv3`), repeated letters (`kurrrve`) and
letters separated by spaces or dots (`k u r v e`, `k.u.r.v.e`). Positions are mapped back to the original text so
the panel can highlight exactly what was matched.

## Blocklist

Table `blocklist` (editable in the admin panel, with a test box).

- Terms are stored lower-case, ASCII, without repeated letters.
- `exact`: the whole word must match. `stem`: any word that starts with the term matches (catches inflected forms).
- Multi-word terms (`te vras`) are phrases and match consecutive words.
- `severity` 1 to 3 controls the weight. The seed list in `migrations/0005_moderation.sql` is a starting point and
  **should be reviewed by native speakers**.

## Score and levels

Each flag adds 8 / 20 / 40 points for severity 1 / 2 / 3 (accusation words alone add very little, so everyday words
like "fraud" do not turn honest complaints red). The score is capped at 100.

| Score | Level |
|---|---|
| 0 to 14 | green |
| 15 to 39 | yellow |
| 40 and above | red |

## Moderator actions

Publish (optionally edited, the original is kept in `complaint_edits`), auto-mask preview (personal data, profanity,
links become `***`), reject with a reason (the author is emailed) and remove a published complaint. All actions are
written to `moderation_log`.

## Limits

This is a heuristic. Expect false positives (for example a surname that matches a blocklist word) and false
negatives (creative spelling, other languages). Treat it as a prioritisation aid, not as a filter.

## Tests

`npm test` runs `tests/screen.test.js` against a small in-memory blocklist. Add a test whenever you fix a false
positive or a missed case.
