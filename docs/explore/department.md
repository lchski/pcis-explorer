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

<p class="tip"><code>null</code> or blank entries usually reflect “inferred positions”, created to help fill in the dataset. For more, <a href="./about/inferred-positions">see the explanation of inferred positions</a>.</p>

## Summary tables

Let’s explore the department’s positions by looking at the count of values for a few key variables.

Depending on your analysis, you may want to only consider the department as it “is” (what its occupied positions say), not as it’s “planned to be” (what its entire on-paper org chart says). Toggle this checkbox to limit the following tables and statistics to only occupied positions (this will also exclude _all_ inferred positions):

```js
const limit_to_occupied_positions = view(Inputs.toggle({label: "Limit tables and statistics to occupied positions", value: false}))
```

<div class="card" style="padding: 0;">
	<h3 style="padding: 0.5rem 1rem; font-style: italic;">Job titles</h3>
	${
		PCIS.top_n_for_grouping_var("title", departmental_positions, limit_to_occupied_positions, departmental_positions.length)
	}
</div>

<div class="grid grid-cols-2">
	<div class="card" style="padding: 0;">
		<h3 style="padding: 0.5rem 1rem; font-style: italic;">Places of work</h3>
		${PCIS.top_n_for_grouping_var("work_location", departmental_positions, limit_to_occupied_positions, departmental_positions.length)}
	</div>
	<div class="card" style="padding: 0;">
		<h3 style="padding: 0.5rem 1rem; font-style: italic;">Classifications</h3>
		${PCIS.top_n_for_grouping_var("group", departmental_positions, limit_to_occupied_positions, departmental_positions.length)}
	</div>
</div>


<div class="card" style="padding: 0;">
	<h3 style="padding: 0.5rem 1rem; font-style: italic;">You choose!</h3>
	<div style="padding: 1rem; padding-top: 0; margin-top: -0.5rem;">
		<p>Pick from any of the variables below (these are almost all the variables in the dataset, minus the ones that aren’t very meaningful to group and count by, and those already shown above):</p>
		${you_choose_top_10_grouping_var_input}
	</div>
	${PCIS.top_n_for_grouping_var(you_choose_top_10_grouping_var, departmental_positions, limit_to_occupied_positions, departmental_positions.length)}
</div>

```js
const you_choose_top_10_grouping_var_input = Inputs.select([
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
]);

const you_choose_top_10_grouping_var = Generators.input(you_choose_top_10_grouping_var_input);
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



## Supervisor of interest (and departmental structure)

To focus on a particular supervisor and their team(s), input their `position_gid` (`supervisor_gid` if you’re finding them from the row of someone reporting to them) below as the “supervisor of interest”. Then, select the “degrees of reporting” you’re interested in: `1` will show you just the positions reporting directly to that supervisor (i.e., their immediate team), `2` will show you who reports to _those_ positions, and so on.

By default, this is set to the position in the department with the most total reports—usually the most senior deputy minister, or an inferred position representing them or the minister themselves. _Due to [the limitations of inferred positions](/about/inferred-positions#what%E2%80%99s-the-impact-on-analysis%3F), maxing out the degrees of reporting for the position with the most total reports won’t always get you everyone in the department—often there are some reporting trees that don’t connect, due to data quality issues._

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
const toi_show_org_chart = view(Inputs.toggle({label: `Show the hierarchical org chart for supervisor of interest?`, value: false}))
```

```js
const positions_on_team_to_nth_degree_graph = d3
  .stratify()
  .id(d => d.position_gid)
  .parentId(d => d.supervisor_gid)
  (
    positions_on_team_to_nth_degree
      .derive({// we rewrite the supervisor_gid for the first position—assumed to be the root, because we order_by `total_reports`, to be null, so there aren't any broken links when d3.hierarchy creates its links
        supervisor_gid: d => aq.op.row_number() === 1 ? null : d.supervisor_gid
      })
  )

function get_positions_on_team_to_nth_degree_graph_root() { let i = 0; return d3.hierarchy(positions_on_team_to_nth_degree_graph).eachBefore(d => d.index = i++); }

const positions_on_team_to_nth_degree_graph_root = get_positions_on_team_to_nth_degree_graph_root()
```

