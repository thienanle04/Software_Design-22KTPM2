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

Start google colab for generating video
1. gg colab link for generate video from image: https://colab.research.google.com/drive/1VEeWr4wNeVybOMgbxZ0u7qDzJyZb3UTN#scrollTo=h02i1O2d55zb
2. gg colab link for generate video from text: https://colab.research.google.com/drive/1t5pG9IQrGUp8esKFLidctdkzXRag_SaM?usp=sharing
3. Run gg colab and get the ngrok Public API URL for each feature
4. Go to backend\backend\settings.py
4. Update API_URL (for generate video from image) amd TEXT_TO_VIDEO_API_URL (for generate video from text)