export type WeatherTileId =
  | 'temperature'
  | 'humidity'
  | 'wind'
  | 'pressure'
  | 'rain'
  | 'solar'
  | 'indoor'
  | 'thw'
  | 'thsw'
  | 'tempBarChart'
  | 'sunTimes'
  | 'forecast'
  | 'moon'
  | 'windRose';

const TILE_METRIC_REQUIREMENTS: Partial<Record<WeatherTileId, string[]>> = {
  temperature: ['temp_out'],
  humidity: ['hum_out', 'dew_point'],
  wind: ['wind_speed_10_min_avg', 'wind_dir', 'wind_gust_10_min'],
  pressure: ['bar'],
  rain: ['rain_day_mm', 'rain_rate_mm', 'et_day'],
  solar: ['solar_rad'],
  indoor: ['temp_in', 'hum_in'],
  thw: ['thw_index'],
  thsw: ['thsw_index'],
  tempBarChart: ['temp_out', 'temp_in', 'dew_point'],
};

const ALWAYS_VISIBLE_TILES: Set<WeatherTileId> = new Set([
  'sunTimes',
  'forecast',
  'moon',
  'windRose',
]);

export function isTileVisible(tileId: WeatherTileId, available: Set<string>): boolean {
  if (ALWAYS_VISIBLE_TILES.has(tileId)) {
    return true;
  }
  const required = TILE_METRIC_REQUIREMENTS[tileId];
  if (!required) {
    return false;
  }
  return required.some(metric => available.has(metric));
}
