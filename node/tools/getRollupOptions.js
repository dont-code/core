function getRollupOptions(/** @type {import('rollup').RollupOptions} */ options) {
  // Following options are overridden:
  // - `sourcemap` to enable sourcemaps
  if (Array.isArray(options.output)) {
    options.output.forEach(o => {
      o.sourcemap = true;
    });
  } else {
    /*console.log("Config before:", options.output);
    options.output = [{
      ...options.output,
      format:"umd",
      // file: options.output.dir+'/index.js',
      sourcemap: true,
    },
      {
        ...options.output,
        format:"es",
        //file: options.output.dir+'/index.mjs',
        sourcemap: true,
        entryFileNames: '[name].mjs',
        chunkFileNames: '[name].mjs',
      }];*/
      options.output.sourcemap=true;
  }
//  console.log("Config after:", options.output);

  return options;
}

module.exports = getRollupOptions;
