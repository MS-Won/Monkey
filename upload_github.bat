@echo off
cd /d D:\MyProject\monkey
echo ".env" >> .gitignore
git init
git add .
git commit -m "240601 updated"
git branch -M main
git remote add origin https://github.com/MS-Won/Monkey_App.git
git push -u origin main
pause