```js
display(toi_show_org_chart ?
	IndentedTree(positions_on_team_to_nth_degree_graph_root, {
	label: d => `${d.data.title} (${d.data.group}-${d.data.level})`,
	title: d => `ID: ${d.data.position_gid}\nReports, direct: ${d.data.reports_direct}\nReports, indirect: ${d.data.reports_indirect}`,
	columns: [
		// {// INACCURATE: the graph sums already
		//   label: "Supervised salary, total", 
		//   value: d => d.data.supervised_salary_total,
		//   format: (value, d) => value,
		//   x: 400,
		//   type: "other"
		// },
		{// I’d be lying if I said I understood what jankery I was up to here, why I need `d.data.data` for this to work
		label: "Branch / Dir. / Div.", 
		value: d => d.data.data.branch_directorate_division, // note that this is basically ignored, the rendering is happening in `format`
		format: (value, d) => d.data.data.branch_directorate_division,
		x: 500,
		type: "other",
		textAlign: "start"
		},
		// {
		//   label: "Pay (cumulative)", 
		//   value: d => d.data.pay_max,
		//   format: (value, d) => value.toLocaleString(),
		//   x: 600
		// },
		// {
		//   label: "Count", 
		//   value: d => d.children ? 0 : 1, 
		//   format: (value, d) => d.children ? value.toLocaleString() : "-", 
		//   x: 650
		// },
		{
		label: "Reports (total)", 
		value: d => d.data.data.reports_total, 
		format: (value, d) => d.data.data.reports_total > 0 ? d.data.data.reports_total.toLocaleString() : "-", 
		x: 680,
		type: "other"
		},
		{// I’d be lying if I said I understood what jankery I was up to here, why I need `d.data.data` for this to work
		label: "Position ID", 
		value: d => d.data.data.position_gid, // note that this is basically ignored, the rendering is happening in `format`
		format: (value, d) => d.data.data.position_gid,
		x: 700,
		type: "other",
		textAlign: "start"
		},
		{// I’d be lying if I said I understood what jankery I was up to here, why I need `d.data.data` for this to work
		label: "Supervisor ID", 
		value: d => d.data.data.supervisor_gid, // note that this is basically ignored, the rendering is happening in `format`
		format: (value, d) => d.data.data.supervisor_gid,
		x: 770,
		type: "other",
		textAlign: "start"
		}
	]
	})
: html`<p><em>“Show hierarchical org chart” checkbox not checked.</em></p>`)
```


## Teams

```js
const remove_teams_of_one = view(Inputs.toggle({label: "Remove teams where a supervisor only has one employee", value: true}))
```

```js
const calculate_team_characterstics_average = (varToAverage) => Math.round(team_characteristics.derive({avg: aq.op.average(varToAverage)}).get("avg") * 10) / 10
```

${org_to_analyze_label} has ${team_characteristics.objects().length.toLocaleString()} teams (in other words, each of the ${departmental_supervisors.length.toLocaleString()} supervisors runs a “team”, consisting of their direct reports). On average, teams:

- are ${calculate_team_characterstics_average("n_supervised")} employees, not including the supervisor
- include ${calculate_team_characterstics_average("n_groups")} groups, not including the supervisor’s group
- include ${calculate_team_characterstics_average("n_supervisors_on_team")} (${calculate_team_characterstics_average("pct_team_is_supervisors")}%) supervisor(s), not including the team’s supervisor

The following table contains all teams in the department. It’s pretty dense with statistics, but you can sort it to surface interesting insights. For example:

