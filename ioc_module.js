'use strict';

const ProcessDefinitionRepository = require('./dist/commonjs/index').ProcessDefinitionRepository;
const disposableDiscoveryTag = require('@essential-projects/bootstrapper_contracts').disposableDiscoveryTag;

function registerInContainer(container) {

  container.register('ProcessDefinitionRepository', ProcessDefinitionRepository)
    .dependencies('SequelizeConnectionManager')
    .configure('process_engine:process_model_repository')
    .tags(disposableDiscoveryTag)
    .singleton();
}

module.exports.registerInContainer = registerInContainer;
