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

## Summary tables

Let’s explore the department’s positions by looking at the count of values for a few key variables.

Depending on your analysis, you may want to only consider the department as it “is” (what its occupied positions say), not as it’s “planned to be” (what its entire on-paper org chart says). Toggle this checkbox to limit the following tables and statistics to only occupied positions (this will also exclude _all_ inferred positions):

```js
const limit_to_occupied_positions = view(Inputs.toggle({label: "Limit tables and statistics to occupied positions", value: false}))
```

### Job titles

```js
view(PCIS.top_n_for_grouping_var("title", departmental_positions, limit_to_occupied_positions, departmental_positions.length))
```

### Places of work

```js
view(PCIS.top_n_for_grouping_var("work_location", departmental_positions, limit_to_occupied_positions, departmental_positions.length))
```

### Classifications

```js
view(PCIS.top_n_for_grouping_var("group", departmental_positions, limit_to_occupied_positions, departmental_positions.length))
```

### You choose!

Pick from any of the variables below (these are almost all the variables in the dataset, minus the ones that aren’t very meaningful to group and count by, and those already shown above):

```js
const you_choose_top_10_grouping_var = view(Inputs.select([
	'group_level',
	'branch_directorate_division',
	'position_status',
	'supervisor_gid',
	'supervisor_group',
	'supervisor_group_level',
	'province_territory',
	'geographic_location_code',
	'reports_total',
	'reports_direct',
	'reports_indirect',
	'ranks_from_top',
	'is_supervisor',
	'inferred_position',
]))
```

```js
view(PCIS.top_n_for_grouping_var(you_choose_top_10_grouping_var, departmental_positions, limit_to_occupied_positions, departmental_positions.length))
```



## Supervisors

```js
const departmental_supervisors = departmental_positions
	.filter(d => d.is_supervisor)
```

There are ${departmental_supervisors.length.toLocaleString()} supervisors at ${org_to_analyze_label}. Here’s how their position statuses break down:

```js
PCIS.top_n_for_grouping_var("position_status", departmental_supervisors, null, departmental_supervisors.length, false)
```

As above, you can toggle this checkbox to limit the following tables and statistics to only occupied supervisor positions (this will also exclude _all_ inferred positions):

```js
const limit_to_occupied_supervisor_positions = view(Inputs.toggle({label: "Limit tables and statistics to occupied supervisor positions", value: false}))
```

Their counts by classification and group / level are as follows:

<div class="grid grid-cols-2">
	<div class="card" style="padding: 0;">
		${
			PCIS.top_n_for_grouping_var("group", departmental_supervisors, limit_to_occupied_supervisor_positions, departmental_supervisors.length)
		}
	</div>
	<div class="card" style="padding: 0;">
		${
			PCIS.top_n_for_grouping_var("group_level", departmental_supervisors, limit_to_occupied_supervisor_positions, departmental_supervisors.length)
		}
	</div>
</div>

The number of people reporting to a supervisor can be an interesting indicator. We can count it in three ways:

- `direct`: positions with a 1:1 reporting relationship with the supervisor
- `indirect`: positions whose manager (or manager’s manager, or so on) have a 1:1 reporting relationship with the supervisor (varying levels of “skip level”, in other words)
- `total`: `direct` and `indirect` combined

Here, we’ll report on `direct` and `total`. You can see `indirect` in the dataset itself.

```js
{
  const supervisors_with_most_total = departmental_supervisors
    .sort((positionA, positionB) => positionB.reports_total - positionA.reports_total)
    .slice(0, 10)

  const supervisors_with_most_direct = departmental_supervisors
    .sort((positionA, positionB) => positionB.reports_direct - positionA.reports_direct)
    .slice(0, 10)

  const describeSupervisorReports = (supervisor, reports_type) => `The supervisor with the most ${reports_type} reports is ${supervisor["position_gid"]} (Title: “${supervisor["title"]}” / BDD: “${supervisor["branch_directorate_division"]}”), with ${supervisor["reports_" + reports_type].toLocaleString()} ${reports_type} reports.`

  display(html`
<ul>
	<li>${describeSupervisorReports(supervisors_with_most_direct[0], "direct")}</li>
	<li>${describeSupervisorReports(supervisors_with_most_total[0], "total")}</li>
</ul>
`)
}
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
