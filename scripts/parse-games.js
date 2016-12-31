/* 
	convert text files to csv
*/

const fs = require('fs')
const request = require('request')
const cheerio = require('cheerio')
const d3 = require('d3')
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
		.filter(line => line.length)
}

function parseAwayTeam(str) {
	// 'Trail Blazers '
	// 'Trail Blazers (109) '
	return str.split('(')[0].trim()
}

function parseHomeTeam(str) {
	// ' Trail Blazers (Nov 11, 2016)'
	// ' Trail Blazers (108) (Dec 23, 2016)'
	return str.split('(')[0].trim()
}

function parseDate(str) {
	// ' Trail Blazers (Nov 11, 2016)'
	// ' Trail Blazers (108) (Dec 23, 2016)'
	return str.replace(/\)/g, '').split('(').pop().trim()
}


function extractGameInfo(lines) {
	// eg 1: Pacers @ 76ers (Nov 11, 2016)
	// eg 2: Knicks (98) @ Hawks (102) (Dec 28, 2016)

	// just enough to get the home team and date so we can use basketballreference

	const match = lines
		.map(line => line.join(' '))
		.filter(line => line.indexOf('@') > -1)
		.find(line => {
			const afterAt = line.split('@')[1].trim()
			const possibleTeam = afterAt.split(' ')[0]
			return teamLookup.abbr[possibleTeam]
		})
	
	if (match) {
		const split = match.split('@')
		// [ 'Pacers ', ' 76ers (Nov 11, 2016)' ]
		// [ 'Hawks (109) ', ' Nuggets (108) (Dec 23, 2016)' ]
		const away = parseAwayTeam(split[0])
		const home = parseHomeTeam(split[1])
		const date = parseDate(split[1])
		
		const parsedDate = d3.timeParse('%b %d, %Y')(date)
		const formattedDate = d3.timeFormat('%Y%m%d')(parsedDate)
		const awayAbbr = teamLookup.abbr[away]
		const homeAbbr = teamLookup.abbr[home]
		const boxscoreURL = `http://www.basketball-reference.com/boxscores/${formattedDate}0${homeAbbr}.html`

		const id = `${formattedDate}${awayAbbr}${homeAbbr}`
		return { id, away: awayAbbr, home: homeAbbr, date: formattedDate, boxscore_url: boxscoreURL }
	} 

	return null
}

function getTeamFromComment({ player, comment }) {
	if (player && comment) {
		//just last name
		const startLastName = player.lastIndexOf(' ')
		const lastName = player.substring(startLastName + 1, player.length)
		const nameLength = lastName.length

		//strip whitespace and deal with 's and what not
		comment = comment.replace(/\'s/g, '').replace(/\' /g, ' ').replace(/ /g, '')

		const nameWithTeamIndex = comment.indexOf(lastName + '(')
		
		if( nameWithTeamIndex > -1) {
			//+1 for the (
			const start = nameWithTeamIndex + nameLength + 1
			const team = comment.substring(start, start + 3)
			return team
		} else if(comment.indexOf(lastName) > -1) {
			return 'error: player found in comment with no team'
		} else {
			return 'error: no reference to player in comment'
		}
	}

	return null
}

function extractReviews({ lines, videoURLs }) {
	const details = lines.filter(line => line[0].match(/Q\d/) && line[0].length === 2)
	const comments = lines.filter(line => line[0].startsWith('Comment:'))
	const reviews = details.map((d, i) => {
		return {
			period: d[0],
			time: d[1],
			call_type: d[2],
			committing_player: d[3],
			disadvantaged_player: d.length === 7 ? d[4] : null,
			review_decision: d.length >= 6 ? d[d.length - 2] : null,
			comment: comments[i][1],
			video: videoURLs[i],
		}
	})

	// add in team
	reviews.forEach(d => {
		d.committing_team = getTeamFromComment({ player: d.committing_player, comment: d.comment })
		d.disadvantaged_team = getTeamFromComment({ player: d.disadvantaged_player, comment: d.comment })
	})


	return reviews
}

function extractVideoURLs($) {
	const urls = []
	$('a').each(function(i, el) {
		const url = $(el).attr('href')
		const valid = url && url.startsWith(`http://official.nba.com/`)
		if (valid) urls.push(url.trim())
	})
	return urls
}

function extractRefs($) {
	const refs = []
	$('body').find('strong').each((i, el) => {
		const text = $(el).text().trim()
		if (text === 'Officials:') {
			$(el).nextAll().each((i2, el2) => {
				if (i2 < 3) refs.push($(el2).text().trim())
			})
		}
	})
	return refs
}

function extractScore($) {
	const score = []
	$('.scorebox').find('.score').each((i, el) => {
		score.push($(el).text().trim())
	})
	return score
}

function getBoxscoreInfo(info, cb) {
	let refs
	let score
	request(info.boxscore_url, (error, response, body) => {
		if (!error && response.statusCode == 200) {
			const $ = cheerio.load(body)
			refs = extractRefs($)
			score = extractScore($)
		}
		cb({ refs, score })
	})
}

function parse(file) {
	// load txt file into array for of lines
	const lines = fs.readFileSync(`${cwd}/text/${file}.txt`)
		.toString()
		.split('\n')
	
	const $ = cheerio.load(fs.readFileSync(`${cwd}/html/${file}.html`))

	// clean each line
	const clean = cleanLines(lines)

	// extract links from html
	const videoURLs = extractVideoURLs($)

	const reviews = extractReviews({ lines: clean, videoURLs: videoURLs })

	// grab the teams and date
	const info = extractGameInfo(clean)
		
	// get boxscore info and integrate into data rows
	getBoxscoreInfo(info, ({ refs, score }) => {
		reviews.forEach(row => {
			row.id = info.id
			row.away = info.away
			row.home = info.home
			row.date = info.date
			row.ref_1 = refs[0]
			row.ref_2 = refs[1]
			row.ref_3 = refs[2]
			row.score_away = score[0]
			row.score_home = score[1]
		})

		const csvOut = d3.csvFormat(reviews)
		fs.writeFileSync(`${cwd}/csv/${info.id}.csv`, csvOut)
	})
}

function init() {
	const files = fs.readdirSync(`${cwd}/text`)
	console.log(files)
}


init()
