# Accessibility Features

This document outlines the comprehensive accessibility features implemented in the Ghee Code Visualization application to ensure an inclusive experience for all users, including those using assistive technologies.

## Overview

The application follows WCAG 2.1 AA guidelines and implements a wide range of accessibility features including keyboard navigation, screen reader support, high contrast mode, reduced motion preferences, and comprehensive ARIA labeling.

## Core Accessibility Features

### 1. Keyboard Navigation

**Full keyboard accessibility** is provided throughout the application:

- **Tab Navigation**: All interactive elements are keyboard accessible using Tab/Shift+Tab
- **Arrow Key Navigation**: Diagram nodes and menu items support arrow key navigation
- **Enter/Space Activation**: All buttons and interactive elements respond to Enter and Space keys
- **Escape Key**: Closes modals, menus, and other overlay components
- **Home/End Keys**: Navigate to first/last items in lists and menus

**Implementation Details:**

- Roving tabindex management for complex components
- Focus trapping in modals and menus
- Logical tab order throughout the interface
- Visual focus indicators with high contrast outlines

### 2. Screen Reader Support

**Comprehensive screen reader compatibility** with proper semantic markup:

- **ARIA Labels**: All interactive elements have descriptive labels
- **ARIA Descriptions**: Complex elements include detailed descriptions
- **ARIA Live Regions**: Dynamic content changes are announced
- **Semantic HTML**: Proper use of headings, landmarks, and form elements
- **Alternative Text**: All images and icons have meaningful alt text

**Screen Reader Features:**

- Diagram structure announced as navigable tree
- Code pattern explanations in plain language
- Status updates for processing and errors
- Contextual help and instructions

### 3. High Contrast Mode

**Enhanced visual accessibility** with customizable contrast:

- **Toggle Control**: Easy-to-access high contrast mode toggle
- **System Detection**: Automatically detects system high contrast preferences
- **Enhanced Colors**: Black/white color scheme with blue accents
- **Border Enhancement**: Increased border visibility for all elements
- **Focus Indicators**: High contrast focus outlines

**Visual Enhancements:**

- 3px solid borders on all interactive elements
- High contrast color palette (black, white, blue)
- Enhanced diagram node and edge visibility
- Improved text contrast ratios (minimum 7:1)

### 4. Reduced Motion Support

**Motion sensitivity accommodation**:

- **System Detection**: Respects `prefers-reduced-motion` system setting
- **Manual Toggle**: User can manually enable/disable animations
- **Animation Reduction**: Minimizes or eliminates animations and transitions
- **Scroll Behavior**: Disables smooth scrolling when enabled

**Affected Elements:**

- Diagram animations and transitions
- Loading indicators
- Hover effects and state changes
- Modal and menu animations

### 5. Font Size Customization

**Flexible text sizing** for improved readability:

- **Size Range**: 80% to 200% of default size
- **Incremental Control**: Fine-grained adjustment with +/- buttons
- **Reset Option**: Quick return to default size
- **Persistent Settings**: Preferences saved across sessions
- **Responsive Design**: Layout adapts to different font sizes

### 6. Accessibility Menu

**Centralized accessibility controls**:

- **Settings Panel**: Dedicated accessibility settings menu
- **Quick Access**: Accessible via keyboard shortcut and button
- **Visual Indicators**: Clear on/off states for all settings
- **Help Text**: Explanatory text for each accessibility feature
- **Keyboard Navigation**: Full keyboard support within the menu

## Component-Specific Accessibility

### Code Input Component

- **Large Text Area**: Generous input area with clear labeling
- **Syntax Validation**: Real-time feedback on code syntax
- **Error Announcements**: Screen reader announcements for errors
- **Loading States**: Clear indication of processing status
- **Cancel Functionality**: Ability to cancel long-running operations

### Interactive Diagram

- **Node Navigation**: Keyboard navigation between diagram nodes
- **Node Details**: Accessible modal dialogs for node information
- **Edge Information**: Screen reader accessible edge descriptions
- **Zoom Controls**: Keyboard accessible zoom and pan controls
- **Alternative Views**: Text-based representation of diagram structure

### Tooltips and Help

- **ARIA Describedby**: Proper association with trigger elements
- **Keyboard Activation**: Tooltips accessible via keyboard
- **Persistent Display**: Option to keep tooltips visible
- **Plain Language**: Simple, non-technical explanations
- **Contextual Help**: Relevant information for each element

### Modals and Dialogs

