import { resetRateLimits } from "./rate-limits";

export default async function globalSetup() {
  await resetRateLimits();
}
