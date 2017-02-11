import * as d3 from 'd3'
import './utils/includes-polyfill'
import colors from './colors'

const graphic = d3.select('.graphic__players')
const chart = graphic.select('.graphic__chart')

function formatPercent(num) {
	return d3.format('.1%')(num)
}

function cleanData(row) {
	const player = row.player
	const against_total = +row.count_against
	const against_ic = +row.count_against_ic
	const against_inc = +row.count_against_inc
	const for_total = +row.count_for
	const for_ic = +row.count_for_ic
	const for_inc = +row.count_for_inc
	const net = +row.net
	const total = against_total + for_total
	const against_rate = against_total / total
	const for_rate = for_total / total
	return { player, total, against_total, for_total, net, against_rate, for_rate }
}

function createTable(data) {
	const playerData = data
		.filter(d => d.total > 15)
		.sort((a, b) => d3.descending(a.net / a.total, b.net / b.total))

	console.log(playerData)
	console.log(d3.extent(playerData, d => d.net))
	const scale = d3.scaleThreshold()

	scale
		.domain([0.2, 0.4, 0.6, 0.8])
		.range(colors.diverging)

	const tableEnter = chart.append('table')

	const headEnter = tableEnter.append('thead')
		.append('tr')

	headEnter.append('th').text('name').classed('text', true)
	headEnter.append('th').text('In favor').classed('number', true)
	headEnter.append('th').text('Against').classed('number', true)
	headEnter.append('th').text('Net').classed('number', true)
	headEnter.append('th').text('In favor %').classed('number', true)

	const bodyEnter = tableEnter.append('tbody')

	const trEnter = bodyEnter.selectAll('tr')
		.data(playerData)
		.enter().append('tr')

	trEnter.style('background-color', d => scale(d.for_rate))

	trEnter.append('td').text(d => d.player).classed('text', true)
	trEnter.append('td').text(d => d.for_total).classed('number', true)
	trEnter.append('td').text(d => d.against_total).classed('number', true)
	trEnter.append('td').text(d => d.net).classed('number', true)
	trEnter.append('td').text(d => formatPercent(d.for_rate)).classed('number', true)

}

function init() {
	d3.csv('assets/data/web_players.csv', cleanData, (err,  data) => {
		if (err) console.error(err)
		createTable(data)
	})
}

export default { init }
