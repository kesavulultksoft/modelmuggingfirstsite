import { SAN_DIEGO_WORKSHOPS_ROUTE } from '@/lib/marketingPages/locationCity/sanDiegoCityPage'

/** City pages using the new location template (pilot rollout). */
export const LOCATION_CITY_PILOT_PATHS = new Set<string>([
  'san-diego-self-defense-classes-for-women',
  SAN_DIEGO_WORKSHOPS_ROUTE,
])

export function isLocationCityPilotPath(path: string): boolean {
  return LOCATION_CITY_PILOT_PATHS.has(path)
}
