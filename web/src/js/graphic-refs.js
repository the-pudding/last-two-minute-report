import * as d3 from 'd3'
import colors from './colors'

const colorsLight = {}

const graphic = d3.select('.graphic__refs')
const chart = graphic.select('.graphic__chart')

let scale
let refData

function lighten(hex) {
	const color = d3.color(hex)
	color.opacity = 0.3
	return color.toString()
}

function formatRate(num) {
	return d3.format('.2f')(num)
}

function formatComma(num) {
	return d3.format(',')(num)
}

function cleanData(row) {
	return {
		...row,
		ic: +row.ic,
		inc: +row.inc,
		games: +row.games,
		rate_ic: +row.ic / +row.games,
		rate_inc: +row.inc / +row.games,
	}
}

function createScale(data) {
	return {
		ic: d3.scaleQuantile().domain(data.map(d => d.ic)),
		inc: d3.scaleQuantile().domain(data.map(d => d.inc)),
		rate_ic: d3.scaleQuantile().domain(data.map(d => d.rate_ic)),
		rate_inc: d3.scaleQuantile().domain(data.map(d => d.rate_inc)),
	}
}

function getRange({ key, selected }) {
	switch (key) {
	case 'ic':
		return selected ? colors.sequentialRed : colorsLight.sequentialRed
	case 'inc':
		return selected ? colors.sequentialRed : colorsLight.sequentialRed
	case 'rate_ic':
		return selected ? colors.divergingReverse : colorsLight.divergingReverse
	case 'rate_inc':
		return selected ? colors.divergingReverse : colorsLight.divergingReverse
	default:
		return colors.diverging
	}
}

function updateTable({ col, order }) {
	const sortedData = refData.sort((a, b) => d3[order](a[col], b[col]))

	const tr = chart.selectAll('tbody tr')
		.data(sortedData, (d, i) => i)

	tr.select('.td-ic').text(d => formatComma(d.ic))
	tr.select('.td-inc').text(d => formatComma(d.inc))
	tr.select('.td-rate_ic').text(d => formatRate(d.rate_ic))
	tr.select('.td-rate_inc').text(d => formatRate(d.rate_inc))

	tr.select('.td-name').text(d => d.name)
	tr.select('.td-games').text(d => d.games)

	chart.selectAll('th')
		.classed('descending', false)
		.classed('ascending', false)

	const keys = ['games', 'ic', 'inc', 'rate_ic', 'rate_inc']
	keys.forEach((key) => {
		const selected = key === col

		if (scale[key]) {
			const range = getRange({ key, selected })
			scale[key].range(range)
			chart.selectAll(`.td-${key}`)
				.style('background-color', d => scale[key](d[key]))
				.classed('is-selected', selected)
		}

		const th = chart.select(`.th-${key}`)

		th.classed('is-selected', selected)

		if (selected) {
			const reverse = order === 'ascending' ? 'descending' : 'ascending'
			th.classed(order, true)
			th.classed(reverse, false)
		}
	})
}

function handleColumnClick() {
	const sel = d3.select(this)
	const col = sel.attr('data-col')
	const order = sel.classed('descending') ? 'ascending' : 'descending'
	updateTable({ col, order })
}

function createTable() {
	const tableEnter = chart.append('table')

	const headEnter = tableEnter.append('thead')
		.append('tr')

	headEnter.append('th')
		.attr('class', 'th-name')
		.text('Name')
		.classed('text', true)

	headEnter.append('th')
		.attr('class', 'th-games')
		.attr('data-col', 'games')
		.text('Games')
		.classed('number', true)
		.classed('descending', true)
		.on('click', handleColumnClick)

	headEnter.append('th')
		.attr('class', 'th-ic')
		.attr('data-col', 'ic')
		.text('IC')
		.classed('number', true)
		.classed('descending', true)
		.on('click', handleColumnClick)

	headEnter.append('th')
		.attr('class', 'th-inc')
		.attr('data-col', 'inc')
		.text('INC')
		.classed('number', true)
		.on('click', handleColumnClick)

	headEnter.append('th')
		.attr('class', 'th-rate_ic')
		.attr('data-col', 'rate_ic')
		.text('IC / game')
		.classed('number', true)
		.on('click', handleColumnClick)

	headEnter.append('th')
		.attr('class', 'th-rate_inc')
		.attr('data-col', 'rate_inc')
		.text('INC / game')
		.classed('number', true)
		.on('click', handleColumnClick)

	const bodyEnter = tableEnter.append('tbody')

	const trEnter = bodyEnter.selectAll('tr')
		.data(refData, (d, i) => i)
		.enter().append('tr')

	trEnter.append('td')
		.attr('class', 'td-name')
		.classed('text', true)

	trEnter.append('td')
		.attr('class', 'td-games')
		.classed('number', true)

	trEnter.append('td')
		.attr('class', 'td-ic')
		.attr('data-title', 'ic')
		.classed('number', true)

	trEnter.append('td')
		.attr('class', 'td-inc')
		.attr('data-title', 'inc')
		.classed('number', true)

	trEnter.append('td')
		.attr('class', 'td-rate_ic')
		.attr('data-title', 'rate_ic')
		.classed('number', true)

	trEnter.append('td')
		.attr('class', 'td-rate_inc')
		.attr('data-title', 'rate_inc')
		.classed('number', true)
}

function prepareData(data) {
	return data.filter(d => d.games > 20)
}

function setupEvents() {
	const cols = ['ic', 'inc', 'rate_ic', 'rate_inc']
	d3.select('.graphic__refs .button--swap').on('click', () => {
		const col = chart.select('th.is-selected').attr('data-col')
		const index = cols.findIndex(d => d === col) + 1
		const next = index < cols.length ? index : 0
		const nextCol = cols[next]
		chart.selectAll('th').classed('is-selected', false)
		chart.selectAll('td').classed('is-selected', false)
		chart.selectAll(`.th-${nextCol}`).classed('is-selected', true)
		chart.selectAll(`.td-${nextCol}`).classed('is-selected', true)
		updateTable({ col: nextCol, order: 'descending' })
	})
}

function init() {
	colorsLight.diverging = colors.diverging.map(lighten)
	colorsLight.divergingReverse = colors.divergingReverse.map(lighten)
	colorsLight.sequentialRed = colors.sequentialRed.map(lighten)
	colorsLight.sequentialGreen = colors.sequentialGreen.map(lighten)

	d3.csv('assets/data/web_refs.csv', cleanData, (err,  data) => {
		if (err) console.error(err)
		refData = prepareData(data)
		scale = createScale(refData)
		createTable()
		setupEvents()
		updateTable({ col: 'ic', order: 'descending' })
	})
}

export default { init }
