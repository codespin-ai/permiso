import { baseConfig } from '../../knexfile.js';

// Test database configuration - simplified for testing
export default {
  ...baseConfig,
  connection: {
    host: process.env.PERMISO_TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.PERMISO_TEST_DB_PORT || '5432'),
    database: process.env.PERMISO_TEST_DB_NAME || 'permiso_test',
    user: process.env.PERMISO_TEST_DB_USER || 'postgres',
    password: process.env.PERMISO_TEST_DB_PASSWORD || 'postgres'
  },
  migrations: {
    ...baseConfig.migrations,
    directory: '../permiso/migrations'
  }
};