import requests

base_url = "https://26bb-2a09-bac5-d46a-2646-00-3d0-3a.ngrok-free.app/api/tts/"

# Test giọng vui nhộn (trẻ em)
data_funny = {
    "text": "Once upon a time, there was a funny little bunny who loved to hop around!",
    "language": "en",
    "pitch_shift": 1.5,
    "slow": False,
    "style": "funny"
}
response = requests.post(base_url + "generate-audio/", data=data_funny)
if response.status_code == 200:
    with open("funny_child.mp3", "wb") as f:
        f.write(response.content)
    print("Funny audio saved as funny_child.mp3")
else:
    print(f"Funny audio error: {response.status_code}, {response.text}")

# Test giọng nghiêm túc (khoa học) - Tối ưu tham số
data_serious = {
    "text": "The theory of relativity, proposed by Albert Einstein, revolutionized modern physics.",
    "language": "en",
    "pitch_shift": 0.9,  # Giảm nhẹ pitch để nghiêm túc hơn
    "slow": True,        # Chậm để rõ ràng
    "style": "serious"
}
response = requests.post(base_url + "generate-audio/", data=data_serious)
if response.status_code == 200:
    with open("serious_science.mp3", "wb") as f:
        f.write(response.content)
    print("Serious audio saved as serious_science.mp3")
else:
    print(f"Serious audio error: {response.status_code}, {response.text}")

# Test tiếng Việt
data_vi = {
    "text": "Ngày xửa ngày xưa, có một con thỏ rất vui tính thích nhảy nhót khắp nơi!",
    "language": "vi",
    "pitch_shift": 1.5,
    "slow": False,
    "style": "funny"
}
response = requests.post(base_url + "generate-audio/", data=data_vi)
if response.status_code == 200:
    with open("vietnamese.mp3", "wb") as f:
        f.write(response.content)
    print("Vietnamese audio saved as vietnamese.mp3")
else:
    print(f"Vietnamese audio error: {response.status_code}, {response.text}")

# Test tiếng Anh
data_en = {
    "text": "Hello, this is a fun audio!",
    "language": "en",
    "pitch_shift": 1.2,
    "slow": False,
    "style": "funny"
}
response = requests.post(base_url + "generate-audio/", data=data_en)
if response.status_code == 200:
    with open("english.mp3", "wb") as f:
        f.write(response.content)
    print("English audio saved as english.mp3")
else:
    print(f"English audio error: {response.status_code}, {response.text}")

# Test tiếng Pháp
data_fr = {
    "text": "Il était une fois un petit lapin rigolo qui adorait sauter partout !",
    "language": "fr",
    "pitch_shift": 1.5,
    "slow": False,
    "style": "funny"
}
response = requests.post(base_url + "generate-audio/", data=data_fr)
if response.status_code == 200:
    with open("french.mp3", "wb") as f:
        f.write(response.content)
    print("French audio saved as french.mp3")
else:
    print(f"French audio error: {response.status_code}, {response.text}")

# Test tạo video
data_video = {
    "text": "This is a test video with audio narration.",
    "language": "en",
    "pitch_shift": 1.0,
    "slow": False,
    "style": None
}
response = requests.post(base_url + "generate-video/", data=data_video)
if response.status_code == 200:
    with open("test_video.mp4", "wb") as f:
        f.write(response.content)
    duration = response.headers.get('X-Duration', 'Unknown')
    print(f"Video saved as test_video.mp4, duration: {duration} seconds")
else:
    print(f"Video error: {response.status_code}, {response.text}")