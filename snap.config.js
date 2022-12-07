var insert = require('insert-module-globals');


function inserter (file) {

  const inserterThing = insert(file);
  return inserterThing;
}

module.exports = {
  cliOptions: {
    src: './src/index.ts',
    port: 8080,
  },
  /*
  bundlerCustomizer: (bundler) => {
    return bundler.transform(inserter, {global:true})
  },
  */
};
