#!/bin/bash -xe
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

which npm
pwd

over=false
hostname=sfb.lan
while ! $over ; do ping -c 1 $hostname && over=true || sleep 1 ; done

NODE_PATH=. node example/mastodon-thing

