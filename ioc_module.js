'use strict';

const ProcessModelRepository = require('./dist/commonjs/index').ProcessModelRepository;

function registerInContainer(container) {

  container.register('ProcessModelRepository', ProcessModelRepository)
    .configure('process_engine:process_model_repository')
    .singleton();
}

module.exports.registerInContainer = registerInContainer;
