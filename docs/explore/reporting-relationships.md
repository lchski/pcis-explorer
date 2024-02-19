---
title: Explore by reporting relationships
---

# Explore by reporting relationships

<div class="note">
	<p>This report is dynamic—the selections you make in the dropdown menus change the data and text that’s displayed. It may hang for a moment as it recalculates, and there may be an occasional error or two, but switching the settings again should sort it out. Have fun with it!</p>
</div>

## Which groups report to which

Let’s explore how often certain groups report to a selected group—if you’re curious about supervisors of a certain classification, select it here (there’s no “all” option yet, that may come later!):

```js
const supervisor_group_of_interest = view(Inputs.select(groups.map((d) => d.group), {
  label: "Supervisor group of interest",
  format: (group_to_format) => {
    const group_being_rendered = groups.find((group) => group.group === group_to_format)

	const positions_descriptor = (group_being_rendered.n_positions == 1) ? 'position' : 'positions'

    return `${group_being_rendered.group} (${group_being_rendered.n_positions.toLocaleString()} ${positions_descriptor} in the core GC)`
  }
}))
```

Across the core public administration (most GC organizations / the ones that use standard classifications), there are ${positions_with_supervisor_of_interest.length.toLocaleString()} positions with a ${supervisor_group_of_interest}-classified supervisor. Of these, their classifications break down as follows:

```js
view(Inputs.table(n_positions_supervisor_oi_by_group))
```

```js
{
  const top_three_groups = n_positions_supervisor_oi_by_group.slice(0, 3)

  const top_three_groups_total_pct = top_three_groups.rollup({pct_sum: d => aq.op.sum(d['%'])}).get('pct_sum')

  const top_three_groups_descriptions = top_three_groups
    .objects()
    .map((group, i, groups) => {
      const group_descriptor = ` ${group.group} (${group['%']}%)`
      
      if (i === groups.length - 1) {
        return ` and ${group_descriptor}`
      }
      
      return group_descriptor
     })
    .toString()

  display(html`<p>The three most common groups to be supervised by a ${supervisor_group_of_interest}-classified supervisor are ${top_three_groups_descriptions}, accounting for ${top_three_groups_total_pct.toLocaleString()}% of all ${supervisor_group_of_interest}-supervised positions.</p>`)
}
```

```js
const n_positions_supervisor_oi_by_group = aq.from(positions_with_supervisor_of_interest)
	.groupby('group')
	.count()
	.derive({
		'%': d => Math.round(d.count / aq.op.sum(d.count) * 1000) / 10
	})
	.orderby(aq.desc('count'))
	.rename({'count': '#'})
```

We can also focus our analysis on a particular organization with ${supervisor_group_of_interest}-classified supervisors:

```js
const org_to_analyze = view(Inputs.select(org_codes_with_supervisor.map((d) => d.organization_code), {
  label: "Organization to analyze",
  format: (org_code_to_format) => {
    const org_being_rendered = org_codes_with_supervisor.find((org_code) => org_code.organization_code === org_code_to_format)

	const positions_descriptor = (org_being_rendered.n_positions == 1) ? 'position' : 'positions'

    return `${org_being_rendered.organization} (${org_being_rendered.n_positions.toLocaleString()} ${positions_descriptor} with ${supervisor_group_of_interest}-classified supervisors)`
  }
}))
```

At ${org_to_analyze_label}, there are ${departmental_positions_with_supervisor_of_interest.length.toLocaleString()} positions with a ${supervisor_group_of_interest}-classified supervisor.

```js
const n_departmental_positions_supervisor_oi_by_group = aq.from(departmental_positions_with_supervisor_of_interest)
  .groupby('group')
  .count()
  .derive({
    percent: d => Math.round(d.count / aq.op.sum(d.count) * 1000) / 10
  })
  .orderby(aq.desc('count'))
  .derive({
    rank: d => aq.op.rank()
  })
```

```js
view(Inputs.table(n_departmental_positions_supervisor_oi_by_group))
```

We can further focus by choosing a “supervised group”—looking at how often that group reports to our supervisor group of interest (currently set as ${supervisor_group_of_interest}):

```js
const supervised_group_of_interest = view(Inputs.select(groups_reporting_to_supervisor_group.map((d) => d.group), {
  label: "Supervised group of interest",
  format: (group_to_format) => {
    const group_being_rendered = groups_reporting_to_supervisor_group.find((group) => group.group === group_to_format)

    return `${group_being_rendered.group} (${group_being_rendered.n_positions.toLocaleString()} positions reporting to ${supervisor_group_of_interest})`
  }
}))
```

