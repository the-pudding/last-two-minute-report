setup:
	mkdir processing
	cd processing; mkdir pdf text boxscore html csv output

concat: 
	csvstack output/games/* > .tmp/concat.csv

convert:
	cd analysis; jupyter nbconvert --to python explore.ipynb;

# 1
latest:
	npm run get-games 10
	npm run parse-games
	csvstack output/games/* > .tmp/concat.csv

# 2
incorrect:
	cd custom; python incorrect-call.py;

# 3
merge-incorrect:
	csvjoin -c 'play_id,play_id' --outer \
	.tmp/concat.csv custom/incorrect_call_with_ref.csv \
	| csvcut -C play_id2 \
	> output/all_games.csv

# 4
commit-latest:
	git add output/all_games.csv
	git add output/games/*.csv
	git add custom/*.csv
	git add processing/text/*.txt
	git commit -m 'update with latest data'
	git push

#5
web-data:
	cd analysis; python explore.py;

#6 
copy-data:
	rm -rf web/src/assets/data
	cp -fr analysis/output web/src/assets/data
	csvjson -k key --no-inference analysis/output/web_summary.csv > web/template-data/summary.json

#7
commit-web:
	git add analysis/**/*
	git add web/src/assets/data/*.csv
	git add web/template-data/summary.json
	git commit -m 'update web data'
	git push