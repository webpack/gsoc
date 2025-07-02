# Testing webpack Code

Testing webpack code is different from testing typical web applications. Instead of testing user interfaces or API endpoints, you're testing build processes, file transformations, and bundle generation.

This guide shows you practical testing patterns using Node.js built-in test runner, with detailed explanations of what each part does.

## Why Test webpack Code?

When you build webpack plugins or loaders, your code runs during the build process and affects how other people's applications get bundled. Testing ensures:

- Your plugin works with different webpack configurations
- File transformations produce expected results
- Build processes complete successfully
- Error handling works correctly

## Basic Test Setup

Node.js 18+ includes a built-in test runner, so no extra dependencies needed! Here's the simplest possible test setup:

```javascript
// test/basic-test.js

// Import Node.js built-in testing tools
import { test, describe } from 'node:test';
import assert from 'node:assert';

// Import webpack itself
import webpack from 'webpack';

// Import Node.js path utilities
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Get current directory (needed in ES modules)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Group related tests together
describe('My First webpack Test', () => {

  // Define a single test case
  test('webpack compiles without errors', async () => {

    // Step 1: Create a simple webpack configuration
    const config = {
      mode: 'development',        // Don't minify, easier to debug
      entry: './fixtures/simple.js', // File to build from
      output: {
        path: path.join(__dirname, 'temp'),  // Where to put result
        filename: 'bundle.js'               // What to name result
      }
    };

    // Step 2: Run webpack with our configuration
    const stats = await runWebpack(config);

    // Step 3: Check that compilation succeeded
    assert.ok(!stats.hasErrors(), 'webpack should compile without errors');

    // Step 4: Verify that the output file was created
    const assets = stats.compilation.assets;
    assert.ok(assets['bundle.js'], 'Should create bundle.js file');
  });
});

// Helper function to run webpack and return a Promise
// This makes testing much easier since webpack's API uses callbacks
function runWebpack(config) {
  return new Promise((resolve, reject) => {
    // webpack() takes a config and a callback function
    webpack(config, (err, stats) => {
      if (err) {
        // Build tool error (like invalid config)
        reject(err);
      } else {
        // Normal completion (might still have compilation errors)
        resolve(stats);
      }
    });
  });
}
```

You'll also need a simple test fixture:

```javascript
// test/fixtures/simple.js

// This is the simplest possible entry file for testing
console.log('Hello from webpack test!');

// Export something so webpack has content to bundle
export default 'test-content';
```

## Testing Plugin Basics

Here's how to test a simple webpack plugin step by step:

```javascript
// test/plugin-test.js

import { test, describe } from 'node:test';
import assert from 'node:assert';
import webpack from 'webpack';

// Let's test this simple plugin that adds a text file to the build
class HelloPlugin {
  apply(compiler) {
    // Hook into webpack's compilation process
    compiler.hooks.emit.tap('HelloPlugin', (compilation) => {
      // Add a new file to the build output
      compilation.assets['hello.txt'] = {
        source: () => 'Hello from plugin!',
        size: () => 18
      };
    });
  }
}

describe('HelloPlugin Tests', () => {

  test('plugin adds hello.txt to build output', async () => {

    // Step 1: Create webpack config that uses our plugin
    const config = {
      mode: 'development',
      entry: './fixtures/simple.js',
      plugins: [
        new HelloPlugin()  // Add our plugin to the build
      ]
    };

    // Step 2: Run webpack
    const stats = await runWebpack(config);

    // Step 3: Make sure no errors occurred
    assert.ok(!stats.hasErrors(), 'Plugin should not cause errors');

    // Step 4: Check that our plugin added the expected file
    const assets = stats.compilation.assets;
    assert.ok(assets['hello.txt'], 'Plugin should add hello.txt file');

    // Step 5: Verify the file content is correct
    const content = assets['hello.txt'].source();
    assert.strictEqual(content, 'Hello from plugin!', 'File content should match');
  });

  test('plugin works with different webpack modes', async () => {

    // Test that our plugin works in production mode too
    const config = {
      mode: 'production',  // This enables minification and optimizations
      entry: './fixtures/simple.js',
      plugins: [new HelloPlugin()]
    };

    const stats = await runWebpack(config);

    // Even with optimizations, our plugin should still work
    assert.ok(!stats.hasErrors(), 'Plugin should work in production mode');
    assert.ok(stats.compilation.assets['hello.txt'], 'Should still create file in production');
  });
});

// Same helper function as before
function runWebpack(config) {
  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) reject(err);
      else resolve(stats);
    });
  });
}
```