```js
{
  let potential_extra_detail_re_percentages = ''
  
  if (departmental_positions_with_supervisor_and_group_of_interest.length > 0) {
    potential_extra_detail_re_percentages = `The ${supervised_group_of_interest} group makes up ${n_departmental_positions_supervisor_oi_by_group.objects().filter(group => group.group == supervised_group_of_interest)[0]['percent']}% of positions supervised by ${supervisor_group_of_interest}-classified supervisors at ${org_to_analyze_label}.`

    // They are rank ${n_departmental_positions_supervisor_oi_by_group.objects().filter(group => group.group == supervised_group_of_interest)[0]['rank']} out of ${n_departmental_positions_supervisor_oi_by_group.rollup({rank_max: d => op.max(d.rank)}).get('rank_max')}.
  }

  view(html`Of the ${supervisor_group_of_interest}-supervised positions at ${org_to_analyze_label}, ${departmental_positions_with_supervisor_and_group_of_interest.length.toLocaleString()} are ${supervised_group_of_interest} positions. ${potential_extra_detail_re_percentages}`)
}
```

**To put things in perspective, here’s how often ${supervised_group_of_interest} positions report to ${supervisor_group_of_interest}-classified positions in the core GC, in a slightly confusing table.** Every organization is in here twice, in order of how common this arrangement is:

- the first set of orgs, where `percent` is `100.0` and `selected_group_reports_to…` is `false`, don’t have any positions with that reporting relationship (hidden by default)
- the last set of orgs, where `percent` is `0.0` and `selected_group_reports_to…` is `true`, also don’t have any (they’re just repeats of the first set, in reverse order, also hidden by default)
- the remaining orgs, found in the middle, do have positions with this reporting relationship—with the ones where it’s more common being found closer to the middle of the list

(If you want to show the first and last set of orgs, which don’t have any positions with that reporting relationship, untick the checkbox.)

```js
const hide_orgs_without_reporting_relationship = view(
	Inputs.toggle({label: `Hide orgs without ${supervised_group_of_interest} reporting to ${supervisor_group_of_interest}`, value: true})
)
```

```js
view(Inputs.table(
	aq.from(positions_with_supervisor_of_interest)
		.params({ supervised_group_of_interest, hide_orgs_without_reporting_relationship })
		.derive({
			selected_group_reports_to_selected_supervisor_group: d => d.group == supervised_group_of_interest
		})
		.groupby('organization', 'selected_group_reports_to_selected_supervisor_group')
		.count()
		.impute({ count: () => 0 }, { expand: ['organization', 'selected_group_reports_to_selected_supervisor_group'] })
		.groupby('organization')
		.derive({
			percent: d => Math.round(d.count / aq.op.sum(d.count) * 1000) / 10
		})
		.filter(d => hide_orgs_without_reporting_relationship ? (d.percent != 100 & d.percent != 0) : true)
		.orderby(aq.desc('percent'), 'organization')
		.rename({'count': '#', 'percent': '%'}),
	{
		width: {
			'#': 50,
			'%': 50
		}
	}
))
```

**Focusing back on ${org_to_analyze_label}, here are all the positions that report to ${supervisor_group_of_interest}-classified positions.** You can sort by `group` to see which of these positions are ${supervised_group_of_interest}.

