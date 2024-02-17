---
theme: report
title: Explore by department
---


# Explore by department


```js
const org_to_analyze = view(Inputs.select(org_codes.map((d) => d.organization_code), {
  label: "Organization to analyze",
  format: (org_code_to_format) => {
    const org_being_rendered = org_codes.find((org_code) => org_code.organization_code === org_code_to_format)

    return `${org_being_rendered.organization} (${org_being_rendered.n_positions.toLocaleString()} positions)`
  }
}))
```

There are ${departmental_positions.length.toLocaleString()} positions at ${org_to_analyze_label}. Their status in PCIS+ on December 21, 2023, was as follows:

```js
{
	let departmental_positions_table = aq.from(departmental_positions)
		.derive({
			position_status: aq.escape(d => String(d.position_status)) // to convert "null" values to a string
		})
		.groupby('position_status')
		.count()
		.derive({ percent: d => Math.round(d.count / aq.op.sum(d.count) * 1000) / 10 })

	display(Inputs.table(departmental_positions_table))
}
```

_Note on “null” entries: this generally means that this is an “inferred position”, created to help fill in the dataset. For more, see the explanation of “inferred positions”, which I’ve definitely actually written. [TODO: write and link]_

Depending on your analysis, you may want to only consider the department as it “is” (what its occupied positions say), not as it’s “planned to be” (what its entire on-paper org chart says). Toggle this checkbox to limit the following tables and statistics to only occupied positions (this will also exclude _all_ inferred positions):

```js
const limit_to_occupied_positions = view(Inputs.toggle({label: "Limit tables and statistics to occupied positions", value: false}))
```

```js
view(top_n_for_grouping_var("title", 10))
```







```js
function top_n_for_grouping_var(grouping_var, n = 10, positions_to_analyze = departmental_positions,  apply_limit_to_occupied_filter = true, return_view = true) {
  const top_n = aq.from(positions_to_analyze)
    .params({ apply_limit_to_occupied_filter, limit_to_occupied_positions })
    .filter(d => apply_limit_to_occupied_filter ? (limit_to_occupied_positions ? d.position_status == "Occupied" : true) : true)
    .groupby(grouping_var)
    .count()
    .derive({ percent: d => Math.round(d.count / aq.op.sum(d.count) * 1000) / 10 })
    .orderby(aq.desc("count"))
    .slice(0, n)

  if (return_view) {
    return Inputs.table(top_n)
  }
  
  return top_n
}
```

```js
const org_to_analyze_label = org_codes.filter((org) => org.organization_code == org_to_analyze)[0]['organization']
```

```js
const departmental_positions = positions_graph_db.query(
  `SELECT * FROM nodes WHERE organization_code = '${org_to_analyze}'`
)
```

```js
let org_codes_qry = async () => {
  const qry = await positions_graph_db.query(`SELECT "organization_code", "organization", COUNT("organization_code") as n_positions FROM nodes GROUP BY "organization", "organization_code" ORDER BY "organization"`)

  return qry
    .filter((d) => d.organization_code != null);
}

const org_codes = await org_codes_qry()
```

```js
const positions_graph_db = DuckDBClient.of({
  nodes: FileAttachment("data/positions-graph-nodes.parquet"),
  edges: FileAttachment("data/positions-graph-edges.parquet"),
})
```

```js
const gc_positions = positions_graph_db.query(
  `SELECT work_location, position_status FROM nodes`
)
```
