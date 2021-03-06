
exports.up = function(knex, Promise) {
    return knex.schema.table('projects', function(table) {
        table.boolean('is_public').notNullable().defaultTo(false);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('projects', function(table) {
        table.dropColumn('is_public');
    })
};
