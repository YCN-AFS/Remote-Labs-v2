/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('computers', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('ip_address');
    table.integer('nat_port_winrm');
    table.integer('nat_port_rdp');
    table.string('status').defaultTo('available');
    table.text('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable('computers');
}
