# Comprehensive Test Suite Documentation

This document describes the comprehensive test suite for the ghee code visualization application, covering all requirements and ensuring robust quality assurance.

## Test Structure

```
tests/
├── data/
│   └── testCodeSamples.ts          # Test data for various code patterns
├── e2e/
│   ├── userJourneys.spec.ts        # Complete user journey tests
│   ├── visualRegression.spec.ts    # Visual consistency tests
│   ├── performance.spec.ts         # Performance and speed tests
│   ├── accessibility.spec.ts       # Accessibility compliance tests
│   └── setup.ts                    # Test utilities and fixtures
└── README.md                       # This documentation
```

## Test Categories

### 1. End-to-End User Journey Tests (`userJourneys.spec.ts`)

**Purpose**: Validate complete user workflows and requirement compliance

**Coverage**:

- **Requirement 1**: Code input interface functionality
- **Requirement 2**: Code processing and AST parsing
- **Requirements 3-5**: Pattern recognition (counter, API, database)
- **Requirement 6**: Interactive diagram generation
- **Requirement 7**: Error path visualization
- **Requirement 8**: Responsive design
- **Requirement 9**: Simple explanations and tooltips
- **Requirements 10-11**: Language and React support
- **Requirement 12**: Performance and loading states
- **Requirement 13**: Error handling

**Key Test Scenarios**:

- Basic counter pattern visualization journey
- API call pattern with success/error paths
- Error handling for invalid code
- Responsive design across devices
- Keyboard navigation support
- Complex code pattern handling
- Operation cancellation

### 2. Visual Regression Tests (`visualRegression.spec.ts`)

**Purpose**: Ensure visual consistency across changes

**Coverage**:

- Diagram rendering consistency
- Icon and edge styling
- Tooltip appearance
- Loading state visuals
- Error message styling
- Responsive layout screenshots
- High contrast mode
- Focus indicators

**Test Scenarios**:

- Counter pattern diagram consistency
- API call pattern visualization
- Error handling visual elements
- Complex flow diagrams
- Mobile/tablet/desktop layouts
- Accessibility visual features

### 3. Performance Tests (`performance.spec.ts`)

**Purpose**: Validate processing speed and responsiveness

**Coverage**:

- **Requirement 12.1**: Loading indicators and performance
- **Requirement 12.2**: Cancellation functionality
- Code processing speed benchmarks
- UI responsiveness during operations
- Memory efficiency
- Large code sample handling

**Performance Benchmarks**:

- Small code: < 3 seconds
- Medium code: < 8 seconds
- Large code: < 15 seconds (with timeout protection)
- Interaction response: < 500ms
- Loading indicator: < 2 seconds

### 4. Accessibility Tests (`accessibility.spec.ts`)

**Purpose**: Ensure WCAG compliance and inclusive design

**Coverage**:

- **Requirement 8.1**: Keyboard navigation
- **Requirement 8.2**: ARIA labels and screen reader support
- **Requirement 8.3**: Alternative text for visual elements
- **Requirement 9.1-9.4**: Simple explanations and tooltips
- Focus management
- High contrast support
- Reduced motion preferences
- Voice control compatibility

**Accessibility Features Tested**:

- Full keyboard navigation
- Screen reader compatibility
- ARIA labels and descriptions
- Focus indicators
- High contrast mode
- Alternative text for icons
- Meaningful error messages

## Test Data

### Code Pattern Samples

The test suite includes comprehensive code samples covering:

1. **Counter Patterns**: Basic useState + onClick combinations
2. **API Call Patterns**: fetch/axios with error handling
3. **Database Patterns**: SQL operations and connections
4. **Error Handling**: try-catch blocks and error boundaries
5. **React Components**: Hooks, lifecycle, and prop flow
6. **Complex Combinations**: Multi-pattern code samples
7. **Edge Cases**: Empty code, syntax errors, large files

### Performance Test Cases

- **Small**: Simple counter pattern (~50 lines)
- **Medium**: Complex todo application (~200 lines)
- **Large**: Generated code with many components (~1000+ lines)
- **Many Components**: 20+ React components
- **Deep Nesting**: 5-level component hierarchy

## Running Tests

### Local Development

```bash
# Run all unit tests
npm run test

# Run unit tests with coverage
npm run test:coverage

# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific test categories
npm run test:performance
npm run test:accessibility
npm run test:visual

# Run complete test suite
npm run test:all
```

### Continuous Integration

The CI pipeline runs automatically on:

- Push to main/develop branches
- Pull requests
- Daily scheduled runs (2 AM UTC)

**CI Test Jobs**:

