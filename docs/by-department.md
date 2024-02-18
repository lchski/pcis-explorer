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



### Teams reporting to a position

To focus on a particular supervisor and their team(s), input their `position_gid` (`supervisor_gid` if you’re finding them from the row of someone reporting to them) below as the “supervisor of interest”. Then, select the “degrees of reporting” you’re interested in: `1` will show you just the positions reporting directly to that supervisor (i.e., their immediate team), `2` will show you who reports to _those_ positions, and so on.

By default, this is set to the position in the department with the most total reports—usually the most senior deputy minister, or an inferred position representing them or the minister themselves. _Due to [the limitations of inferred positions](/inferred-positions#what%E2%80%99s-the-impact-on-analysis%3F), maxing out the degrees of reporting for the position with the most total reports won’t always get you everyone in the department—often there are some reporting trees that don’t connect, due to data quality issues._

This populates an interactive data table, which you can use to further explore the data.


```js
const team_of_interest = view(Inputs.form({
	team_supervisor_gid: Inputs.text({
		label: "Supervisor of interest",
		value: aq.from(aq.from(departmental_supervisors).orderby(aq.desc("reports_total"))).get("position_gid")
	}),
	degrees_of_reporting: Inputs.range(
		[
			1,
			aq.from(departmental_positions).rollup({max: d => aq.op.max(d.ranks_from_top)}).get('max')
		],
		{label: "Degrees of reporting", step: 1, value: 1}
	)
}))
```

```js
{
	const supervisor_of_interest = aq.from(departmental_supervisors)
		.params({ team_of_interest })
		.filter(d => d.position_gid == team_of_interest.team_supervisor_gid)
		.object()

	if ("undefined" === typeof supervisor_of_interest.position_gid) {
		display(
			html`<p>No supervisor position found with ID ${team_of_interest.team_supervisor_gid}.</p>`
		)
	} else {
		display(
			html`<p>${team_of_interest.team_supervisor_gid} has the title “${supervisor_of_interest.title}” in the “${supervisor_of_interest.branch_directorate_division}” <abbr title="branch, directorate, or division">BDD</abbr>, with group / level ${supervisor_of_interest.group}-${supervisor_of_interest.level}. They have ${supervisor_of_interest.reports_direct} direct reports and ${supervisor_of_interest.reports_total} total reports. They report to ${supervisor_of_interest.supervisor_gid} (${supervisor_of_interest.supervisor_group}-${supervisor_of_interest.supervisor_level}).</p>`
		)
	}  	
}
```

```js
function get_positions_on_team_to_nth_degree() {
  let degrees_of_reporting_i = 1
  
  const initial_team_positions = aq.from(departmental_supervisors)
    .params({ team_of_interest })
    .filter(d => d.position_gid == team_of_interest.team_supervisor_gid)

  let supervisor_gids = [...new Set(initial_team_positions
    .array('position_gid'))]

  while (degrees_of_reporting_i < team_of_interest.degrees_of_reporting) {
    const supervisor_gids_for_nth_degree = aq.from(departmental_supervisors)
      .params({ supervisor_gids })
      .filter(d => aq.op.includes(supervisor_gids, d.supervisor_gid))
      .array('position_gid')

    supervisor_gids = [...new Set([...supervisor_gids, ...supervisor_gids_for_nth_degree])]
    
    degrees_of_reporting_i++
  }

  const responsive_supervisor_gids = [...new Set([team_of_interest.team_supervisor_gid, ...supervisor_gids])]

  return aq.from(departmental_positions)
    .params({ responsive_supervisor_gids })
    .filter(d => aq.op.includes(responsive_supervisor_gids, d.position_gid) || aq.op.includes(responsive_supervisor_gids, d.supervisor_gid))
    .orderby(aq.desc('reports_total'))
    .select(aq.not('organization_code', 'organization', 'geographic_location_code', 'pay_max', 'node_id', 'org_node_id', aq.matches('_salary_')))
}

const positions_on_team_to_nth_degree = get_positions_on_team_to_nth_degree()
```

At ${team_of_interest.degrees_of_reporting} degrees of reporting, ${team_of_interest.team_supervisor_gid} has ${(positions_on_team_to_nth_degree.objects().length - 1).toLocaleString()} total reports.

```js
view(Inputs.table(positions_on_team_to_nth_degree))
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
