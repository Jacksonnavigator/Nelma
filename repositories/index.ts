import { env } from "../config/env";
import { apiRepositories } from "./api";
import type { AppRepositories } from "./contracts";
import { mockRepositories } from "./mock";

export const repositories: AppRepositories = env.useMocks ? mockRepositories : apiRepositories;
export type { AppRepositories } from "./contracts";
