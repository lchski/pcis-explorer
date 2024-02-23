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
const limit_to_occupied_positions = view(Inputs.toggle({label: "Limit visualizations and statistics to occupied positions", value: false}))
```

```js
const remove_top_location = view(Inputs.toggle({label: "Remove the location with the highest # of positions (to make the rest more visible)", value: false}))
```

```js
const pt_names = [{"PRUID":"48","pt":"AB"},{"PRUID":"59","pt":"BC"},{"PRUID":"47","pt":"SK"},{"PRUID":"46","pt":"MB"},{"PRUID":"35","pt":"ON"},{"PRUID":"24","pt":"QC"},{"PRUID":"13","pt":"NB"},{"PRUID":"12","pt":"NS"},{"PRUID":"11","pt":"PE"},{"PRUID":"10","pt":"NL"},{"PRUID":"60","pt":"YT"},{"PRUID":"61","pt":"NT"},{"PRUID":"62","pt":"NU"},{"PRUID":"NCR","pt":"NCR"},{"PRUID":"INTL","pt":"INTL"}]

const employees_by_pt_raw = aq.from(pt_names)
	.join_left( // NB! this removes inferred positions, which don't have a work location
		aq.from(departmental_positions)
			.groupby("province_territory")
			.count(),
		['pt', 'province_territory']
	)
	.select(aq.not('pt'))
	.derive({count: d => (d.count != null) ? d.count : 0})
	.derive({pct: d => Math.round(d.count / aq.op.sum(d.count) *1000) / 10})
	.orderby(aq.desc('count'))
	.derive({rank: d => aq.op.rank()})
	.objects()

const employees_by_pt = employees_by_pt_raw
	.filter(d => remove_top_location ? d.rank > 1 : true )

const removed_top_pt = employees_by_pt_raw
	.filter(d => d.rank == 1)[0]

const employees_by_pt_counts = new Map(employees_by_pt.map(d => [d.PRUID, d.count]))
const employees_by_pt_pcts = new Map(employees_by_pt.map(d => [d.PRUID, d.pct]))
```

```js
Plot.plot({
	title: `Positions at ${org_to_analyze_label} by province / territory / region`,
	caption: remove_top_location ? html`The top province / territory / region, ${removed_top_pt.province_territory}, is not shown in this map due to the “Remove top location” toggle at the start of the report. It has ${removed_top_pt.count.toLocaleString()} (${removed_top_pt.pct}%) of the positions at ${org_to_analyze_label}. Percentages in the map reflect the percentage of <em>total</em> positions at the department, including those not shown from ${removed_top_pt.province_territory}.` : '',
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
				fill: (d) => employees_by_pt_counts.get(d.properties.PRUID),
				// title: (d) => `${d.properties.PRENAME}: ${employees_by_pt_counts.get(d.properties.PRUID).toLocaleString()} (${employees_by_pt_pcts.get(d.properties.PRUID)}%)`,
				tip: true,
				channels: {
					"%": d => employees_by_pt_pcts.get(d.properties.PRUID),
					"P/T": d => d.properties.PRENAME
				}
			})
		),
		// Plot.text(canada_pts_geojson.features, Plot.centroid({ // NB! we have to surface the `.features` property for this to work
		// 	fill: "currentColor",
		// 	text: (d) => `${d.PRUID}: ${employees_by_pt_counts.get(d.PRUID).toLocaleString()} (${employees_by_pt_pcts.get(d.PRUID)}%)`
		// })),
	]
})
```

```js
if (employees_by_pt_counts.get("INTL") > 0) {
	view(html`<div class="note">
		<p>${org_to_analyze_label} includes ${employees_by_pt_counts.get("INTL").toLocaleString()} positions (${employees_by_pt_pcts.get("INTL")}% of its total positions) with international locations, not mapped here. See tables below for more.</p>
	</div>`)
}
```

```js
const org_positions_by_cd_raw = aq.from(departmental_positions)
	.groupby("census_division")
	.count()
	.derive({pct: d => Math.round(d.count / aq.op.sum(d.count) *1000) / 10})
	.orderby(aq.desc('count'))
	.derive({rank: d => aq.op.rank()})
	.objects()

