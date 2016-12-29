const fs = require('fs')
const shell = require('shelljs')
const cheerio = require('cheerio')
// const request = require('request')
// const csv = require('fast-csv')

//because the nba is great and decided to be inconsistent so we need both ways
const teamAbbrLookup = {'Hawks': 'ATL','Nets': 'BKN','Celtics': 'BOS','Hornets': 'CHA','Bulls': 'CHI','Cavaliers': 'CLE','Mavericks': 'DAL','Nuggets': 'DEN','Pistons': 'DET','Warriors': 'GSW','Rockets': 'HOU','Pacers': 'IND','Clippers': 'LAC','Lakers': 'LAL','Grizzlies': 'MEM','Heat': 'MIA','Bucks': 'MIL','Timberwolves': 'MIN','Pelicans': 'NOP','Knicks': 'NYK','Thunder': 'OKC','Magic': 'ORL','76ers': 'PHI','Suns': 'PHO','Trail Blazers': 'POR','Kings': 'SAC','Spurs': 'SAS','Raptors': 'TOR','Jazz': 'UTA', 'Wizards': 'WAS'}
const teamNameLookup = {'ATL': 'Hawks','BKN': 'Nets','BOS': 'Celtics','CHA': 'Hornets','CHI': 'Bulls','CLE': 'Cavaliers','DAL': 'Mavericks','DEN': 'Nuggets','DET': 'Pistons','GSW': 'Warriors','HOU': 'Rockets','IND': 'Pacers','LAC': 'Clippers','LAL': 'Lakers','MEM': 'Grizzlies','MIA': 'Heat','MIL': 'Bucks','MIN': 'Timberwolves','NOP': 'Pelicans','NYK': 'Knicks','OKC': 'Thunder','ORL': 'Magic','PHI': '76ers','PHO': 'Suns','PHX': 'Suns','POR': 'Trail Blazers','SAC': 'Kings','SAS': 'Spurs','TOR': 'Raptors','UTA': 'Jazz','WAS': 'Wizards'}

/* 
	get date to start scraping from based on command line params 
	scrape nba official 2 minute archive back to that date
*/

function init() {
	// const command = `curl -o archive.html http://official.nba.com/nba-last-two-minute-reports-archive/`
	// shell.exec(command)
	// how many games to go back
	let maxGames = 9999
	if(process.argv.length > 2 && !isNaN(+process.argv[2])) maxGames = +process.argv[2]
	
	const urls = scrapeGameLinks()
	savePDFs(urls, () => convertPDFs())

}

// scrape archive and get links to each game's pdf
function scrapeGameLinks() {
	$ = cheerio.load(fs.readFileSync('archive.html'))
	const urls = []
	$('.entry-content p a').each(function(i, el) {
		const url = $(el).attr('href')
		const valid = url.startsWith(`http://official.nba.com/`)
		if (valid) urls.push(url)
	})
	return urls
}

function savePDFs(urls, cb) {
	let i = 0
	const next = () => {
		const command = `cd pdf; curl -O ${urls[i]}`
		shell.exec(command, { silent: true }, () => {
			i++
			if (i < urls.length) next()
			else cb()
		})
	}
	next()
}

function convertPDFs() {
	const command = `cd pdf; for file in *.pdf; do pdftotext -layout "$file" "../text/$file.txt"; done`
	shell.exec(command)
}

var formatDateUrl = function(date) {
	var day = date.getDate();
	var month = date.getMonth() + 1;
	var year = date.getFullYear();

	month = month < 10 ? '0' + month : month;
	day = day < 10 ? '0' + day : day;

	return year + month + day;
};

//write to csv file
var outputData = function(output) {
	var ws = fs.createWriteStream('data/output-' + _dateString + '.csv');
	csv
		.write(output, {headers: false})
		.pipe(ws);
};



