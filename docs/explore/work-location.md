---
Work locations
---

# Work locations
## Or: “No, the federal government isn’t _just_ in Ottawa / Gatineau”


[TODO]
- orgs where their primary location isn't Ottawa / Gatineau
- orgs with lower-than-normal Ottawa / Gatineau % (i.e., even if they're first, they're not the only)
- "Ontario" / "QC" vs "NCR" (can we split those out, when doing the map?)
- smaller geometries (e.g., FSA, specific cities, etc...)
- load all the data, facet by org

```js
const org_to_analyze = view(PCIS.org_to_analyze_input(org_codes))
```

```js
const pt_names = provincesAndTerritories.map((pt) => ({pt: pt.name}))

const employees_by_pt = aq.from(pt_names)
	.join_left( // NB! this removes inferred positions, which don't have a work location
		aq.from(departmental_positions)
			.groupby("province_territory")
			.count(),
		['pt', 'province_territory']
	)
	.select(aq.not('province_territory'))
	.derive({count: d => (d.count != null) ? d.count : 0})
	.derive({pct: d => Math.round(d.count / aq.op.sum(d.count) *1000) / 10})
	.objects()

const employees_by_pt_counts = new Map(employees_by_pt.map(d => [d.pt, d.count]))
const employees_by_pt_pcts = new Map(employees_by_pt.map(d => [d.pt, d.pct]))
```

```js
Plot.plot({
  projection: {
    type: "conic-conformal",
    rotate: [100, -60],
    domain: canada_pts_geojson
  },
  color: {
	scheme: "bupu",
	scale: "quantize",
	range: [0.2, 0.8], // subsetting the colour range: https://observablehq.com/plot/features/scales#color-scale-options
    label: "Positions",
    legend: true
  },
	marks: [
		Plot.geo(
			canada_pts_geojson, Plot.centroid({
				fill: (d) => employees_by_pt_counts.get(d.properties.prov.name),
				// title: (d) => `${d.properties.prov.full.en}: ${employees_by_pt_counts.get(d.properties.prov.name).toLocaleString()} (${employees_by_pt_pcts.get(d.properties.prov.name)}%)`,
				tip: true,
				channels: {
					"%": d => employees_by_pt_pcts.get(d.properties.prov.name),
					"P/T": d => d.properties.prov.full.en
				}
			})
		),
		// Plot.text(canada_pts_geojson.features, Plot.centroid({ // NB! we have to surface the `.features` property for this to work
		// 	fill: "currentColor",
		// 	text: (d) => `${d.properties.prov.name}: ${employees_by_pt_counts.get(d.properties.prov.name).toLocaleString()} (${employees_by_pt_pcts.get(d.properties.prov.name)}%)`
		// })),
	]
})
```

```js
Plot.plot({
  projection: {
    type: "conic-conformal",
    rotate: [100, -60],
    domain: canada_pts_geojson,
	inset: 10
  },
  color: {
	scheme: "bupu",
	scale: "quantize",
	// range: [0.2, 0.8], // subsetting the colour range: https://observablehq.com/plot/features/scales#color-scale-options
    label: "Positions",
    legend: true
  },
	marks: [
		Plot.geo(
			canada_pts_geojson,
			{
				strokeOpacity: 0.5
			}
		),
		Plot.geo(
			canada_cds_geojson,
			Plot.centroid({
				fill: (d) => gc_positions_org_geo.filter(p => p.census_division == d.properties.CDUID).length,
				tip: true,
				channels: {
					"Census Division": d => `${d.properties.CDNAME} (#${d.properties.CDUID})`
				},
				strokeOpacity: 0.1
			})
		),
	]
})
```

TODO:
- handle null locations
- handle non-Canada locations (GAC, IRCC, ...)
- add filtering for locations


```js
// Source: https://observablehq.com/@nshiab/provinces-and-territories-labels
const canada_pts_geojson_raw = FileAttachment("../data/canada-provinces-territories.json").json()
```

```js
// Source: https://observablehq.com/@fil/rewind
import {rewind} from "../components/fil-rewind.js"
```

```js
// Source: https://observablehq.com/@nshiab/provinces-and-territories-labels
function get_canada_pts_geojson() {
	const geo = structuredClone(canada_pts_geojson_raw);
	
	for (const feature of geo.features) {
		feature.id = feature.properties.PRUID;
		feature.properties = {
			...feature.properties,
			prov: provincesAndTerritories.find(
				(d) => d.code === feature.properties.PRUID
			)
		};
	}
	
	return rewind(geo);
}

const canada_pts_geojson = get_canada_pts_geojson()
```

```js
/**
 * - mapshaper, load the .zip from StatsCan in "Quick Import"
 * - simplify to `0.1%` (leave the "prevent shape removal" option unchecked)
 * - console, `-proj wgs84` to get to latlng
 * - export, `precision=0.01` [0.01]
 */

const canada_cds_geojson_raw = FileAttachment("../data/canada-census-divisions.json").json()
```

```js
function get_canada_cds_geojson() {
	const geo = structuredClone(canada_cds_geojson_raw);
	
	return rewind(geo);
}

const canada_cds_geojson = get_canada_cds_geojson()
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
- mapshaper (TODO explain methodology)


<!-- ## Generic -->

```js
import * as PCIS from "../components/load-core-data.js"
```

```js
const org_to_analyze_label = PCIS.org_to_analyze_label(org_codes, org_to_analyze)
```

```js
const departmental_positions = PCIS.departmental_positions(org_to_analyze)
```

```js
const org_codes = PCIS.org_codes()
```

```js
const gc_positions_org_geo_qry = await PCIS.query_positions_graph_db(`
	SELECT
		position_gid,
		organization_code,
		organization,
		position_status,
		"group",
		level,
		is_supervisor,
		inferred_position,
		ranks_from_top,
		reports_total,
		geographic_location_code,
		province_territory
	FROM nodes
`)

const gc_positions_org_geo = aq.from(gc_positions_org_geo_qry)
	.derive({
		census_division: d => aq.op.substring(d.geographic_location_code, 0, 4)
	})
	.objects()
```
