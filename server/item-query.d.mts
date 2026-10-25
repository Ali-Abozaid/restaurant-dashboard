export function queryItems(
  items: unknown[],
  query: object,
  branchRestaurantIds: Map<string, string>,
): { items: { id: string }[]; total: number };
