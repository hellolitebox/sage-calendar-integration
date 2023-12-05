// this file has been obtained from https://gist.github.com/twolfson/c683693014fb29e33d3fa3af0e3be80b#file-tz-locales-json
import tzLocales from './tz-locales.json';

export function findTimeZoneByCountryCode(countryCode: string) {
  const localeData = tzLocales.find(
    (locale) => locale.countryCode === countryCode
  );
  return localeData ? localeData.locales[0].ianaTimezone : null;
}