## Testing Loaders Simply

Loaders transform files. Here's how to test a basic loader that converts text to uppercase:

```javascript
// test/loader-test.js

import { test, describe } from 'node:test';
import assert from 'node:assert';
import webpack from 'webpack';
import path from 'node:path';

// Simple loader that converts content to uppercase
function uppercaseLoader(source) {
  // 'source' is the file content as a string
  // Return the transformed content
  return source.toUpperCase();
}

describe('Uppercase Loader Tests', () => {

  test('loader converts text to uppercase', async () => {

    // Step 1: Create a test file with lowercase text
    // (You'd create test/fixtures/lowercase.txt with content: "hello world")

    // Step 2: Configure webpack to use our loader
    const config = {
      mode: 'development',
      entry: './fixtures/lowercase.txt',  // Process this file
      module: {
        rules: [{
          test: /\.txt$/,  // Apply to .txt files
          use: [{
            loader: path.resolve(__dirname, '../uppercase-loader.js')  // Our loader
          }]
        }]
      }
    };

    // Step 3: Run webpack
    const stats = await runWebpack(config);

    // Step 4: Check for errors
    assert.ok(!stats.hasErrors(), 'Loader should not cause errors');

    // Step 5: Find the processed module
    const modules = Array.from(stats.compilation.modules);
    const txtModule = modules.find(m => m.resource && m.resource.endsWith('.txt'));

    assert.ok(txtModule, 'Should find the processed .txt module');

    // The exact way to check transformed content depends on your loader
    // This is a simplified example
  });
});

function runWebpack(config) {
  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) reject(err);
      else resolve(stats);
    });
  });
}
```

## Testing Error Handling

Good plugins handle errors gracefully. Here's how to test error conditions:

```javascript
// test/error-handling-test.js

import { test, describe } from 'node:test';
import assert from 'node:assert';
import webpack from 'webpack';

// Plugin that can be configured to throw errors (for testing)
class TestErrorPlugin {
  constructor(options = {}) {
    this.shouldError = options.shouldError || false;
  }

  apply(compiler) {
    compiler.hooks.emit.tap('TestErrorPlugin', (compilation) => {
      if (this.shouldError) {
        // Add an error to the compilation
        compilation.errors.push(new Error('Plugin intentionally failed'));
      }
    });
  }
}

describe('Error Handling Tests', () => {

  test('webpack reports plugin errors correctly', async () => {

    // Step 1: Configure plugin to cause an error
    const config = {
      mode: 'development',
      entry: './fixtures/simple.js',
      plugins: [
        new TestErrorPlugin({ shouldError: true })  // Make it error
      ]
    };

    // Step 2: Run webpack (it will have errors)
    const stats = await runWebpack(config);

    // Step 3: Verify that errors were properly reported
    assert.ok(stats.hasErrors(), 'Should report errors when plugin fails');

    // Step 4: Check error details
    const errors = stats.compilation.errors;
    assert.ok(errors.length > 0, 'Should have at least one error');
    assert.match(errors[0].message, /intentionally failed/, 'Should report our custom error');
  });

  test('webpack handles missing entry files', async () => {

    // Step 1: Create config with non-existent entry file
    const config = {
      mode: 'development',
      entry: './does-not-exist.js'  // This file doesn't exist
    };

    // Step 2: Run webpack
    const stats = await runWebpack(config);

    // Step 3: Should have errors about missing file
    assert.ok(stats.hasErrors(), 'Should report error for missing entry file');

    const errors = stats.compilation.errors;
    const errorMessage = errors[0].message;
    assert.match(errorMessage, /Module not found/, 'Should report module not found error');
  });
});

function runWebpack(config) {
  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) reject(err);
      else resolve(stats);
    });
  });
}
```

## Debugging Test Failures

When tests fail, you need powerful debugging tools. Node.js provides excellent built-in debugging capabilities that connect directly to Chrome DevTools.

### Node.js Built-in Debugger (Recommended)

Node.js includes a built-in debugger that opens Chrome DevTools. This is the most powerful way to debug webpack tests:

```bash
# Debug a specific test file
node --inspect-brk --test test/my-test.js

# Debug all tests (they'll pause at the first test)
node --inspect-brk --test

# Debug with specific port
node --inspect-brk=9230 --test test/my-test.js
```

**Steps to use:**

1. Run the command above
2. Open Chrome and go to `chrome://inspect`
3. Click "Open dedicated DevTools for Node"
4. Your test will pause at the first line - set breakpoints and continue

### VS Code Debugging

