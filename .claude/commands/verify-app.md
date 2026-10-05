---
description: Run the full test suite serially to verify the server and all API endpoints, fixing failures until everything passes
allowed-tools: Bash(npm test:*), Bash(npx jest:*), Read, Edit
---

Run the full verification suite for this project. Use this after any significant change.

The test suite uses Jest and supertest and calls every API endpoint directly against an in-memory database. If all tests pass, the server and all endpoints are working correctly.

Follow these steps in order:

1. Run `npm test -- --runInBand` to run the whole test suite serially.
2. If every test passes, go to step 5.
3. If any test fails, read the failure output and fix the **implementation** (the source code), not the test. Don't change a test's expected status code, error message or response body to make it pass. If you believe a test itself is wrong, stop and tell me why instead of editing it.
4. Run `npm test -- --runInBand` again. Repeat steps 3–4 until all tests pass. If the same failure is still there after three fix attempts, stop and report it.
5. Report the result clearly, in one of these two forms:
   - **All tests passing:** the number of test suites and tests that passed, and a statement that all endpoints are verified. If you fixed anything, list each fix with the file and a one-line reason.
   - **Failures remaining:** for each failing test, give the test file, the test name, the expected vs. received result, and what needs to be addressed.

$ARGUMENTS
