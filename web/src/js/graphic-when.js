import * as d3 from 'd3'

const margin = { top: 12, right: 12, bottom: 36, left: 36 }
const graphic = d3.select('.graphic__when')
const chart = graphic.select('.graphic__chart')
let svg
const scale = { x: null, y: null }

function cleanData(row) {
	return {
		...row,
		bin: +row.bin * 5 + 5,
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

	g.attr('transform', `translate(${margin.left},${margin.top})`)

	scale.x = d3.scaleBand()
		.paddingInner(0.1)
		.align(0.1)

	scale.y = d3.scaleLinear()

	const keys = ['ic', 'inc']

	const max = d3.max(whenData, d => d.total)
	scale.x.domain(whenData.map(d => d.bin))
	scale.y.domain([0, max])

	// axis
	g.append('g')
		.attr('class', 'axis axis--y')

	g.append('g')
		.attr('class', 'axis axis--x')

	const label = svg.append('g').attr('class', 'labels')

	label.append('text')
		.attr('class', 'label--y')
		.text('Number of calls')
			.attr('text-anchor', 'middle')

	label.append('text')
		.attr('class', 'label--x')
		.text('Seconds left')
			.attr('text-anchor', 'middle')

	// bars
	g.append('g')
		.selectAll('g')
		.data(d3.stack().keys(keys)(whenData))
		.enter().append('g')
			.attr('class', d => `g-${d.key}`)
		.selectAll('rect')
		.data(d => d)
		.enter().append('rect')
}

function resize() {
	const width = chart.node().offsetWidth - (margin.left + margin.right)
	const height = Math.floor(width * 0.67) - (margin.top + margin.bottom)

	svg
		.attr('width', width + (margin.left + margin.right))
		.attr('height', height +(margin.top + margin.bottom))

	scale.x.rangeRound([0, width])
	scale.y.rangeRound([height, 0])

	svg.select('.axis--y')
		.call(d3.axisLeft(scale.y).tickSize(-width))
		.selectAll('text')
			.attr('x', -5)

	svg.select('.axis--x')
		.attr('transform', `translate(0,${height})`)
		.call(d3.axisBottom(scale.x))

	const labelXOff = height + (margin.top + margin.bottom)
	svg.select('.label--x')
		.attr('transform', `translate(${width / 2},${labelXOff})`)

	svg.select('.label--y')
		.attr('transform', `translate(${12},${height / 2}) rotate(-90)`)

	svg.selectAll('rect')
		.attr('x', d => scale.x(d.data.bin))
		.attr('y', d => scale.y(d[1]))
		.attr('height', d => scale.y(d[0]) - scale.y(d[1]))
		.attr('width', scale.x.bandwidth())
}

function init() {
	d3.csv('assets/data/web_when.csv', cleanData, (err,  data) => {
		if (err) console.error(err)
		createChart(data)
		resize()
	})
}

export default { init }