- **Focus Management**: Automatic focus to first interactive element
- **Focus Trapping**: Tab navigation contained within modal
- **Escape Handling**: Close modal with Escape key
- **Background Interaction**: Prevents interaction with background content
- **Return Focus**: Focus returns to trigger element on close

## Technical Implementation

### Accessibility Context

The application uses a React Context provider (`AccessibilityProvider`) to manage accessibility preferences and state across all components.

### Keyboard Navigation Utilities

- `keyboardNavigation.ts`: Utilities for focus management and keyboard handling
- `RovingTabindexManager`: Class for managing complex keyboard navigation
- Arrow key navigation helpers for lists and grids

### Accessibility Validation

- `accessibilityValidation.ts`: Runtime accessibility checking
- Color contrast validation
- ARIA attribute validation
- Keyboard navigation testing
- Screen reader compatibility checks

### CSS Accessibility Classes

- `.high-contrast`: High contrast mode styles
- `.reduced-motion`: Reduced motion preferences
- `.keyboard-navigation`: Enhanced focus indicators
- `.sr-only`: Screen reader only content
- `.skip-link`: Skip navigation links

## Testing and Validation

### Automated Testing

- **Unit Tests**: Component-level accessibility testing
- **Integration Tests**: Full user journey accessibility validation
- **ARIA Testing**: Automated ARIA attribute validation
- **Keyboard Testing**: Automated keyboard navigation testing
- **Color Contrast**: Automated contrast ratio validation

### Manual Testing

- **Screen Reader Testing**: Tested with NVDA, JAWS, and VoiceOver
- **Keyboard Only**: Full application testing without mouse
- **High Contrast**: Visual validation in high contrast mode
- **Zoom Testing**: Layout testing at 200% zoom level
- **Mobile Accessibility**: Touch and voice navigation testing

## Browser and Assistive Technology Support

### Supported Screen Readers

- **NVDA** (Windows) - Full support
- **JAWS** (Windows) - Full support
- **VoiceOver** (macOS/iOS) - Full support
- **TalkBack** (Android) - Basic support
- **Dragon NaturallySpeaking** - Voice navigation support

### Browser Compatibility

- **Chrome/Edge**: Full accessibility feature support
- **Firefox**: Full accessibility feature support
- **Safari**: Full accessibility feature support
- **Mobile Browsers**: Touch accessibility support

## Usage Guidelines

### For Users with Visual Impairments

1. **Enable Screen Reader**: The application works with all major screen readers
2. **High Contrast Mode**: Toggle via accessibility menu or use system settings
3. **Font Size**: Adjust text size using the accessibility menu controls
4. **Keyboard Navigation**: Use Tab, Arrow keys, Enter, and Escape for navigation

### For Users with Motor Impairments

1. **Keyboard Only**: Full functionality available via keyboard
2. **Large Click Targets**: All interactive elements meet minimum size requirements
3. **Reduced Motion**: Enable to minimize animations and transitions
4. **Voice Control**: Compatible with voice navigation software

### For Users with Cognitive Impairments

1. **Simple Language**: Explanations use plain, non-technical language
2. **Clear Structure**: Logical heading hierarchy and navigation
3. **Error Prevention**: Clear validation and error messages
4. **Consistent Interface**: Predictable layout and interaction patterns

## Accessibility Shortcuts

- **Alt + A**: Open accessibility menu
- **Tab**: Navigate forward through interactive elements
- **Shift + Tab**: Navigate backward through interactive elements
- **Enter/Space**: Activate buttons and links
- **Escape**: Close modals, menus, and overlays
- **Arrow Keys**: Navigate within lists and diagrams
- **Home/End**: Jump to first/last item in lists

## Reporting Accessibility Issues

If you encounter any accessibility barriers while using this application, please report them by:

1. **GitHub Issues**: Create an issue with the "accessibility" label
2. **Email**: Contact the development team with detailed information
3. **Include Details**: Browser, assistive technology, and steps to reproduce

## Compliance and Standards

This application strives to meet:

- **WCAG 2.1 Level AA**: Web Content Accessibility Guidelines
- **Section 508**: U.S. Federal accessibility requirements
- **ADA Compliance**: Americans with Disabilities Act standards
- **EN 301 549**: European accessibility standard

## Future Enhancements

Planned accessibility improvements include:

- **Voice Commands**: Voice-controlled diagram navigation
- **Braille Support**: Enhanced braille display compatibility
- **Cognitive Aids**: Additional cognitive accessibility features
- **Mobile Enhancements**: Improved mobile accessibility
- **Internationalization**: Multi-language accessibility support

---

_This document is regularly updated to reflect the current state of accessibility features. Last updated: [Current Date]_
