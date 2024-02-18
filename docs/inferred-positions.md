---
theme: report
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

There are some important pieces missing, which affect some of the analyses (though we try to mention where this is relevant):

- `position_status`: We can’t say whether the position is vacant or occupied.
- location (various): We can’t say where the position is based.
- supervisor ID (and other information): We can’t complete the reporting tree for some departments, since we don’t know for sure whether some of the inferred positions have supervisors that aren’t in the dataset.

In a few cases, we’ve [manually added missing information (title and supervisor)](https://github.com/lchski/pcis-analysis/blob/main/data/indexes/missing-positions.csv) where we have a high degree of confidence in the information (generally for higher-level positions where we can use open-source information to validate the additions).



## By department



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
		organization: (x) => htl.html`<span title="${x}" style="">${x}</span>`
	},
	width: {
		organization: 250
	},
	layout: "fixed"
}))
```


```js
const org_to_analyze = view(PCIS.org_to_analyze_input(org_codes))
```




```js
const inferred_positions = PCIS.query_positions_graph_db(`
	SELECT *
	FROM nodes
	WHERE inferred_position = true
`)
```

```js
import * as PCIS from "./components/load-core-data.js"
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
const gc_positions = PCIS.gc_positions()
```
