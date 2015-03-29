'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var vaults = require('../../app/controllers/vaults.server.controller');

	// Vaults Routes
	app.route('/vaults')
		.get(users.requiresLogin, vaults.list)
		.post(users.requiresLogin, vaults.create);
	app.route('/vaults/:vaultId')
		.get(users.requiresLogin, vaults.read)
		.put(users.requiresLogin, vaults.hasAuthorization, vaults.update)
		.delete(users.requiresLogin, vaults.hasAuthorization, vaults.delete);

	// Tracker Vaults Routes
	app.route('/trackervaults')
		.get(users.requiresLogin, vaults.list)
		.post(users.requiresLogin, vaults.create);
	app.route('/trackervaults/:trackerId')
		.get(users.requiresLogin, vaults.read)
		.put(users.requiresLogin, vaults.hasAuthorization, vaults.update)
		.delete(users.requiresLogin, vaults.hasAuthorization, vaults.delete);

	// Finish by binding the Vault middleware
	app.param('vaultId', vaults.vaultByID);
};
