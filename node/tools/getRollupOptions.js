function getRollupOptions(/** @type {import('rollup').RollupOptions} */ options) {
  // Following options are overridden:
  // - `sourcemap` to enable sourcemaps

  if (Array.isArray(options.output)) {
    options.output.forEach(o => {
      o.sourcemap = true;
    });
  } else {
    options.output = {
      ...options.output,
      sourcemap: true,
    };
  }

  return options;
}

module.exports = getRollupOptions;