If you find a particular team of interest, you can copy a `supervisor_gid`, then [use _that_ as a “Supervisor of interest” in the department analysis page](/explore/department#supervisor-of-interest-(and-departmental-structure)) to see which positions report to that supervisor. This can surface, for example, positions with other classifications that report to the same supervisor.

```js
view(Inputs.table(departmental_positions_with_supervisor_of_interest))
```

***

_(The above is more or less complete, while the remaining portions are a work in progress.)_

***

## More about ${supervisor_group_of_interest}-classified supervisors

<div class="tip">
	<p>This analysis is affected by the selections you’ve made above—change those to change the reporting here! (Sorry in advance for the scrolling.)</p>
</div>

<div class="caution">
	<p>The data in PCIS+ isn’t always complete—for some departments, supervisor positions are referenced that don’t appear anywhere else in the dataset. We’ve created <a href="/about/inferred-positions">“inferred positions”</a> for any supervisor positions that are referenced (since the dataset includes supervisor group and level), but this can cause various “orphan” reporting trees, because we don’t know much about the “inferred supervisors”—these inconsistencies affect the calculations below.</p>
	<p>So, while they’re likely of decent accuracy (and certainly are reasonable for indicating trends, if anything), as ever, please take them with a critical eye!</p>
</div>

### ${supervisor_group_of_interest}-classified supervisors in the core

```js
{
  const n_positions_with_supervisor_group = positions_with_supervisor_group.length;

  const pct_supervisors_of_group = Math.floor(supervisors.length / n_positions_with_supervisor_group * 1000) / 10

  let supervisory_frequency = "uncommon"

  if (pct_supervisors_of_group > 30 & pct_supervisors_of_group < 70) {
    supervisory_frequency = "relatively common"
  } else if (pct_supervisors_of_group >= 70) {
    supervisory_frequency = "quite common"
  }
  
  display(html`<strong>How common is it for ${supervisor_group_of_interest} positions to be supervisors?</strong> There are ${supervisors.length.toLocaleString()} ${supervisor_group_of_interest}-classified supervisors in the core. This is ${pct_supervisors_of_group}% of the ${n_positions_with_supervisor_group.toLocaleString()} total ${supervisor_group_of_interest} positions, suggesting it’s ${supervisory_frequency}.`)
}
```

The number of people reporting to a supervisor can be an interesting indicator. We can count it in three ways (which we’ll break out by position level in the tables that follow, since that’s often an important factor):

- `direct`: positions with a 1:1 reporting relationship with the supervisor
- `indirect`: positions whose manager (or manager’s manager, or so on) have a 1:1 reporting relationship with the supervisor (varying levels of “skip level”, in other words)
- `total`: `direct` and `indirect` combined

Let’s start with direct reports:

```js
view(Inputs.table(
	aq.from(supervisors)
		.groupby('level')
		.rollup({
			count: aq.op.count(),
			min_reports: d => aq.op.min(d.reports_direct),
			med_reports: d => Math.round(aq.op.median(d.reports_direct)),
			avg_reports: d => Math.round(aq.op.average(d.reports_direct)),
			max_reports: d => aq.op.max(d.reports_direct),
		})
		.orderby(aq.desc('level'))
))
```

And what about total reports? (We’ll not bother with indirect reports, though it’s available in the underlying data if you’re interested.)

```js
view(Inputs.table(
	aq.from(supervisors)
		.groupby('level')
		.rollup({
			count: aq.op.count(),
			min_reports: d => aq.op.min(d.reports_total),
			med_reports: d => Math.round(aq.op.median(d.reports_total)),
			avg_reports: d => Math.round(aq.op.average(d.reports_total)),
			max_reports: d => aq.op.max(d.reports_total),
		})
		.orderby(aq.desc('level'))
))
```

### ${supervisor_group_of_interest}-classified supervisors at ${org_to_analyze_label}

Direct reports:

```js
view(Inputs.table(
	aq.from(supervisors)
		.params({ org_to_analyze })
		.filter(d => d.organization_code == org_to_analyze)
		.groupby('level')
		.rollup({
			count: aq.op.count(),
			min_reports: d => aq.op.min(d.reports_direct),
			med_reports: d => Math.round(aq.op.median(d.reports_direct)),
			avg_reports: d => Math.round(aq.op.average(d.reports_direct)),
			max_reports: d => aq.op.max(d.reports_direct),
		})
		.orderby(aq.desc('level'))
))
```

Total reports:

```js
view(Inputs.table(
	aq.from(supervisors)
		.params({ org_to_analyze })
		.filter(d => d.organization_code == org_to_analyze)
		.groupby('level')
		.rollup({
			count: aq.op.count(),
			min_reports: d => aq.op.min(d.reports_total),
			med_reports: d => Math.round(aq.op.median(d.reports_total)),
			avg_reports: d => Math.round(aq.op.average(d.reports_total)),
			max_reports: d => aq.op.max(d.reports_total),
		})
		.orderby(aq.desc('level'))
))
```

**Here are all the ${supervisor_group_of_interest}-classified supervisors at ${org_to_analyze_label}.** This table includes various columns on their number of reports. You can use a `supervisor_gid` found in the positions table above as a `position_gid` in this table, to find the supervisor for a given position.

```js
view(Inputs.table(departmental_supervisors))
```



## TODO: More about (chosen group) to (chosen supervisor group) in the GC

e.g., this stat, but in the GC: Of the PM-supervised positions at Infrastructure Canada, 5 are EC positions. The EC group makes up 3.9% of positions supervised by PM-classified supervisors at Infrastructure Canada.



<!-- # Loading code -->

<!-- ## Specific -->

```js
const positions_with_supervisor_group = PCIS.query_positions_graph_db(
  `SELECT * FROM nodes WHERE "group" = '${supervisor_group_of_interest}'`
)
```

```js
const supervisors = positions_with_supervisor_group
	.filter(d => d.is_supervisor)

const departmental_supervisors = supervisors
	.filter((position) => position.organization_code == org_to_analyze)
```



```js
const departmental_positions_with_supervisor_and_group_of_interest = departmental_positions_with_supervisor_of_interest
	.filter(position => position.group == supervised_group_of_interest)
```

```js
const groups_reporting_to_supervisor_group = aq.from(positions_with_supervisor_of_interest)
  .groupby("group")
  .count()
  .rename({ count: "n_positions" })
  .orderby(aq.desc("n_positions"))
  .objects()
```

```js
const departmental_positions_with_supervisor_of_interest = positions_with_supervisor_of_interest
	.filter(position => position.organization_code == org_to_analyze)
```

```js
const org_codes_with_supervisor = aq.from(positions_with_supervisor_of_interest)
  .groupby("organization_code", "organization")
  .count()
  .rename({ count: "n_positions" })
  .orderby("organization")
  .filter(d => d.organization !== null)
  .objects()
```

```js
const positions_with_supervisor_of_interest = PCIS.query_positions_graph_db(
  `SELECT * FROM nodes WHERE supervisor_group = '${supervisor_group_of_interest}'`
)
```

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
const gc_positions = PCIS.gc_positions()
```
