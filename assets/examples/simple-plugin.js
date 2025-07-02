/**
 * BundleAnalyzerPlugin - A modern webpack plugin example
 *
 * This plugin demonstrates key webpack plugin concepts:
 * - Modern JavaScript syntax (ES6+ features)
 * - Proper hook usage and registration
 * - Asset processing and generation
 * - Option validation and defaults
 * - JSON report generation
 *
 * Usage:
 * const BundleAnalyzerPlugin = require('./simple-plugin');
 *
 * module.exports = {
 *   plugins: [
 *     new BundleAnalyzerPlugin({
 *       outputFile: 'bundle-report.json',
 *       includeModules: true
 *     })
 *   ]
 * };
 */

class BundleAnalyzerPlugin {
  // Modern class field syntax for default options
  static defaultOptions = {
    outputFile: 'bundle-analysis.json',
    includeModules: true,
    includeAssets: true,
    generateSummary: true
  };

  constructor(options = {}) {
    // Merge user options with defaults using object spread
    this.options = { ...BundleAnalyzerPlugin.defaultOptions, ...options };
  }

  apply(compiler) {
    const pluginName = BundleAnalyzerPlugin.name;

    // Access webpack's utility classes from the compiler
    const { webpack } = compiler;
    const { Compilation } = webpack;
    const { RawSource } = webpack.sources;

    // Hook into the compilation to access assets and modules
    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {

      // Hook into the asset processing stage
      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          // Use the REPORT stage to ensure all other assets are processed first
          stage: Compilation.PROCESS_ASSETS_STAGE_REPORT
        },
        (assets) => {
          // Generate bundle analysis
          const analysis = this.analyzeBundle(compilation, assets);

          // Convert analysis to JSON
          const reportContent = JSON.stringify(analysis, null, 2);

          // Add the report as a compilation asset
          compilation.emitAsset(
            this.options.outputFile,
            new RawSource(reportContent)
          );
        }
      );
    });
  }

  analyzeBundle(compilation, assets) {
    const analysis = {
      timestamp: new Date().toISOString(),
      webpack: compilation.compiler.webpack.version
    };

    // Analyze assets if requested
    if (this.options.includeAssets) {
      analysis.assets = {};

      // Use Object.entries for modern iteration
      for (const [name, source] of Object.entries(assets)) {
        analysis.assets[name] = {
          size: source.size(),
          type: this.getAssetType(name)
        };
      }
    }

    // Analyze modules if requested
    if (this.options.includeModules) {
      analysis.modules = {};

      // Iterate over compilation modules
      for (const module of compilation.modules) {
        if (module.resource) {
          analysis.modules[module.resource] = {
            size: module.size(),
            type: this.getModuleType(module.resource),
            // Use spread operator to convert Set to Array
            chunks: [...module.chunksIterable].map(chunk => chunk.id)
          };
        }
      }
    }

    // Analyze chunks
    analysis.chunks = {};
    for (const chunk of compilation.chunks) {
      analysis.chunks[chunk.id] = {
        name: chunk.name,
        size: chunk.size(),
        modules: chunk.getNumberOfModules(),
        files: [...chunk.files] // Convert Set to Array
      };
    }

    // Generate summary if requested
    if (this.options.generateSummary) {
      analysis.summary = this.generateSummary(analysis);
    }

    return analysis;
  }

  generateSummary(analysis) {
    const summary = {
      totalAssets: 0,
      totalModules: 0,
      totalChunks: Object.keys(analysis.chunks).length,
      totalSize: 0
    };

    // Calculate totals using modern array methods
    if (analysis.assets) {
      const assetSizes = Object.values(analysis.assets).map(asset => asset.size);
      summary.totalAssets = Object.keys(analysis.assets).length;
      summary.totalSize = assetSizes.reduce((sum, size) => sum + size, 0);
    }

    if (analysis.modules) {
      summary.totalModules = Object.keys(analysis.modules).length;
    }

    return summary;
  }

  getAssetType(filename) {
    // Use optional chaining and nullish coalescing
    const ext = filename.split('.').pop()?.toLowerCase();

    // Modern Map-like object for type mapping
    const typeMap = {
      'js': 'javascript',
      'css': 'stylesheet',
      'html': 'document',
      'json': 'data',
      'png': 'image',
      'jpg': 'image',
      'jpeg': 'image',
      'gif': 'image',
      'svg': 'image',
      'woff': 'font',
      'woff2': 'font',
      'ttf': 'font',
      'eot': 'font'
    };

    return typeMap[ext] ?? 'unknown'; // Use nullish coalescing
  }

  getModuleType(resource) {
    const ext = resource.split('.').pop()?.toLowerCase();

    const typeMap = {
      'js': 'javascript',
      'jsx': 'react',
      'ts': 'typescript',
      'tsx': 'typescript-react',
      'css': 'stylesheet',
      'scss': 'sass',
      'sass': 'sass',
      'less': 'less',
      'json': 'data',
      'vue': 'vue-component'
    };

    return typeMap[ext] ?? 'unknown';
  }
}

// Export using modern syntax
module.exports = BundleAnalyzerPlugin;

// Additional export for ES6 modules
module.exports.BundleAnalyzerPlugin = BundleAnalyzerPlugin;
