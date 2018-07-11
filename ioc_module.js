'use strict';

const ProcessDefinitionRepository = require('./dist/commonjs/index').ProcessDefinitionRepository;

function registerInContainer(container) {

  container.register('ProcessDefinitionRepository', ProcessDefinitionRepository)
    .configure('process_engine:process_model_repository')
    .singleton();
}

module.exports.registerInContainer = registerInContainer;
