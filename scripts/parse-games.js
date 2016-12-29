/* 
	convert text files to csv
*/

const fs = require('fs')
const cwd = process.cwd()
const teamLookup = require(`${cwd}/scripts/team-lookup.js`)

function cleanLines(lines) {
	return lines
		.map(line => {
			// split each line by 2+ whitespace (tabs between columns)
			// trim and remove empties
			return line.split(/\s{2,}/)
				.map(chunk => chunk.trim())
				.filter(chunk => chunk.length)
		})
}

function extractMeta(lines) {
	// rule: starts with a team name and contains an @ symbol
	const match = lines
		.map(line => line.join(' '))
		.filter(line => line.indexOf('@') > -1)
		.find(line => {
			const possibleTeam = line.split('@')[0].trim()
			return teamLookup.abbr[possibleTeam]
		})

	if (match) {
		const split = match.split('@')
		const away = split[0].trim()
		const splitAfter = split[1].split('(')
		const home = splitAfter[0].trim()
		const date = splitAfter[1].replace(')', '').trim()
		return { home, away, date }
	} 

	return null
}

function init() {
	// load txt file into array for of lines
	const lines = fs.readFileSync(`${cwd}/text/L2M-ATL-BKN-11-17-15.pdf.txt`)
		.toString()
		.split('\n')
	
	// clean each line
	const clean = cleanLines(lines)
	// clean.forEach(line => console.log(line))

	// grab the teams and date
	const meta = extractMeta(clean)

	// convert to structured data for each call
	// const data = extractData(clean)
}


init()