1. Unit Tests (with coverage)
2. Integration Tests
3. E2E Tests (Chrome, Firefox, Safari)
4. Performance Tests
5. Accessibility Tests
6. Visual Regression Tests
7. Mobile Device Tests
8. Security Tests

## Test Configuration

### Playwright Configuration

- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12
- **Retries**: 2 on CI, 0 locally
- **Timeout**: 30 seconds per test
- **Screenshots**: On failure
- **Traces**: On retry

### Performance Thresholds

```typescript
performance: {
  smallCodeMaxTime: 3000,    // 3 seconds
  mediumCodeMaxTime: 8000,   // 8 seconds
  largeCodeMaxTime: 15000,   // 15 seconds
  interactionMaxTime: 500,   // 500ms
  loadingMaxTime: 2000       // 2 seconds
}
```

### Visual Regression Settings

- **Threshold**: 0.2 (20% difference tolerance)
- **Animations**: Disabled for consistency
- **Mode**: CSS-based comparison

## Requirements Coverage Matrix

| Requirement                   | Unit Tests | Integration Tests | E2E Tests | Performance Tests | Accessibility Tests |
| ----------------------------- | ---------- | ----------------- | --------- | ----------------- | ------------------- |
| 1.1-1.4 (Code Input)          | ✅         | ✅                | ✅        | -                 | ✅                  |
| 2.1-2.4 (Code Processing)     | ✅         | ✅                | ✅        | ✅                | -                   |
| 3.1-3.3 (Counter Pattern)     | ✅         | ✅                | ✅        | -                 | -                   |
| 4.1-4.3 (API Pattern)         | ✅         | ✅                | ✅        | -                 | -                   |
| 5.1-5.3 (Database Pattern)    | ✅         | ✅                | ✅        | -                 | -                   |
| 6.1-6.5 (Diagram Generation)  | ✅         | ✅                | ✅        | ✅                | ✅                  |
| 7.1-7.4 (Error Paths)         | ✅         | ✅                | ✅        | -                 | -                   |
| 8.1-8.3 (Responsive Design)   | ✅         | -                 | ✅        | -                 | ✅                  |
| 9.1-9.4 (Simple Explanations) | ✅         | -                 | ✅        | -                 | ✅                  |
| 10.1-10.2 (JS/TS Support)     | ✅         | ✅                | ✅        | ✅                | -                   |
| 11.1-11.4 (React Support)     | ✅         | ✅                | ✅        | -                 | -                   |
| 12.1-12.2 (Performance)       | -          | -                 | ✅        | ✅                | -                   |
| 13.1-13.4 (Error Handling)    | ✅         | ✅                | ✅        | -                 | ✅                  |

## Test Maintenance

### Adding New Tests

1. **Pattern Recognition**: Add new code samples to `testCodeSamples.ts`
2. **User Journeys**: Extend `userJourneys.spec.ts` with new workflows
3. **Visual Elements**: Add screenshots to `visualRegression.spec.ts`
4. **Performance**: Update benchmarks in `performance.spec.ts`

### Updating Test Data

When adding new code patterns:

1. Add sample code to appropriate category in `testCodeSamples.ts`
2. Ensure code is valid and demonstrates the pattern clearly
3. Include both simple and complex examples
4. Add edge cases and error scenarios

### Visual Regression Updates

When UI changes are intentional:

1. Run tests locally to generate new screenshots
2. Review visual differences carefully
3. Update baseline images if changes are correct
4. Document visual changes in PR description

## Debugging Tests

### Common Issues

1. **Timing Issues**: Use `waitForSelector` and `waitForLoadState`
2. **Flaky Tests**: Add proper wait conditions and retries
3. **Visual Differences**: Check for animation completion
4. **Performance Variations**: Use relative thresholds, not absolute

### Debug Commands

```bash
# Run tests in debug mode
npx playwright test --debug

# Run specific test file
npx playwright test tests/e2e/userJourneys.spec.ts

# Run tests in headed mode
npx playwright test --headed

# Generate test report
npx playwright show-report
```

## Quality Gates

### Required for Merge

- All unit tests pass
- All integration tests pass
- All E2E tests pass
- Code coverage > 80%

### Warning Conditions

- Performance tests fail (review required)
- Accessibility tests fail (review required)
- Visual regression tests fail (review required)

### Monitoring

- Daily test runs monitor regression
- Performance metrics tracked over time
- Accessibility compliance verified continuously
- Visual consistency maintained across releases

## Contributing

When contributing to the test suite:

1. Follow existing test patterns and naming conventions
2. Ensure new tests cover specific requirements
3. Add appropriate test data for new features
4. Update documentation for new test categories
5. Verify tests pass locally before submitting PR

For questions about testing, refer to the project maintainers or create an issue in the repository.
