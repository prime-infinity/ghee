# Ghee Code Visualizer

Transform your JavaScript and TypeScript code into interactive visual diagrams. Understand patterns, flows, and relationships in your code at a glance.

## Overview

Ghee is a powerful code visualization tool that analyzes JavaScript and TypeScript code to automatically detect common patterns and generate interactive flow diagrams. It helps developers understand code structure, identify patterns like counters, API calls, and database operations, and visualize error handling paths.

## Features

### 🎯 Pattern Recognition

- **Counter Patterns**: Detects useState + onClick combinations
- **API Call Patterns**: Identifies fetch/axios calls with success/error handling
- **Database Patterns**: Recognizes SQL operations and database connections
- **React Patterns**: Understands hooks, lifecycle methods, and component relationships

### 📊 Interactive Visualizations

- **Flow Diagrams**: Visual representation of code execution paths
- **Interactive Nodes**: Click on diagram elements for detailed information
- **Error Path Visualization**: Clear visualization of error handling flows
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices

### ♿ Accessibility First

- **WCAG 2.1 AA Compliant**: Full accessibility support
- **Keyboard Navigation**: Complete keyboard accessibility
- **Screen Reader Support**: Comprehensive ARIA labeling and descriptions
- **High Contrast Mode**: Enhanced visual accessibility
- **Reduced Motion**: Respects motion sensitivity preferences
- **Font Size Customization**: Adjustable text sizing (80%-200%)

### ⚡ Performance Optimized

- **Progressive Loading**: Real-time progress indicators
- **Complexity Analysis**: Automatic code complexity assessment
- **Cancellable Operations**: Ability to cancel long-running processes
- **Performance Metrics**: Built-in performance monitoring
- **Optimized Rendering**: Efficient diagram rendering with ReactFlow

### 🛠️ Developer Experience

- **TypeScript Support**: Full TypeScript and JavaScript support
- **Real-time Validation**: Instant feedback on code syntax
- **Error Handling**: Comprehensive error reporting with suggestions
- **Examples & Guides**: Built-in examples and usage guides
- **Simple Explanations**: Plain language explanations of code patterns

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ghee

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

1. **Input Code**: Paste or type your JavaScript/TypeScript code in the input area
2. **Process**: Click "Visualize Code" to analyze and generate diagrams
3. **Explore**: Interact with the generated diagram to understand code patterns
4. **Learn**: Use tooltips and explanations to understand detected patterns

### Example Code Patterns

**Counter Pattern:**

```javascript
const [count, setCount] = useState(0);
const handleClick = () => setCount(count + 1);
```

**API Call Pattern:**

```javascript
const fetchData = async () => {
  try {
    const response = await fetch("/api/data");
    const data = await response.json();
    setData(data);
  } catch (error) {
    setError(error.message);
  }
};
```

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Testing
npm run test            # Run unit tests
npm run test:coverage   # Run tests with coverage
npm run test:e2e        # Run end-to-end tests
npm run test:e2e:ui     # Run E2E tests with UI
npm run test:all        # Run all tests

# Specialized Tests
npm run test:performance    # Performance benchmarks
npm run test:accessibility  # Accessibility compliance
npm run test:visual        # Visual regression tests

# Code Quality
npm run lint            # Run ESLint
```

### Project Structure

```
src/
├── components/         # React components
│   ├── accessibility/ # Accessibility-specific components
│   ├── CodeInputComponent.tsx
│   ├── InteractiveDiagramComponent.tsx
│   └── ...
├── contexts/          # React contexts
├── hooks/             # Custom React hooks
├── services/          # Business logic and services
│   ├── matchers/      # Pattern matching services
│   ├── CodeVisualizationService.ts
│   └── ErrorHandlerService.ts
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── __tests__/         # Unit and integration tests

tests/
├── e2e/               # End-to-end tests
├── data/              # Test data and fixtures
└── README.md          # Testing documentation
```

### Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Visualization**: ReactFlow for interactive diagrams
- **Code Analysis**: Babel Parser for AST generation
- **Testing**: Vitest (unit), Playwright (E2E)
- **Build Tool**: Vite
- **Icons**: Lucide React

## Testing

The project includes a comprehensive test suite covering:

- **Unit Tests**: Component and service testing
- **Integration Tests**: Full workflow testing
- **E2E Tests**: Complete user journey validation
- **Performance Tests**: Speed and responsiveness benchmarks
- **Accessibility Tests**: WCAG compliance verification
- **Visual Regression**: UI consistency validation

See [tests/README.md](tests/README.md) for detailed testing documentation.

## Accessibility

Ghee is built with accessibility as a core principle. Features include:

- Full keyboard navigation support
- Screen reader compatibility (NVDA, JAWS, VoiceOver)
- High contrast mode
- Customizable font sizes
- Reduced motion support
- ARIA labels and descriptions

See [ACCESSIBILITY.md](ACCESSIBILITY.md) for comprehensive accessibility documentation.

## Performance

The application is optimized for performance with:

- **Processing Benchmarks**:
  - Small code samples: < 3 seconds
  - Medium complexity: < 8 seconds
  - Large codebases: < 15 seconds
- **UI Responsiveness**: < 500ms interaction response
- **Progressive Loading**: Real-time progress indicators
- **Memory Efficiency**: Optimized for large code analysis

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm run test:all`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Maintain accessibility standards
- Write comprehensive tests
- Update documentation for new features
- Ensure performance benchmarks are met

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions, bug reports, or feature requests:

- Create an issue in the GitHub repository
- Check the [tests/README.md](tests/README.md) for testing guidance
- Review [ACCESSIBILITY.md](ACCESSIBILITY.md) for accessibility information

---

Built with ❤️ using React, TypeScript, and modern web technologies.
