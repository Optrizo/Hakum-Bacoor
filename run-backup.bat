@echo off
echo Running Crew Members Backup at %date% %time%
cd /d "c:\Users\User\Desktop\Hakum-Bacoor"
node transfer-crew-data.js >> backup-logs.txt 2>&1
echo Backup completed at %date% %time% >> backup-logs.txt
echo.
