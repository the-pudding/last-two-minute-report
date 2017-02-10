import * as d3 from 'd3'

const margin = 20
const graphic = d3.select('.graphic__when')
const chart = graphic.select('.graphic__chart')
let svg
const scale = { x: null, y: null }

function cleanData(row) {
	return {
		...row,
		bin: +row.bin,
		cc: +row.cc,
		ic: +row.ic,
		inc: +row.inc,
		total: +row.ic + +row.inc,
	}
}

function createChart(data) {
	const whenData = data.sort((a, b) => d3.ascending(a.bin, b.bin))
	svg = chart.append('svg')
	
	const g = svg.append('g')
	scale.x = d3.scaleBand()
		.paddingInner(0.05)
		.align(0.1)

	scale.y = d3.scaleLinear()

	const keys = ['ic', 'inc']

	const max = d3.max(whenData, d => d.total)
	scale.x.domain([whenData.map(d => d.bin)])
	scale.y.domain([0, max])

	// g.append('g')
	// 	.selectAll('g')
	// 	.data(d3.stack().keys(keys)(whenData))
	// 	.enter().append('g')
	// 		.attr('class', )

}

function init() {
	d3.csv('assets/data/web_when.csv', cleanData, (err,  data) => {
		if (err) console.error(err)
		createChart(data)
	})
}

export default { init }
