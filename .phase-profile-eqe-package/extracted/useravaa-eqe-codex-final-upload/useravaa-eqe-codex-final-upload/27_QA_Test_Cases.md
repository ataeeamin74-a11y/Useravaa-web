# QA Test Cases

| ID | Test | Expected |
|---|---|---|
| QA-001 | Provider with eligible data opens dashboard | One active question shown |
| QA-002 | Missing required field | Dependent templates excluded |
| QA-003 | Replace question | Old replaced, new active |
| QA-004 | No replacement | Disabled/message |
| QA-005 | Skip | Suppressed until next week |
| QA-006 | Answer >700 | Block publish |
| QA-007 | No responsibility checkbox | Block publish |
| QA-008 | Valid publish | status published |
| QA-009 | Retract | status retracted |
| QA-010 | No published answers | section hidden |
| QA-011 | More than 3 published | latest 3 only |
| QA-012 | Social actions | not rendered |