const org_positions_by_cd = org_positions_by_cd_raw
	.filter(d => remove_top_location ? d.rank > 1 : true )

const removed_top_cd = org_positions_by_cd_raw
	.filter(d => d.rank == 1)[0]

const org_positions_by_cd_counts = new Map(org_positions_by_cd.map(d => [d.census_division, d.count]))
const org_positions_by_cd_pcts = new Map(org_positions_by_cd.map(d => [d.census_division, d.pct]))
```

```js
Plot.plot({
	title: `Positions at ${org_to_analyze_label} by census division`,
	caption: remove_top_location ? html`The top census division, ${canada_cds_names.get(removed_top_cd.census_division)} (#${removed_top_cd.census_division}), is not shown in this map due to the “Remove top location” toggle at the start of the report. It has ${removed_top_cd.count.toLocaleString()} (${removed_top_cd.pct}%) of the positions at ${org_to_analyze_label}. Percentages in the map reflect the percentage of <em>total</em> positions at the department, including those not shown from ${canada_cds_names.get(removed_top_cd.census_division)}.` : '',
  projection: {
    type: "conic-conformal",
    rotate: [100, -60],
    domain: canada_pts_geojson,
	inset: 10
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
			canada_pts_geojson,
			{
				strokeOpacity: 0.5,
				strokeWidth: 0.5
			}
		),
		Plot.geo(
			canada_cds_geojson,
			Plot.centroid({
				fill: (d) => org_positions_by_cd_counts.get(d.properties.CDUID),
				tip: true,
				channels: {
					"Census Division": d => `${d.properties.CDNAME} (#${d.properties.CDUID})`
				},
				strokeOpacity: 0
			})
		),
	]
})
```

```js
{
	let concentration = "not"

	if (org_positions_by_cd_detailed[0].pct >= 50) {
		concentration = "somewhat"
	}

	if (org_positions_by_cd_detailed[0].pct >= 80) {
		concentration = "very"
	}

	if (org_positions_by_cd_detailed[0].pct >= 95) {
		concentration = "extremely"
	}

	let positions_with_unknown_cd = org_positions_by_cd_detailed.find(d => d.id == null)
	
	view(html`<p>${org_to_analyze_label} is ${concentration} geographically concentrated, with ${org_positions_by_cd_detailed[0].pct}% of its positions in the ${org_positions_by_cd_detailed[0].census_division} census division, and its remaining positions in ${(org_positions_by_cd_detailed.length - 1).toLocaleString()} other census division(s) (including ${positions_with_unknown_cd.count.toLocaleString()} position(s), likely inferred, with an unknown work location).</p><p>Here’s the distribution of positions by census division:</p>`)
}
```

```js
const org_positions_by_cd_detailed = aq.from(org_positions_by_cd_raw)
	.objects()
	.map(cd => ({
		id: cd.census_division,
		census_division: canada_cds_names.get(cd.census_division),
		count: cd.count,
		pct: cd.pct
	}))
	.map(cd => {
		let cd_detailed = cd;

		if (international_geographic_location_codes.includes(cd.id)) {
			cd_detailed.census_division = `INTL: ${international_locations.find(d => d.geographic_location_code == cd.id).work_location}`
		}

		if (cd.id == null) {
			cd_detailed.census_division = "*Unknown (*likely an inferred position)"
		}

		return cd_detailed;
	})

view(Inputs.table(
	org_positions_by_cd_detailed
))
```



TODO:
- handle null locations (add them to the captions on maps?)
- handle non-Canada locations (GAC, IRCC, CBSA, ...)—they seem to have two-digit geographic_location_codes, 91 to 99, and have all been assigned the QC PT lol?
- add filtering for locations

## Orgs outside the NCR

```js
const positions_by_org_pt = aq.from(gc_positions_org_geo)
	.filter(d => d.organization != null)
	.groupby("organization", "province_territory")
	.count()
	.orderby("organization", aq.desc("count"))
	.groupby("organization")
	.derive({
		pct: d => Math.round(d.count / aq.op.sum(d.count) *1000) / 10,
		rank: d => aq.op.rank(),
	})
	.objects()

