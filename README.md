# Last Two Minute Report
Converts all PDFs released by the NBA's [Last Two Minute Report](http://official.nba.com/nba-last-two-minute-reports-archive/) to a single csv file. Additionally determines advantaged/disadvantaged team, and referees for that game.

The code is a bit involved because the NBA doesn't stick to a consistent format! Converting all the games at once takes a while since it needs to fetch supplemental data from [Basketball Reference](https://basketball-reference.com).

## Requirements
* [node](https://node.js.org)
* [csvkit](https://csvkit.readthedocs.org)

## Setup
* Clone repo and run `npm i`
* Run `make setup`

## Usage

If already setup, simply run `make latest`. This will do everything below and commit latest data to repo.

#### Get latest games from archive
`npm run get-games [max]` (optionally pass a number `[max]` to only download recent games)

#### Parse game data into csv
`npm run parse-games`

#### Concat to single csv
`make concat`

## Manual fixes
* conversion of pdf to text for `L2M-BKN-ORL-12-16-16.pdf` resulted in a period + line break for the last entry


## Resources
http://www.nbra.net/nba-officials/referee-biographies/
http://official.nba.com/referee-assignments/