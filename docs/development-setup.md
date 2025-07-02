# Getting Your Development Environment Ready

Setting up your development environment for webpack contribution is straightforward. This guide focuses on getting you up and running quickly with the essential tools you need, using GitHub CLI for a streamlined GitHub workflow.

## Prerequisites

Before diving in, make sure you have these tools installed:

**Node.js (Latest LTS)** - webpack requires modern Node.js. Download the latest LTS version from [nodejs.org](https://nodejs.org/) or use [nvm](https://github.com/nvm-sh/nvm) to manage multiple versions.

**GitHub CLI** - For seamless GitHub integration. See [GitHub CLI installation instructions](https://docs.github.com/en/github-cli/github-cli/about-github-cli#installing-github-cli).

**A good code editor** - [VS Code](https://code.visualstudio.com/) works great with webpack projects and has excellent debugging support.

Verify your setup:
```bash
node --version    # Should show the latest LTS version (currently v20.x.x or higher)
npm --version     # Should show 9.x.x or higher
gh --version      # Should show GitHub CLI version
```

### Authenticate with GitHub

First-time setup requires authentication:
```bash
gh auth login
```

Follow the prompts to authenticate with your GitHub account. This will allow you to fork repositories, create pull requests, and manage issues directly from the command line.

## Setting Up webpack Core

The fastest way to start contributing to webpack is to fork and clone using GitHub CLI:

```bash
# Fork and clone webpack in one command
gh repo fork webpack/webpack --clone=true

# Navigate to the cloned repository
cd webpack

# Install dependencies
npm install

# Build webpack
npm run build
```

That's it! GitHub CLI automatically:
- Forks the repository to your GitHub account
- Clones your fork locally
- Sets up proper remotes (`origin` for your fork, `upstream` for the original)

### Verify Your Setup

Run a simple test to make sure everything works:

```bash
npm test -- --testNamePattern="simple"
```

If this passes, you're ready to start making changes and contributing.

## Basic Development Workflow

Here's the streamlined workflow using GitHub CLI:

**1. Stay current with upstream changes:**
```bash
gh repo sync webpack/{repo} # Sync your fork with upstream
```

**2. Create a branch for your work:**
```bash
git switch -c fix/my-improvement
```

**3. Make your changes and test them:**
```bash
npm test # Run relevant tests
```

**4. Commit, push, and create a pull request:**
```bash
git add .
git commit -m "fix: improve error message clarity"
git push origin fix/my-improvement

# Create pull request directly from the command line
gh pr create --title "fix: improve error message clarity" --body "This PR improves error message clarity by..."
```

The GitHub CLI will open your browser to complete the pull request if needed, or you can add more details using command flags.

## Running Tests

webpack has different types of tests for different purposes:

```bash
# Run all tests (this takes a while)
npm test

# Run specific test categories
npm run test:unit        # Fast unit tests
npm run test:integration # Integration tests with real webpack configs
```

When working on a specific feature, run only the tests related to your changes to get faster feedback.



## Debugging Your Changes

### Using Node.js Debugger

To debug webpack compilation:

```bash
# Debug a specific webpack build
node --inspect-brk ./bin/webpack.js --config your-test-config.js
```

Then open Chrome and go to `chrome://inspect` to connect to the debugger.

### Using VS Code Debugging

VS Code can debug webpack directly. Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug webpack",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/bin/webpack.js",
      "args": ["--config", "webpack.config.js"],
      "console": "integratedTerminal"
    }
  ]
}
```

Now you can set breakpoints and debug webpack builds directly in VS Code.

### Analyzing Bundle Output

To understand what webpack generates:

```bash
# Generate detailed build statistics
webpack --profile --json > stats.json

# Analyze with webpack-bundle-analyzer
npx webpack-bundle-analyzer stats.json
```

This helps when working on optimization features or debugging bundle issues.

## Code Quality Tools

webpack uses several tools to maintain code quality:

```bash
# Check code formatting
npm run lint:code

# Fix formatting issues automatically
npm run fix
```

These checks run automatically in CI, so run them before submitting pull requests to catch issues early.

## Common Setup Issues

**"Cannot find module" errors** - Usually means you need to run `npm install` or `npm run build`

**Test failures** - Make sure you're on the latest main branch and have run `npm install` recently

**Memory issues** - Increase Node.js memory limit: `export NODE_OPTIONS="--max-old-space-size=8192"`

**Permission errors on macOS/Linux** - Fix npm permissions: `sudo chown -R $(whoami) ~/.npm`

**GitHub CLI authentication issues** - Re-run `gh auth login` and ensure you have proper repository permissions

## Working with webpack Configurations

When testing your changes, create simple webpack configurations in a test directory:

```javascript
// test-config.js
module.exports = {
  mode: 'development',
  entry: './test-entry.js',
  output: {
    filename: 'bundle.js',
    path: __dirname + '/dist'
  }
  // Add your plugin or configuration changes here
};
```
