export function requiredEvidencePublisherCount(publishing: boolean, configuredMinimum: number): number {
  const minimum = Number.isFinite(configuredMinimum) && configuredMinimum > 0
    ? Math.floor(configuredMinimum)
    : 3;
  return publishing ? Math.max(5, minimum) : 2;
}
