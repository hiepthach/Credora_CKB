# Test Report

Test documentation for CKB Credential Registry.

## Files

| File | Description |
|------|-------------|
| [TEST_REPORT.md](./TEST_REPORT.md) | Detailed test results and coverage |

## Test Structure

```
tests/
├── setup.ts                 # Global test setup & mocks
└── unit/
    ├── ckb/
    │   └── config.test.ts  # Network config tests (13 tests)
    └── credentials/
        ├── encoder.test.ts   # W3C VC encoding tests (9 tests)
        ├── decoder.test.ts  # W3C VC decoding tests (22 tests)
        ├── batch.test.ts    # Batch issuance tests (14 tests)
        ├── cluster.test.ts  # Cluster validation tests (9 tests)
        ├── verifier.test.ts # Verification logic tests (11 tests)
    └── ui/
        ├── Button.test.tsx  # Button component tests (17 tests)
        ├── Badge.test.tsx   # Badge component tests (11 tests)
        ├── Card.test.tsx   # Card component tests (14 tests)
        └── Input.test.tsx   # Input component tests (18 tests)
```

## Summary

| Metric | Value |
|--------|-------|
| Total Test Files | 10 |
| Total Tests | 138 |
| Passed | 138 |
| Failed | 0 |

## Test Categories

| Category | Tests |
|----------|-------|
| UI Components | 60 |
| Credentials | 65 |
| CKB Config | 13 |
| **Total** | **138** |

## Run Tests

```bash
# Run all tests
npm test

# Run tests once
npm run test:run

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

## Status

✅ All tests passing
