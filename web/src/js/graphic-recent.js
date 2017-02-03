import * as d3 from 'd3'

const graphic = d3.select('.graphic__recent')

function cleanData(row) {
	return {
		...row,
	}
}

function init() {
	d3.csv('assets/data/web_recent.csv', cleanData, (err,  data) => {
		console.log(data)
	})
}

export default { init }
