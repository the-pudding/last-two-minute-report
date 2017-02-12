import * as d3 from 'd3'
import './utils/includes-polyfill'
import colors from './colors'

const graphic = d3.select('.graphic__games')
const chart = graphic.select('.graphic__chart')


function cleanData(row) {
	return {
		...row,
		incorrect: +row.incorrect,
	}
}

function createChart(data) {
	const gameData = data
	const scale = d3.scaleThreshold()

	scale
		.domain([1, 2, 4])
		.range(colors.sequentialRed)

	chart.selectAll('.game')
		.data(gameData)
	.enter().append('div')
		.attr('class', 'game')
		.style('background-color', d => scale(d.incorrect))
}

function init() {
	d3.csv('assets/data/web_games.csv', cleanData, (err,  data) => {
		if (err) console.error(err)
		createChart(data)
	})
}

export default { init }
