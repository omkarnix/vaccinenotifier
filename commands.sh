#Start node process
pm2 start -f vaccineNotifier.js


#Stop node process
pm2 delete vaccineNotifier

#View logs
pm2 logs

#in case of warning to start/delete the command use,
pm2 save --force
