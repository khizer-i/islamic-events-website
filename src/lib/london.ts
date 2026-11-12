/**
 * London rolls up into one city on the site.
 *
 * The bot stores whatever the poster printed ("Ilford", "Palmers Green",
 * "Mile End"), which is the more useful fact, so the data is left alone. The
 * site files every London area under London for the city list, city pages and
 * filters, and keeps the area itself for the event's location line
 * ("MCEC Mosque, Palmers Green, London").
 *
 * Exact names only. Places that share a name with somewhere outside London
 * (Richmond, Kingston, Woodford) are listed only in their unambiguous form.
 */

import { slugifyText } from "./event-format";

export const LONDON = "London";

const AREAS = [
  // The 32 boroughs
  "Barking and Dagenham", "Barnet", "Bexley", "Brent", "Bromley", "Camden", "Croydon",
  "Ealing", "Enfield", "Greenwich", "Hackney", "Hammersmith and Fulham", "Haringey",
  "Harrow", "Havering", "Hillingdon", "Hounslow", "Islington", "Kensington and Chelsea",
  "Kingston upon Thames", "Lambeth", "Lewisham", "Merton", "Newham", "Redbridge",
  "Richmond upon Thames", "Southwark", "Sutton", "Tower Hamlets", "Waltham Forest",
  "Wandsworth", "Westminster", "City of London",
  // East
  "Barking", "Dagenham", "Ilford", "Goodmayes", "Seven Kings", "Gants Hill", "Newbury Park",
  "Barkingside", "Chadwell Heath", "Romford", "Hornchurch", "Upminster", "Rainham",
  "Walthamstow", "Leyton", "Leytonstone", "Chingford", "Woodford Green", "South Woodford",
  "Wanstead", "Stratford", "East Ham", "West Ham", "Forest Gate", "Manor Park", "Plaistow",
  "Upton Park", "Canning Town", "Beckton", "Poplar", "Bow", "Mile End", "Whitechapel",
  "Bethnal Green", "Stepney", "Shadwell", "Limehouse", "Aldgate", "Shoreditch", "Hoxton",
  "Dalston", "Stoke Newington", "Stamford Hill", "Clapton", "Homerton",
  // North
  "Tottenham", "Wood Green", "Edmonton", "Palmers Green", "Southgate", "Winchmore Hill",
  "Ponders End", "Finchley", "Hendon", "Golders Green", "Colindale", "Edgware", "Mill Hill",
  "Holloway", "Finsbury Park", "Archway", "Highbury", "Kentish Town", "Camden Town",
  // North West and West
  "Cricklewood", "Kilburn", "Willesden", "Harlesden", "Neasden", "Wembley", "Kingsbury",
  "Alperton", "Sudbury", "Stanmore", "Wealdstone", "Pinner", "Ruislip", "Northwood",
  "Uxbridge", "Hayes", "Southall", "Northolt", "Greenford", "Hanwell", "Perivale", "Acton",
  "Chiswick", "Brentford", "Isleworth", "Feltham", "Twickenham", "Shepherd's Bush",
  "Hammersmith", "Fulham", "Kensington", "Chelsea", "Notting Hill", "Paddington",
  "Marylebone", "Edgware Road", "Regent's Park", "Euston", "King's Cross",
  // South
  "Brixton", "Streatham", "Tooting", "Balham", "Clapham", "Stockwell", "Vauxhall",
  "Peckham", "Camberwell", "Bermondsey", "Elephant and Castle", "Walworth", "Deptford",
  "New Cross", "Catford", "Eltham", "Woolwich", "Plumstead", "Thamesmead", "Abbey Wood",
  "Charlton", "Mitcham", "Morden", "Wimbledon", "Thornton Heath", "Norbury", "Purley",
  "Carshalton", "Wallington", "Cheam", "Surbiton", "Bexleyheath", "Erith", "Sidcup",
  "Orpington", "Beckenham", "Penge",
  // How posters describe it
  "Greater London", "Central London", "North London", "South London", "East London",
  "West London", "North West London", "North East London", "South West London",
  "South East London",
];

const BY_KEY = new Map(AREAS.map((a) => [a.toLowerCase(), a]));
const SLUGS = new Set(AREAS.map((a) => slugifyText(a)));

/**
 * For a city as stored, the London area it names, or null if it is not in
 * London. "London" itself (and "London E7" and the like) gives "" : London,
 * with no separate area to show.
 */
export function londonArea(city: string | null | undefined): string | null {
  if (!city) return null;
  const key = city.trim().replace(/\s+/g, " ").toLowerCase();
  if (/^london\b/.test(key)) return "";
  const area = BY_KEY.get(key);
  if (area === undefined) return null;
  return /\blondon\b/i.test(area) ? "" : area;
}

/** True for the slug of a London area's old city page, such as "palmers-green". */
export function isLondonAreaSlug(slug: string): boolean {
  return slug !== slugifyText(LONDON) && SLUGS.has(slug);
}