/* GAME PDF EXTRACTION */ 
//the big loop that goes through each pdf link and downloads it
var getGameData = function(data) {
	var numGames = data.length;
	//headers
	var output = [{
		'quarter': 'quarter',
		'time': 'time',
		'call_category': 'call_category',
		'call_type': 'call_type',
		'committing_player': 'committing_player',
		'committing_team': 'committing_team',
		'disadvantaged_player': 'disadvantaged_player',
		'disadvantaged_team': 'disadvantaged_team',
		'decision': 'decision',
		'special': 'special',
		'comment': 'comment',
		'flag': 'flag',
		'date': 'date',
		'away': 'away',
		'home': 'home',
		'winner': 'winner',
		'game': 'game',
		'video': 'video',
		'ref_1': 'ref_1',
		'ref_2': 'ref_2',
		'ref_3': 'ref_3',
		'game_info': 'game_info',
		'source': 'source'
	}];

	// go thru each link and process each pdf
	var next = function(index) {
		// returns extracted data
		console.log('\n', data[index].text);
		processPDF(data[index], function(err, items) {
			if(err) {
				console.log(err);
			} else if(items) {
				output = output.concat(items);
			}

			index--;
			if(index > -1) {
				next(index);
			} else {
				console.log('\n-- Enjoy your data --'.green);
				outputData(output);
			}
		});
	};

	//start at the end (the beginning, ... hahaha)
	next(numGames - 1);
};

//converts PDF to html and extract/clean data
var processPDF = function(datum, cb) {
	//pull pdf down locally so we can convert it to html
	console.log(datum.url);
	savePDF(datum.url, function(error) {
		if(error) {
			cb(error);
		} else {
			//convert to html
			convertPDF2HTML(function(error) {
				if(error) {
					cb(error);
				} else {
					//proceed to extraction
					extractData(datum, cb);
				}
			});
		}
	});
};

//save down pdfs of each game locally
var savePDF = function(url, cb) {
	request
		.get(url)
		.pipe(fs.createWriteStream('temp.pdf'))
		.on('error', function(error) {
			cb(error);
		})
		.on('close', function() {
			cb();
		});		
};

//convert pdf to html
var convertPDF2HTML = function(cb) {
	
	var converter = new pdftohtml('.', _filename + '.pdf', _filename + '.html');
	converter.preset('default');

	converter.success(function() {
		cb();
	});

	converter.error(function(error) {
	  cb(error);
	});

	// converter.progress(function(ret) {
	//   // console.log ((ret.current*100.0)/ret.total + ' %');
	// });
	converter.convert();	
};

//pull data from pdfs and create csv
var extractData = function(datum, cb) {
	var teams = getTeamsFromScore(datum.text);

	if(teams) {
		var started = false;
		var collectingData = false;
		var matchupDetails;
		var cleanData = [];
		var rawData = [];
		var html;

		var officials = [];

		$ = cheerio.load(fs.readFileSync(_filename + '.html'));
		var rows = $('body').find('.t');
		var videos = $('body').find('a.l');

		rows.each(function(i, el) {
			//start where the data starts
			html = $(el).html().trim();

			//don't start until we hit the matchup
			if(!started && html.indexOf(teams.winner) === 0 || html.indexOf(teams.loser) === 0) {
				started = true;
				matchupDetails = cleanMatchup(teams, html);
			}

			if(started) {
				//if it starts with Q# then it is the beginning...without fail (so far)
				//Once it hits Video, we are done with that row of data
				var start = /^Q[0-9]/.test(html);
				var stop = html ==='Video' ? true : false;

				//turn on the data faucet
				if(start) {
					collectingData = true;
				}

				//stop collecting and clean the row
				if(stop) {
					collectingData = false;
					var clean = cleanRow(rawData, matchupDetails);
					clean.date = matchupDetails.date;
					clean.home = matchupDetails.home;
					clean.away = matchupDetails.away;
					clean.winner = matchupDetails.winner;
					clean.game = matchupDetails.game;
					clean['game_info'] = matchupDetails.link;
					clean['source'] = datum.url;
					cleanData.push(clean);
					rawData = [];
				}

				//drip drip drip
				if(collectingData) {
					//strip out everything in between the brackets
					var clean = html.split(/<.*?>/g);
					clean.forEach(function(str) {
						str = str.trim();
						if(str) {
							rawData.push(str);
						}
					});
				}
			}
		});

		if(cleanData.length !== videos.length) {
			console.log('video mismatch'.red);
		}

		videos.each(function(i, el) {
			//flag warning to manually check if not same number of videos and rows of data
			var url = $(el).attr('href');
			if(cleanData[i]) {
				cleanData[i].video = url;
			}
		});

		//get the refs
		request(matchupDetails.link, function (error, response, body) {
	  		if (!error && response.statusCode == 200) {
				$refs = cheerio.load(body);
				$refs('body').find('#nbaGameInfoContainer li').each(function(i,el) {
					var liText = $(el).text().trim();
					if(liText.indexOf('Officials:') === 0) {
						var sub = liText.substring(10, liText.length);
						var refs = sub.split(',');
						refs.forEach(function(el, i) {
							officials.push(el.trim()); 
						});
					}
				});

				for(var c = 0; c < cleanData.length; c++) {
					cleanData[c]['ref_1'] = officials[0];
					cleanData[c]['ref_2'] = officials[1];
					cleanData[c]['ref_3'] = officials[2];
				}
			}
			cb(null, cleanData);
		});
	} else {
		cb('error getting teams - skip');
	}
};

