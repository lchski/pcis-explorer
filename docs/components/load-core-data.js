import { FileAttachment } from "npm:@observablehq/stdlib";
import { DuckDBClient } from "npm:@observablehq/duckdb";
import * as aq from "npm:arquero";
import * as Inputs from "npm:@observablehq/inputs";

const positions_graph_db = await DuckDBClient.of({
	nodes: FileAttachment("../data/positions-graph-nodes.parquet"),
	edges: FileAttachment("../data/positions-graph-edges.parquet"),
})



export async function gc_positions() {
	return await positions_graph_db.query(
		`SELECT work_location, position_status FROM nodes`
	);
}

export async function query_positions_graph_db(qry) {
	return await positions_graph_db.query(qry);
}



export async function org_codes() {
	const qry = await positions_graph_db.query(`
		SELECT
			"organization_code",
			"organization",
			COUNT("organization_code") as n_positions
		FROM nodes
		GROUP BY "organization", "organization_code"
		ORDER BY "organization"
	`)

	return qry
		.filter((d) => d.organization_code != null);
}

export function org_to_analyze_input(org_codes) {
	return Inputs.select(org_codes.map((d) => d.organization_code), {
		label: "Organization to analyze",
		format: (org_code_to_format) => {
			const org_being_rendered = org_codes.find((org_code) => org_code.organization_code === org_code_to_format)

			const positions_descriptor = (org_being_rendered.n_positions == 1) ? 'position' : 'positions'

			return `${org_being_rendered.organization} (${org_being_rendered.n_positions.toLocaleString()} ${positions_descriptor})`
		}
	})
}


export function org_to_analyze_label(org_codes, org_to_analyze) {
	return org_codes.filter((org) => org.organization_code == org_to_analyze)[0]['organization']
}



export async function departmental_positions(org_to_analyze) {
	const qry = await positions_graph_db.query(
		`SELECT * FROM nodes WHERE organization_code = '${org_to_analyze}'`
	)

	return aq.from(qry)
		.derive({
			group_level: (d) => `${d.group}-${d.level}`,
			supervisor_group_level: (d) => `${d.supervisor_group}-${d.supervisor_level}`,
		})
		.objects()
}



export function top_n_for_grouping_var(grouping_var, positions_to_analyze, limit_to_occupied_filter, n = 10, apply_limit_to_occupied_filter = true, return_view = true) {
	const top_n = aq.from(positions_to_analyze)
		.derive({
			[grouping_var]: aq.escape(d => String(d[grouping_var])) // to convert "null" values to a string
		})
		.params({ apply_limit_to_occupied_filter, limit_to_occupied_filter })
		.filter(d => apply_limit_to_occupied_filter ? (limit_to_occupied_filter ? d.position_status == "Occupied" : true) : true)
		.groupby(grouping_var)
		.count()
		.derive({ percent: d => Math.round(d.count / aq.op.sum(d.count) * 1000) / 10 })
		.orderby(aq.desc("count"))
		.derive({ row: aq.op.row_number() })
		.select(['row', aq.all()])
		.slice(0, n)

	if (return_view) {
		return Inputs.table(top_n, {
			width: {
				row: 25,
				count: 100,
				percent: 75
			}
		})
	}

	return top_n
}
