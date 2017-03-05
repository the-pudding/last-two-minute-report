github:
	rm -rf docs
	cp -r dist/prod/ ../docs
	git add -A
	git commit -m "update dev version"
	git push

s3-all:
	# aws s3 sync dist/prod s3://pudding.cool/2017/02/two-minute-report

live:
	aws s3 cp dist/prod s3://pudding.cool/2017/02/two-minute-report/ --recursive --exclude '*' --include '*.csv' --include 'index.html' --quiet
	aws cloudfront create-invalidation --distribution-id E13X38CRR4E04D --paths '/2017/02/two-minute-report*'
