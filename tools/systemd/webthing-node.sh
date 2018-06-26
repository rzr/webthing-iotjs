#!/bin/bash -xe
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

which npm
pwd
ls node_modules || npm install
cat /sys/kernel/debug/gpio ||:
gpio -g mode 11 up
cat /sys/kernel/debug/gpio ||:

over=false
hostname=sfb.lan
while ! $over ; do ping -c 1 $hostname && over=true || sleep 1 ; done

npm start
