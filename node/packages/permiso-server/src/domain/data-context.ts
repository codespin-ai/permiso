import type { Repositories } from "../repositories/interfaces/index.js";

export type DataContext = {
  repos: Repositories;
  orgId: string;
};
