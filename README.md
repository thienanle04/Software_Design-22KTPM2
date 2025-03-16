# Software_Design-22KTPM2
Set up env
1. python -m venv env
2. .\env\Scripts\Activate
3. pip install -r backend\requirements.txt

Migrations
1. cd backend
2. python manage.py makemigrations
3. python manage.py migrate

Make a new Django app
1. cd backend
2. python manage.py startapp apps/[app name]

Start server
1. cd backend
2. python manage.py runserver

Start client
1. cd frontend
2. npm run start