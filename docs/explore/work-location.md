---
Work locations
---

# Work locations
## Or: “No, the federal government isn’t _just_ in Ottawa / Gatineau”

[TODO]
- orgs where their primary location isn't Ottawa / Gatineau
- orgs with lower-than-normal Ottawa / Gatineau % (i.e., even if they're first, they're not the only)

```js
Plot.plot({
  projection: {
    type: "conic-conformal",
    rotate: [100, -60],
    domain: canada_pts_geojson
  },
  marks: [Plot.geo(canada_pts_geojson)]
})
```

```js
const canada_pts_geojson_raw = FileAttachment("../data/canada-provinces-territories.json").json()
```

```js
function get_canada_pts_geojson() {
	const geo = structuredClone(canada_pts_geojson_raw);
	
	for (const feature of geo.features) {
		feature.properties = {
			prov: provincesAndTerritories.find(
				(d) => d.code === feature.properties.PRUID
			)
		};
	}
	
	return rewind(geo); // TODO: get a rewind function somehow lol
}

const canada_pts_geojson = get_canada_pts_geojson()
```

```js
display (canada_pts_geojson)
```

```js
// Source: https://observablehq.com/@nshiab/provinces-and-territories-labels
const provincesAndTerritories = [
  {
    full: { en: "Alberta", fr: "Alberta" },
    abbrev: { en: "Alta.", fr: "Alb." },
    code: "48",
    name: "AB"
  },
  {
    full: { en: "British Columbia", fr: "Colombie-Britannique" },
    abbrev: { en: "B.C.", fr: "C.-B." },
    code: "59",
    name: "BC"
  },
  {
    full: { en: "Saskatchewan", fr: "Saskatchewan" },
    abbrev: { en: "Sask.", fr: "Sask." },
    code: "47",
    name: "SK"
  },
  {
    full: { en: "Manitoba", fr: "Manitoba" },
    abbrev: { en: "Man.", fr: "Man." },
    code: "46",
    name: "MB"
  },
  {
    full: { en: "Ontario", fr: "Ontario" },
    abbrev: { en: "Ont.", fr: "Ont." },
    code: "35",
    name: "ON"
  },
  {
    full: { en: "Quebec", fr: "Québec" },
    abbrev: { en: "Que.", fr: "Qc" },
    code: "24",
    name: "QC"
  },
  {
    full: { en: "New Brunswick", fr: "Nouveau-Brunswick" },
    abbrev: { en: "N.B.", fr: "N.-B." },
    code: "13",
    name: "NB"
  },
  {
    full: { en: "Nova Scotia", fr: "Nouvelle-Écosse" },
    abbrev: { en: "N.S.", fr: "N.-É." },
    code: "12",
    name: "NS"
  },
  {
    full: { en: "Prince Edward Island", fr: "Île-du-Prince-Édouard" },
    abbrev: { en: "P.E.I.", fr: "Î.-P-É" },
    code: "11",
    name: "PE"
  },
  {
    full: { en: "Newfoundland and Labrador", fr: "Terre-Neuve-et-Labrador" },
    abbrev: { en: "N.L.", fr: "T.-N.-L." },
    code: "10",
    name: "NL"
  },
  {
    full: { en: "Yukon", fr: "Yukon" },
    abbrev: { en: "Yukon", fr: "Yn" },
    code: "60",
    name: "YT"
  },
  {
    full: { en: "Northwest Territories", fr: "Territoires du Nord-Ouest" },
    abbrev: { en: "N.W.T.", fr: "T.N.-O." },
    code: "61",
    name: "NT"
  },
  {
    full: { en: "Nunavut", fr: "Nunavut" },
    abbrev: { en: "Nunavut", fr: "Nt" },
    code: "62",
    name: "NU"
  }
]
```

Data sources:
- https://observablehq.com/@nshiab/canada-provinces-and-territories-polygons
- https://www12.statcan.gc.ca/census-recensement/2021/geo/sip-pis/boundary-limites/index2021-eng.cfm?year=21
