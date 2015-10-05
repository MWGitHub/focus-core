
exports.up = function(knex, Promise) {
    return knex.schema.createTable('project_permissions', function(table) {
        table.increments('id').notNullable().primary();
        table.string('role', 300).notNullable();
        table.integer('user_id').notNullable().references('users.id');
        table.integer('project_id').notNullable().references('projects.id');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('project_permissions');
};
