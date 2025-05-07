import requests

url = "https://26bb-2a09-bac5-d46a-2646-00-3d0-3a.ngrok-free.app/api/tts/generate-audio/"
data = {
    "text": "Hello, this is a fun audio!",
    "language": "en",
    "pitch_shift": 1.2,
    "slow": False
}

response = requests.post(url, data=data)
if response.status_code == 200:
    with open("output_audio.mp3", "wb") as f:
        f.write(response.content)
    print("Audio saved as output_audio.mp3")
else:
    print(f"Error: {response.status_code}, {response.text}")