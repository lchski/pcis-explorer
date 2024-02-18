---
title: Explore by department
---


# Explore by department


```js
const org_to_analyze = view(PCIS.org_to_analyze_input(org_codes))
```

There are ${departmental_positions.length.toLocaleString()} positions at ${org_to_analyze_label}. Their status in PCIS+ on December 21, 2023, was as follows:

```js
PCIS.top_n_for_grouping_var("position_status", departmental_positions, null, 10, false)
```

<p class="tip"><code>null</code> or blank entries usually reflect “inferred positions”, created to help fill in the dataset. For more, <a href="./inferred-positions">see the explanation of inferred positions</a>.</p>

Depending on your analysis, you may want to only consider the department as it “is” (what its occupied positions say), not as it’s “planned to be” (what its entire on-paper org chart says). Toggle this checkbox to limit the following tables and statistics to only occupied positions (this will also exclude _all_ inferred positions):

```js
const limit_to_occupied_positions = view(Inputs.toggle({label: "Limit tables and statistics to occupied positions", value: false}))
```

## Top ten

### Job titles

```js
view(PCIS.top_n_for_grouping_var("title", departmental_positions, limit_to_occupied_positions, 10))
```

### Places of work

```js
view(PCIS.top_n_for_grouping_var("work_location", departmental_positions, limit_to_occupied_positions, 10))
```

### Classifications

```js
view(PCIS.top_n_for_grouping_var("group", departmental_positions, limit_to_occupied_positions, 10))
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
