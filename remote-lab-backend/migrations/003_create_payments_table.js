/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('payments', (table) => {
    table.string('id').primary();
    table.string('order_code').notNullable().unique();
    table.string('email').notNullable();
    table.string('full_name');
    table.string('phone');
    table.string('course_id');
    table.decimal('amount', 10, 2).notNullable();
    table.string('status').defaultTo('pending');
    table.string('password');
    table.string('payment_method');
    table.json('payos_response');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable('payments');
}
