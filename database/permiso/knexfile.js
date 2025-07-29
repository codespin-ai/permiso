import { createDbConfig } from '../../knexfile.js';

// Permiso database configuration
export default createDbConfig('permiso', {
  // Any permiso-specific overrides can go here
  // For example:
  // pool: {
  //   min: 5,
  //   max: 20
  // }
});