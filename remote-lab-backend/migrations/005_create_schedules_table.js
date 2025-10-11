/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('schedules', (table) => {
    table.string('id').primary();
    table.string('email').notNullable();
    table.string('user_name');
    table.string('password');
    table.timestamp('start_time').notNullable();
    table.timestamp('end_time').notNullable();
    table.string('status').defaultTo('pending');
    table.string('computer_id');
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Foreign key constraint
    table.foreign('computer_id').references('id').inTable('computers');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable('schedules');
}