var getTeamsFromScore = function(score) {
	var split = score.split(/,|\./);
	for(var s = 0; s < split.length; s++) {
		split[s] = split[s].trim().replace(/\s/, ' ');
	}

	//normal if 2 things
	if(split.length === 2) {
		var winner = split[0];
		var loser = split[1];

		var ot = loser.indexOf('(');
		if(ot > -1) {
			loser = loser.substring(0, (ot - 1));
		}

		// get rid of OT and score
		var winner = winner.substring(0, winner.lastIndexOf(' '));
		var loser = loser.substring(0, loser.lastIndexOf(' '));
			
		return {winner: winner, loser: loser};
	} else {
		console.log('errror getting teams from score'.red);
		return false;
	}
};

//get the winner/loser home/away and date of the game
var cleanMatchup = function(winnerLoser, sides) {
	var split = sides.split('(');

	if(split.length === 2) {
		var teams = split[0].split('@');
		var away = teams[0].trim();
		var home = teams[1].trim();
		var date = split[1].substring(0, split[1].length - 1);
		var tempDate = new Date(date);

		var gameInfoLink = 'http://www.nba.com/games/';
		gameInfoLink += formatDateUrl(tempDate) + '/';
		gameInfoLink += _teams[away] + _teams[home] + '/gameinfo.html';

		return {away: away, home: home, date: date, winner: winnerLoser.winner, game: sides, link: gameInfoLink};
	} else {
		return {};
	}
};

