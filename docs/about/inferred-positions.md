---
title: Inferred positions
---

# Inferred positions

Of the ${gc_positions.length.toLocaleString()} positions in the PCIS+ dataset, ${(gc_positions.length - inferred_positions.length).toLocaleString()} are described directly, while ${inferred_positions.length.toLocaleString()} are “inferred”. 



## What’s an inferred position?

We can infer missing positions (to some extent) because each position includes an ID (unique to the position’s department) and its _supervisor’s_ position ID. Within each department, then, we can compare the list of supervisor IDs to the list of position IDs. For any that are missing, we can glean a bit of information from the dataset, enough to create “inferred positions” to better capture the universe of positions. We’ve set their `title` to “Unknown” and marked them as an `inferred_position` in the dataset.

For these ${inferred_positions.length.toLocaleString()} inferred positions, we have, with reasonably high confidence, the following information available:

- organization
- position ID

That’s not much! Fortunately, we have _some_ additional information available, with varying degrees of completeness and confidence:

```js
const inferred_positions_with_classification = inferred_positions
	.filter(d => d.group !== null && d.level !== null)
```

- For ${inferred_positions_with_classification.length.toLocaleString()} of the inferred positions, we have group and level available (with high confidence, since it’s directly from PCIS+).
- For all the inferred positions, we’ve guessed at the branch / directorate / division (`branch_directorate_division`) by sorting the dataset from highest to lowest pay, and using the next `branch_directorate_division` of the next position in the dataset to fill in the blank. This isn’t necessarily reliable, so we’ve clearly marked them as inferred.



## What’s the impact on analysis?

There are some important pieces missing, which affect some of the analyses (though we try to mention where this is relevant):

- `position_status`: We can’t say whether the position is vacant or occupied.
- location (various): We can’t say where the position is based.
- supervisor ID (and other information): We can’t complete the reporting tree for some departments, since we don’t know for sure whether some of the inferred positions have supervisors that aren’t in the dataset. As a result, inferred positions are always `0` `ranks_from_top`, and departments with lots of inferred positions will have lots of broken reporting trees.

In a few cases, we’ve [manually added missing information (title and supervisor)](https://github.com/lchski/pcis-analysis/blob/main/data/indexes/missing-positions.csv) where we have a high degree of confidence in the information (generally for higher-level positions where we can use open-source information to validate the additions).



## By department

The number of inferred positions varies greatly by department:

```js
const inferred_positions_by_department_raw = PCIS.query_positions_graph_db(`
	SELECT
		"organization_code",
		"organization",
		"inferred_position",
		COUNT("inferred_position") as n_positions
	FROM nodes
	GROUP BY "organization", "organization_code", "inferred_position"
	ORDER BY "organization"
`)
```

```js
const inferred_positions_by_department = aq.from(inferred_positions_by_department_raw)
	.derive({
		organization: aq.escape(d => String(d.organization)) // to convert "null" values to a string
	})
	.groupby('organization')
	.pivot('inferred_position', 'n_positions')
	.rename({ 'false': 'provided', 'true': 'inferred' })
	.derive({
		pct_inferred: d => Math.round((d.inferred / (d.provided + d.inferred)) * 1000) / 10,
		total: d => d.provided + d.inferred
	})
```

```js
display(Inputs.table(inferred_positions_by_department, {
	format: {
		organization: (x) => htl.html`<span title="${x}" style="">${x}</span>`,
		pct_inferred: sparkbar(d3.max(inferred_positions_by_department, d => d.pct_inferred))
	},
	width: {
		organization: 250
	},
	layout: "fixed"
}))
```

```js
function sparkbar(max) {
  return (x) => htl.html`<div style="
    background: var(--theme-foreground-faintest);
    width: ${100 * x / max}%;
    float: right;
    padding-right: 3px;
    box-sizing: border-box;
    overflow: visible;
    display: flex;
    justify-content: end;">${x.toLocaleString()}%`
}
```

For some, like <abbr title="Royal Canadian Mounted Police (Civilian Staff)">RCMP</abbr> and <abbr title="National Defence">DND</abbr>, high numbers make sense: these departments have org structures integrating employees from the core public administration with non-core employees (civilian and regular members for the <abbr title="Royal Canadian Mounted Police (Civilian Staff)">RCMP</abbr>, and military members for <abbr title="National Defence">DND</abbr>).

PCIS+ is a dataset of positions in the core public administration, so it only contains core employees. Generally speaking, these non-core employees will lack classification info (though there can be other reasons an inferred position lacks classification info, which we’ve yet to divine!).

```js
// Related to below chart!

// const inferred_positions_by_department_list = PCIS.query_positions_graph_db(`
// 	SELECT
// 		"organization_code",
// 		"organization",
// 		"inferred_position"
// 	FROM nodes
// `)
```

```js
// Couldn't quite make this work, may try another time!

// Plot.plot({
// 	marginLeft: 350,
// 	x: { percent: true },
// 	marks: [
// 		Plot.barX(
// 			inferred_positions_by_department_list,
// 			Plot.groupY(
// 				{ x: "proportion" },
// 				{
// 					fill: "inferred_position",
// 					y: "organization",
// 					offset: "normalize"
// 				}
// 			)
// 		),

// 		Plot.text(
// 			inferred_positions_by_department_list,
// 			Plot.groupY(
// 				{ text: "count" },
// 				{
// 					text: "inferred_position",
// 					fill: "inferred_position",
// 					y: "organization"
// 				}
// 			)
// 		)
// 	]
// })
```

You can choose a specific department to better understand its inferred positions:

```js
const org_to_analyze = view(PCIS.org_to_analyze_input(org_codes))
```

```js
view(Inputs.table(
	aq.from(departmental_inferred_positions)
		.select(aq.not(aq.range('position_status', 'pay_max')))
))
```

```js
const departmental_inferred_positions_with_classification = departmental_inferred_positions
	.filter(d => d.group !== null && d.level !== null)

const pct_departmental_inferred_positions_without_classification = Math.round((departmental_inferred_positions.length - departmental_inferred_positions_with_classification.length) / departmental_inferred_positions.length * 1000) / 10
```

Of the ${departmental_inferred_positions.length.toLocaleString()} inferred position${(departmental_inferred_positions == 1) ? '' : 's'} at ${org_to_analyze_label}, ${departmental_inferred_positions_with_classification.length.toLocaleString()} have classification info (${(departmental_inferred_positions.length - departmental_inferred_positions_with_classification.length).toLocaleString()}, or ${pct_departmental_inferred_positions_without_classification}%, do not). 



```js
const inferred_positions = PCIS.query_positions_graph_db(`
	SELECT *
	FROM nodes
	WHERE inferred_position = true
`)
```

```js
const departmental_inferred_positions = inferred_positions
	.filter((d) => d.organization_code == org_to_analyze)
```

```js
import * as PCIS from "../components/load-core-data.js"
```

```js
const org_to_analyze_label = PCIS.org_to_analyze_label(org_codes, org_to_analyze)
```

```js
const org_codes = aq.from(inferred_positions)
	.groupby('organization', 'organization_code')
	.count({ as: 'n_positions' })
	.orderby('organization')
	.filter(d => d.organization !== null)
	.objects()
```

```js
const gc_positions = PCIS.gc_positions()
```