- `pct_max`: This allows us to see how homogenous (or not!) a team’s classification groups are. First, we calculate the percentage of the team’s positions having a distinct classification group. The highest percentage is `pct_max`. By sorting `pct_max` from low to high, we can see which teams are most heterogenous (made up of a number of different classifications). _(This is the default sort order.)_

	These teams _tend_ to be higher up in the department (with a lower `ranks_from_top`, leaving aside `ranks_from_top = 0`, as those can often reflect [missing links due to inferred positions](/about/inferred-positions#what%E2%80%99s-the-impact-on-analysis%3F)) and led by an executive or similarly senior position, the disparate classifications in a department converging as they move up the hierarchy.
- `pct_team_is_supervisors`: This allows us to see how much of a team might be considered “working level”, with no direct managerial responsibilities. Sorting from high to low, we can see which teams are composed mostly / entirely of other supervisors—again, this tends to correspond with the team’s seniority within the departmental hierarchy.
- `n_supervised_of_group_*`: This shows on a _number_ basis how many people are supervised from different groups in a team. It’s the number counterpart to `pct_*`. If a team has `n_supervised_of_group_min = 1` and `n_supervised_of_group_max = 20`, that means there’s an employee with a unique classification on the team, as well as 20 employees with a different classification. There could be other groups, too, but this gives a sense of the overall distribution.

```js
view(Inputs.table(team_characteristics, {
	sort: 'pct_max'
}))
```

<div class="tip">
	<p>If there’s a team that interests you, plug the <code>supervisor_gid</code> into <a href="#supervisor-of-interest-(and-departmental-structure)">the “Supervisor of interest” section’s input</a> to further explore the team and related positions.</p> 
</div>

```js
const team_characteristics = aq.from(departmental_positions)
  .groupby("supervisor_gid", "group")
  .count()
  .groupby("supervisor_gid")
  .derive({
    percent: d => aq.op.round(d.count / aq.op.sum(d.count) * 1000) / 10
  })
  .rollup({
    n_supervised: aq.op.sum("count"),
    n_groups: aq.op.count(),
    groups: aq.op.array_agg("group"),
    pct_min: aq.op.min("percent"),
    pct_avg: d => aq.op.round(aq.op.average(d.percent) * 10) / 10,
    pct_max: aq.op.max("percent"),
    n_supervised_of_group_min: aq.op.min("count"),
    n_supervised_of_group_avg: d => aq.op.round(aq.op.average(d.count) * 10) / 10,
    n_supervised_of_group_max: aq.op.max("count")
  })
  .join_left(
    aq.from(departmental_positions)
      .groupby("supervisor_gid", "is_supervisor")
      .count()
      .groupby("supervisor_gid")
      .derive({
        percent: d => aq.op.round(d.count / aq.op.sum(d.count) * 1000) / 10
      })
      .impute(
        {
          count: () => 0,
          percent: () => 0
        },
        {
          expand: ["is_supervisor"]
        }
      )
      .orderby("supervisor_gid", "is_supervisor")
      .filter(d => d.is_supervisor)
      .rename({ count: "n_supervisors_on_team", percent: "pct_team_is_supervisors" })
      .select(aq.not("is_supervisor"))
  )
  .join_left(
    aq.from(departmental_supervisors)
      .select("position_gid", "title", "branch_directorate_division", "group", "level", "ranks_from_top", "reports_total"),
    ["supervisor_gid", "position_gid"]
  )
  .params({ remove_teams_of_one })
  .filter(d => remove_teams_of_one ? d.n_supervised > 1 : true)
  .filter(d => d.supervisor_gid != null)
  .derive({group_level: d => `${d.group}-${d.level}`})
  .select(['supervisor_gid', 'group_level', 'ranks_from_top', 'reports_total', aq.all()])
  .select([aq.not('position_gid', 'group', 'level')])
```



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
const gc_positions = PCIS.gc_positions()
```

```js
// Render method from: https://observablehq.com/@d3/indented-tree (ISC license)
// Function format adapted from: https://observablehq.com/@d3/tree#Tree (ISC license)
function IndentedTree(root, {
  label, // given a node d, returns the display name
  title, // given a node d, returns its hover text
  nodeSize = 17, // radius of nodes
  columns = []
} = {}) {
  const nodes = root.descendants();

  const L = label == null ? null : nodes.map(d => label(d.data, d));
  const T = title == null ? null : nodes.map(d => title(d.data, d));

  const svg = d3.create("svg")
      .attr("viewBox", [-nodeSize / 2, -nodeSize * 3 / 2, width, (nodes.length + 1) * nodeSize]) // width is undefined??
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .style("overflow", "visible");

  const link = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "#999")
    .selectAll("path")
    .data(root.links())
    .join("path")
      .attr("d", d => `
        M${d.source.depth * nodeSize},${d.source.index * nodeSize}
        V${d.target.index * nodeSize}
        h${nodeSize}
      `);

  const node = svg.append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
      .attr("transform", d => `translate(0,${d.index * nodeSize})`);

  node.append("circle")
      .attr("cx", d => d.depth * nodeSize)
      .attr("r", 2.5)
      .attr("fill", d => d.children ? null : "#999");

  node.append("text")
      .attr("dy", "0.32em")
      .attr("x", d => d.depth * nodeSize + 6)
      .text((d, i) => L[i]);

  node.append("title")
      .text((d, i) => T[i]);

  for (const {label, value, format, x, type, textAlign} of columns) {
    const columnType = type == null ? "numericSum" : type;
    const textAnchor = textAlign == null ? "end" : textAlign;
    
    svg.append("text")
        .attr("dy", "0.32em")
        .attr("y", -nodeSize)
        .attr("x", x)
        .attr("text-anchor", textAnchor)
        .attr("font-weight", "bold")
        .text(label);

    if (columnType == "numericSum") {
      node.append("text")
        .attr("dy", "0.32em")
        .attr("x", x)
        .attr("text-anchor", textAnchor)
        .attr("fill", d => d.children ? null : "#555")
      .data(root.copy().sum(value).descendants())
        .text(d => format(d.value, d));
    } else {
      node.append("text")
        .attr("dy", textAnchor)
        .attr("x", x)
        .attr("text-anchor", textAnchor)
        .attr("fill", d => d.children ? null : "#555")
      .data(root.copy())
        .text(d => format(d.value, d));
    }
  }

  return svg.node();
}
```