//helper function to see if a val is part of a specific pdf column
var isMatch = function(str, prop) {
	var props = {
		'quarter': function(str) {
			return /^Q[0-9]/.test(str);
		},
		'time': function(str) {
			return /^\d\d\:\d\d\.\d/.test(str);
		},
		'call': function(str) {
			//exception: Jump Ball, Other
			return /[A-Za-z\s]+\:[A-Za-z\s]+/.test(str)
				|| str === 'Jump Ball'
				|| str === 'Other'
		},
		'committing_player': function(str) {
			return  /^[A-Za-z\s\-\']+$/.test(str) && !props['decision'](str);
		},
		'disadvantaged_player': function(str) {
			return  /^[A-Za-z\s\-\']+$/.test(str) && !props['decision'](str);
		},
		'decision': function(str) {
			return /^CC|IC|CNC|INC/.test(str);
		},
		'comment': function(str) {
			// can span multiple lines, last one ends with period though...
			return true;
		}
	};

	return props[prop](str);
};

//returns a sanitized output of a single row the data we just extracted
var cleanRow = function(input, matchup) {
	var order = ['quarter', 'time', 'call', 'committing_player', 'disadvantaged_player', 'decision', 'comment'];
	var output = { 
		'quarter': null, 
		'time': null, 
		'call_category': null,
		'call_type': null,
		'committing_player': null, 
		'disadvantaged_player': null, 
		'decision': null,
		'special': null,
		'comment': null,
		'flag': null
	};

	//check first 3
	var isQuarter = isMatch(input[0], 'quarter');
	var isTime = isMatch(input[1], 'time'); 
	var isCall = isMatch(input[2], 'call');

	//if first 3 don't match this order, then it mark as suspect
	if(!isQuarter || !isTime || !isCall) {
		output.flag = '-unusual order of data';
	}

	var len = input.length;
	//go thru each value and put its place in the output
	for(var i = 0; i < len; i++) {
		var val = entities.decode(input[i]);
		for(var o = 0; o < order.length; o++) {
			var prop = order[o];
			var match = isMatch(val, prop);
			if(match) {
				//if nothing, set it
				if(!output[prop]) {
					//special decisions
					if(prop === 'decision' && val.charAt(val.length - 1) === '*') {
						output.special = true;
						output[prop] = val.substring(0, val.length - 1);
					}
					//split up call to catgory and type
					else if(prop === 'call') {
						var split = val.split(':');
						output['call_category'] = split[0].trim();
						if(split[1]) {
							output['call_type'] = split[1].trim();
						}
					} else {
						output[prop] = val;
					}
					break;
				}
				else {
					if(prop === 'comment') {
						output[prop] += ' ' + val;
						break;
					} else if(prop === 'quarter' || prop === 'time' || prop === 'decision') {
						output.flag = '-duplicate entry';
					}
				}
			}
		}
	}

	//determine team for committing and disadvantaged
	output['committing_team'] = getTeamFromComment(output['committing_player'], output['comment']);
	output['disadvantaged_team'] = getTeamFromComment(output['disadvantaged_player'], output['comment']);

	var teamIdentified = false;

	if(output['committing_team']) {
		if(output['committing_team'].indexOf('error') === 0) {
			if(!output['flag']) {
				output['flag'] = '';
			} else {
				output['flag'] += output['committing_team'];	
			}
			output['committing_team'] = null;
		} else {
			teamIdentified = true;
		}
	}

	if(output['disadvantaged_team']) {
		if(output['disadvantaged_team'].indexOf('-error') === 0) {
			if(!output['flag']) {
				output['flag'] = '';
			} else {
				output['flag'] += output['disadvantaged_team'];	
			}
			output['disadvantaged_team'] = null;
		} else {
			teamIdentified = true;
		}
	}

	//check if we need to fill in the other one by default if nothing found
	if(teamIdentified && output['committing_team'] && !output['disadvantaged_team']) {
		output['disadvantaged_team'] = output['committing_team'] === matchup.home ? matchup.away : matchup.home;
	}

	return output;
};

var getTeamFromComment = function(player, comment) {
	if(player && comment) {
		//just last name
		var startLastName = player.lastIndexOf(' ');
		var lastName = player.substring(startLastName + 1, player.length);
		var nameLength = lastName.length;

		//strip whitespace and deal with 's and what not
		comment = comment.replace(/\'s/g, '').replace(/\' /g, ' ').replace(/ /g, '');

		var nameWithTeamIndex = comment.indexOf(lastName + '(');
		//check for Lastname( in comment
		if( nameWithTeamIndex > -1) {
			//+1 for the (
			var start = nameWithTeamIndex + nameLength + 1;
			var team = comment.substring(start, start + 3);
			return _teamsAbbr[team];
		} else if(comment.indexOf(lastName) > -1) {
			return '-error: player found in comment with no team';
		} else {
			return '-error: no reference to player in comment';
		}
	}

	return null;
}

init()