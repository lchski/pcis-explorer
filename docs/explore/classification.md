---
title: Explore by classification
---

# Explore by classification

```js
const group_of_interest = view(Inputs.select(groups.map((d) => d.group), {
  label: "Classification (“group”) of interest",
  format: (group_to_format) => {
    const group_being_rendered = groups.find((group) => group.group === group_to_format)

	const positions_descriptor = (group_being_rendered.n_positions == 1) ? 'position' : 'positions'

    return `${group_being_rendered.group} (${group_being_rendered.n_positions.toLocaleString()} ${positions_descriptor} in the core GC)`
  }
}))
```

There are ${group_positions.length.toLocaleString()} ${group_of_interest}-classified positions in the core. By level, they break down as follows:

```js
const group_positions_by_level = aq.from(group_positions)
	.groupby('level')
	.count()
	.derive({
		'%': d => Math.round(d.count / aq.op.sum(d.count) * 1000) / 10
	})
	.orderby(aq.desc('level'))
	.rename({'count': '#'})

// TODO: decide if we prefer this table or the chart
// display(Inputs.table(
// 	group_positions_by_level,
// 	{
// 		format: {
// 			'%': sparkbar(d3.max(group_positions_by_level, d => d['%']))
// 		}
// 	}
// ))
```

```js
display(Plot.plot({
	marginRight: 50,
	title: `${group_of_interest} positions in the core GC, by level (# and %)`,
	marks: [
		Plot.barX(group_positions_by_level, {
			x: "#",
			y: "level",
			title: d => `${d['#'].toLocaleString()} positions`,
			sort: {
				y: "y",
				reverse: true
			}
		}),
		Plot.text(group_positions_by_level, {
			text: d => `${d['%']}%`,
			title: d => `${d['#'].toLocaleString()} positions`,
			y: "level",
			x: "#",
			textAnchor: "end",
			dx: 35
		})
	]
}))
```

Let’s complicate that one a bit—by level, how many ${group_of_interest} positions are supervisors or individual contributors?

```js
const group_positions_by_level_and_supervisor_status = aq.from(group_positions)
	.groupby('level', 'is_supervisor')
	.count()
	.derive({
		'%': d => Math.round(d.count / aq.op.sum(d.count) * 1000) / 10
	})
	.groupby('level')
	.derive({
		'%_level': d => Math.round(d.count / aq.op.sum(d.count) * 1000) / 10
	})
	.orderby(aq.desc('level'))
	.rename({'count': '#'})
	.derive({
		'supervisory_status': d => d.is_supervisor ? "Supervisor" : "Individual contributor" 
	})
```

```js
display(Plot.plot({
	marginRight: 50,
	title: `${group_of_interest} positions in the core GC, by level and supervisory status (# and %)`,
	color: {
		legend: true,
		scheme: "Cividis",
		range: [0.2, 0.8]
	},
	y: {axis: null},
	marks: [
		Plot.barX(group_positions_by_level_and_supervisor_status, {
			x: "#",
			y: "supervisory_status",
			fill: "supervisory_status",
			fy: "level",
			title: d => `${d['#'].toLocaleString()} ${d.supervisory_status.toLocaleLowerCase()} ${group_of_interest}-${d.level} positions\n\n${d['%_level']}% of ${group_of_interest}-${d.level} positions\n${d['%']}% of all ${group_of_interest} positions`,
			tip: true,
			sort: {
				fy: "y",
				reverse: true
			}
		})
	]
}))
```

```js
// TODO: put this in a component and import it from both here and inferred positions
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

```js
Plot.plot({
	marginLeft: 350,
	y: {
		label: "Organization",
	},
	x: {
		label: `Number of ${group_of_interest} positions`
	},
	color: {
		legend: true,
		scheme: "Cividis",
		range: [0.2, 0.8],
		label: "Supervisory status"
	},
	marks: [
		Plot.barX(
			group_positions
				.filter(d => d.organization != null)
				.map(d => ({
					...d,
					supervisory_status: d.is_supervisor ? "Supervisor" : "Individual contributor" 
				})),
			Plot.groupY(
				{x: "count"},
				{y: "organization", fill: "supervisory_status", tip: true}
			)
		)
	]
})
```

[basic stats, in comparison to GC averages]
- number
- occupied vs not
- supervisor vs not
- \# reports?
- homogeneity (maybe better in `reporting-relationships`), basically, how common %-wise is it for this classification to report to its own (and, in comparison to others)
- all of these, by _level_

[career opportunities!?]
- “depth from top” calculation: how easily can someone access EX-1, -3, -5, DM (etc) to provide them the “experience briefing” etc type requirements for job postings—e.g., that’s easier at central agencies than at departments, presumably (“distance to EX” as metric)
- say you’re at level X, and want X or X+n—where can you go? what if you add additional constraints, like geography or organization? [could do a multi select on both!?]

<!-- # Loading code -->

<!-- ## Specific -->

```js
const groups_qry = await PCIS.query_positions_graph_db(`
	SELECT
		"group",
		COUNT("group") as n_positions
	FROM nodes
	GROUP BY "group"
	ORDER BY "n_positions" DESC
`)

const groups = groups_qry
	.filter(d => d.group !== null)
```

```js
const group_positions = await PCIS.query_positions_graph_db(`
	SELECT *
	FROM nodes
	WHERE "group" = '${group_of_interest}'
`)
```


<!-- ## Generic -->

```js
import * as PCIS from "../components/load-core-data.js"
```

<!-- 
```js
const org_to_analyze_label = PCIS.org_to_analyze_label(org_codes, org_to_analyze)
``` -->

```js
const departmental_positions = PCIS.departmental_positions(org_to_analyze)
```

```js
const org_codes = PCIS.org_codes()
```

```js
const gc_positions = PCIS.gc_positions()
```

