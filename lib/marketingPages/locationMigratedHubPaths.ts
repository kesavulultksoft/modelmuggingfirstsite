/**
 * Location hub routes that always render `MigratedArticlePage` (legacy marketing copy),
 * optionally merging the hero from Sanity when a CMS document exists for the same path.
 */
export const LOCATION_MIGRATED_HUB_PATH_SET = new Set<string>([
  'california-self-defense-training-locations',
  'new-york-city-self-defense-classes-for-women',
  'san-francisco-bay-area-self-defense-classes-for-women',
  'los-angeles-self-defense',
  'san-diego-self-defense-classes-for-women',
  'seattle-tacoma-self-defense-classes-for-women',
  'boston-self-defense-classes-for-women',
  'philadelphia-self-defense-classes-for-women',
  'atlanta-self-defense-classes-for-women',
  'dallas-fort-worth-self-defense-classes-for-women',
  'colorado-denver-self-defense-classes-for-women',
  'las-vegas-self-defense-classes-for-women',
  'las-vegas-self-defense-classes',
  'hawaii-self-defense-classes-for-women',
  'phoenix-tucson-self-defense-classes',
  'el-paso-self-defense-classes-for-women',
  'ventura-self-defense-classes-for-women',
  'santa-barbara-self-defense-classes-for-women',
  'san-luis-obispo-self-defense-classes-for-women',
  'gewaltabwehrtraining-munchen',
  'gewaltabwehrtraining-koln',
])

export function isLocationMigratedHubPath(path: string): boolean {
  return LOCATION_MIGRATED_HUB_PATH_SET.has(path)
}