For VS Code users, create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug webpack Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/node",
      "args": [
        "--test",
        "${workspaceFolder}/test/my-test.js"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Debug Current Test File",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/node",
      "args": [
        "--test",
        "${file}"
      ],
      "console": "integratedTerminal"
    }
  ]
}
```

### Adding Debug Information to Tests

You can also add helpful logging for when debugging isn't enough:

```javascript
// test/debugging-test.js

import { test } from 'node:test';
import assert from 'node:assert';
import webpack from 'webpack';

test('debug failing compilation', async () => {
  const config = {
    mode: 'development',
    entry: './fixtures/simple.js'
  };

  const stats = await runWebpack(config);

  // Add a debugger statement to pause execution
  debugger; // Execution will pause here when using --inspect-brk

  // Log compilation details when needed
  if (stats.hasErrors() || process.env.DEBUG) {
    logCompilationDetails(stats);
  }

  assert.ok(!stats.hasErrors(), 'Should compile without errors');
});

function logCompilationDetails(stats) {
  console.log('\n=== COMPILATION DEBUG INFO ===');

  if (stats.hasErrors()) {
    console.log('ERRORS:');
    stats.compilation.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.message}`);
      if (error.stack) console.log(`     Stack: ${error.stack}`);
    });
  }

  if (stats.hasWarnings()) {
    console.log('WARNINGS:');
    stats.compilation.warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning.message}`);
    });
  }

  console.log(`Build time: ${stats.endTime - stats.startTime}ms`);
  console.log(`Modules: ${stats.compilation.modules.size}`);
  console.log(`Assets: ${Object.keys(stats.compilation.assets).length}`);

  // Log asset details
  Object.entries(stats.compilation.assets).forEach(([name, asset]) => {
    console.log(`  ${name}: ${asset.size()} bytes`);
  });
}

function runWebpack(config) {
  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) reject(err);
      else resolve(stats);
    });
  });
}
```

### Additional Debugging Tools

**Node.js Inspector API**: For programmatic debugging, you can use Node's inspector module:

```javascript
import inspector from 'node:inspector';

// Enable debugging programmatically
if (!inspector.url()) {
  inspector.open(9229, 'localhost', true);
}

// Add breakpoint in code
inspector.Session.prototype.post('Debugger.setBreakpointByUrl', {
  lineNumber: 10,
  url: 'file:///path/to/test.js'
});
```

**Environment Variables**: Use debug flags to get more information:

```bash
# Enable more verbose webpack output
DEBUG=webpack* node --test test/my-test.js

# Node.js debug output
NODE_DEBUG=* node --test test/my-test.js

# Custom debug logging in your tests
DEBUG=1 node --test test/my-test.js
```

### Debugging Webpack-Specific Issues

For webpack compilation debugging, you can enable webpack's built-in debug features:

```javascript
const config = {
  mode: 'development',
  entry: './fixtures/simple.js',
  stats: 'verbose', // More detailed output
  infrastructureLogging: {
    level: 'verbose', // Enable webpack's internal logging
    debug: /webpack/
  }
};
```

These debugging tools are much more powerful than simple console logging and will help you understand exactly what's happening in your webpack tests. The Chrome DevTools integration provides the same debugging experience you're used to in the browser, but for Node.js code.

## Running Your Tests

To run these tests, use Node.js built-in test runner:

```bash
# Run all test files
node --test

# Run specific test file
node --test test/basic-test.js

# Run with more detailed output
node --test --verbose

# Run tests that match a pattern
node --test --test-name-pattern="plugin"
```

## Learning from webpack's Tests

webpack itself has extensive tests you can learn from. Look at these directories in the [webpack repository](https://github.com/webpack/webpack):

- `test/configCases/` - Tests different webpack configurations
- `test/statsCases/` - Tests webpack's output statistics
- `test/hotCases/` - Tests Hot Module Replacement
- `test/helpers/` - Utility functions for testing

Study these examples to see how the webpack team tests complex scenarios.

## Key Testing Principles

**Test real compilation processes** rather than mocking webpack internals. This catches integration issues that unit tests might miss.

**Use simple, focused test cases** that verify one thing at a time. Large complex tests are hard to debug when they fail.

**Always test error conditions** as well as success cases. Users depend on clear error messages when things go wrong.

**Add debugging output** when tests fail so you can understand what went wrong.

**Keep test fixtures simple** - use minimal entry files and configurations that focus on what you're testing.

The goal is creating tests that give you confidence your webpack plugins and loaders work correctly while being easy to understand and maintain.
