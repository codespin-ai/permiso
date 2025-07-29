export default {
  client: 'postgresql',
  connection: {
    host: process.env.PERMISO_DB_HOST || 'localhost',
    port: parseInt(process.env.PERMISO_DB_PORT || '5432'),
    database: process.env.PERMISO_DB_NAME || 'permiso',
    user: process.env.PERMISO_DB_USER || 'postgres',
    password: process.env.PERMISO_DB_PASSWORD || 'postgres'
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations'
  }
};