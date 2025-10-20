/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('commands', (table) => {
    table.string('id').primary();
    table.string('computer_id').references('id').inTable('computers').onDelete('CASCADE');
    table.string('action').notNullable(); // create_user, enable_rdp, install_software, etc.
    table.json('parameters'); // Store command parameters as JSON
    table.string('status').defaultTo('pending'); // pending, executing, completed, failed
    table.text('result'); // Command execution result
    table.text('error'); // Error message if failed
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('executed_at'); // When command was executed
    table.timestamp('completed_at'); // When command was completed
  });

  // Create index for better performance
  await knex.schema.alterTable('commands', (table) => {
    table.index(['computer_id', 'status']);
    table.index(['status', 'created_at']);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable('commands');
}
