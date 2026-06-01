# adityajhunjhunwala.com — build + deploy
# Primary path: git push → Vercel auto-deploys
# Fallback path (VPS): make deploy

REMOTE = root@91.108.110.72
DEST   = /var/www/adityajhunjhunwala.com

build:
	npx @11ty/eleventy
	cp -rf css _site/css
	cp -rf images _site/images

deploy: build
	rsync -avz --delete _site/ $(REMOTE):$(DEST)/

.PHONY: build deploy