const orgs_majority_in_ncr = aq.from(positions_by_org_pt)
	.filter(d => d.province_territory == "NCR")
	.filter(d => d.pct >= 50)
	.array("organization")
```

Of the ${org_codes.length} organizations in PCIS+, ${org_codes.length - orgs_majority_in_ncr.length} have more than 50% of their positions outside of the National Capital Region:

```js
display(Inputs.table(aq.from(positions_by_org_pt)
	.params({ orgs_majority_in_ncr })
	.filter(d => ! aq.op.includes(orgs_majority_in_ncr, d.organization ))
	.objects()
))
```

Of these organizations, ${[...new Set(aq.from(positions_by_org_pt).params({ orgs_majority_in_ncr }).filter(d => ! aq.op.includes(orgs_majority_in_ncr, d.organization )).filter(d => d.rank == 1 && d.province_territory != "NCR").array("organization"))].length} have the highest number of positions in a province / territory / region in somewhere other than the NCR (there are some departments that have fewer than 50% of their positions in the NCR, but it’s still the place with _most_ of their positions—these departments are excluded from this stat).

[TODO: how many have no positions in NCR?]

[TODO: add and flag "limit to occupied", or note that it's not applied, for this section?]



## Orgs with an international presence



```js
const international_geographic_location_codes = [
	"91",
	"92",
	"93",
	"94",
	"95",
	"96",
	"97",
	"98",
	"99",
]
```

```js
const international_locations = [
	{"geographic_location_code": "91", "work_location": "Europe"},
	{"geographic_location_code": "93", "work_location": "Africa"},
	{"geographic_location_code": "95", "work_location": "AsiaMiddle EastIndiaPakistan"},
	{"geographic_location_code": "96", "work_location": "AustraliaNew Zealand some of the south Pacific"},
	{"geographic_location_code": "97", "work_location": "South America"},
	{"geographic_location_code": "98", "work_location": "Central AmericaMexico Caribbean"},
	{"geographic_location_code": "99", "work_location": "United StatesGreenlandBermudaSt. Pierre & Miquelon"},
]
```

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

const canada_cds_names = new Map(canada_cds_geojson_raw.features
		.map(cd => [
			cd.properties.CDUID,
			cd.properties.CDNAME
		])
	)
```

Data sources:
- https://observablehq.com/@nshiab/canada-provinces-and-territories-polygons
- https://www12.statcan.gc.ca/census-recensement/2021/geo/sip-pis/boundary-limites/index2021-eng.cfm?year=21
- mapshaper (TODO explain methodology)

NB!
- rounding "up" from csd (`geographic_location_code`) to cd (first four digits thereof) means that we may oeprate at a slightly lower level of detail, but hopefully with more accuracy: some positions seem to have old csd numbers (see `work_location` of Gatineau, Val-d'Or, etc), by simplifying to cd we hopefully capture them all
- non-Canada locations, inferred positions don't get counted

<!-- ## Generic -->

```js
import * as PCIS from "../components/load-core-data.js"
```

```js
const org_to_analyze_label = PCIS.org_to_analyze_label(org_codes, org_to_analyze)
```

```js
const departmental_positions = gc_positions_org_geo
	.filter(d => limit_to_occupied_positions ? d.position_status == "Occupied" : true)
	.filter(d => d.organization_code == org_to_analyze)
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
		work_location,
		geographic_location_code,
		province_territory
	FROM nodes
`)

const gc_positions_org_geo = aq.from(gc_positions_org_geo_qry)
	.params({ international_geographic_location_codes })
	.derive({
		census_division: d => aq.op.substring(d.geographic_location_code, 0, 4)
	})
	.derive({
		province_territory: d => (aq.op.includes(["3506", "2481"], d.census_division)) ? "NCR" : d.province_territory
	})
	.derive({
		province_territory: d => (aq.op.includes(international_geographic_location_codes, d.geographic_location_code)) ? "INTL" : d.province_territory
	})
	.objects()
```
