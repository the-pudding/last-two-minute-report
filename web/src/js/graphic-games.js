import * as d3 from 'd3'
import './utils/includes-polyfill'

const graphic = d3.select('.graphic__games')
const chart = graphic.select('.graphic__chart')
const colors = ['#eeeeee','#f2c7ca','#f2a1a7','#ed7886']


function cleanData(row) {
	return {
		...row,
		incorrect: +row.incorrect,
	}
}

function loadGames(cb) {
	d3.csv('assets/data/web_games.csv', cleanData, (err,  data) => {
		cb(null, data)
	})
}

function createChart(err, data) {
	const gameData = data[0]
	const maxIncorrect = d3.max(gameData, d => d.incorrect)
	const scale = d3.scaleThreshold()
	
	scale
		.domain([1, 3, 5])
		.range(colors)
	
	chart.selectAll('.game')
		.data(gameData)
	.enter().append('div')
		.attr('class', 'game')
		.style('background-color', d => scale(d.incorrect))

}

function init() {
	const q = d3.queue()
	q
		.defer(loadGames)
		.awaitAll(createChart)
}

export default { init }
