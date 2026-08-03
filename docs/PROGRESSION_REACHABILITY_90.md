# Progression Reachability 90

## thresholds

| milestone | required | available before gate | result |
|---|---:|---:|---|
| 25% | 5/18 | normal village/pond sources | reachable |
| 50% | 9/18 | normal sources | reachable; harbor opens |
| 75% | 14/18 | normal + harbor + bridge islet | reachable before night garden |
| 100% | 18/18 | night garden + remaining fish | finite |

Fish selection already uses spot, day, time, catch count, discovery state, weight, and deterministic ordering. Existing release E2E reached 18/18 from empty save with functional assistance; this is not reclassified as a normal-speed journey.

## fixed in this pass

- sanitize now derives 25/50/75 milestones from migrated collectionCounts and unions them with saved milestones.
- migration is idempotent and does not award lumen a second time.
- hint purchase excludes discovered, previously hinted, and currently gated entries.
- when no reachable new hint exists, purchase fails without charging.
- resident talk uses the same event path as daily talk and rewards the completed daily once.
- after 100%, objective copy switches to friendship/daily continuation instead of asking for nonexistent entries.

## tests

New regression tests cover old save milestone reconstruction, repeated sanitize, no duplicate hint charge, talk completion exactly once, and easy-mode default. Unit suite: 83/83 passed.

## remaining uncertainty

Any purchase-order property test across all permutations and a real-time 30〜45 minute normal Journey remain absent. Existing full-release E2E uses test support, so it proves state reachability, not ordinary child play duration.
