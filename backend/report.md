Báo cáo dự án Software_Design-22KTPM2
Mô tả
Triển khai hệ thống Text-to-Speech (TTS) và Text-to-Video trong apps/tts_generation, trả về file audio và video (nếu yêu cầu). Hệ thống hỗ trợ tùy chỉnh giọng đọc (vui nhộn cho trẻ em, nghiêm túc cho tài liệu khoa học) và đa ngôn ngữ (tiếng Việt, Anh, Pháp).
Tính năng

Text-to-Speech:
Sử dụng gTTS để tạo giọng nói, pydub để chỉnh sửa audio (pitch, speed).
Tùy chỉnh giọng:
Vui nhộn (trẻ em): Pitch cao (pitch_shift=1.5 hoặc 1.2), tốc độ nhanh (speedup=1.1), phù hợp cho truyện thiếu nhi.
Nghiêm túc (khoa học): Pitch thấp (pitch_shift=0.9), tốc độ chậm (slow=True), phù hợp cho tài liệu khoa học.




Text-to-Video:
Sử dụng moviepy để tạo video với văn bản trên nền đen và âm thanh đi kèm.


API:
/api/tts/generate-audio/: Trả về file audio (<style>_audio.mp3 hoặc output_audio.mp3).
/api/tts/generate-video/: Trả về file video (<style>_video.mp4 hoặc output_video.mp4) với header X-Duration.


Đa ngôn ngữ: Hỗ trợ tiếng Việt (vi), Anh (en), Pháp (fr), và nhiều ngôn ngữ khác qua gTTS.
Database: Lưu thông tin vào:
Voice: Nguồn giọng (provider, language, voice_type).
GeneratedVoice: File audio/video, tham số (text, pitch_shift, speed, style, duration).


Test: Script send_audio_request.py tạo thành công các file audio và video.
Logging: Ghi log chi tiết vào tts_debug.log để debug lỗi (tạo audio, video, file tạm thời).
Xử lý lỗi:
Sửa lỗi ImageMagick (conf.py).
Sửa lỗi seek of closed file, UnboundLocalError, và audio rỗng (serious_science.mp3).



Kết quả thử nghiệm
Giọng vui nhộn (trẻ em)

File: funny_child.mp3
Text: "Once upon a time, there was a funny little bunny who loved to hop around!"
Cấu hình: pitch_shift=1.5, slow=False, style=funny, language=en, speedup=1.1.
Kết quả: Giọng cao, sinh động, phù hợp cho truyện thiếu nhi.

Giọng nghiêm túc (khoa học)

File: serious_science.mp3
Text: "The theory of relativity, proposed by Albert Einstein, revolutionized modern physics."
Cấu hình: pitch_shift=0.9, slow=True, style=serious, language=en.
Kết quả: Giọng trầm, rõ ràng, chậm, phù hợp cho tài liệu khoa học.

Đa ngôn ngữ

Tiếng Việt:
File: vietnamese.mp3
Text: "Ngày xửa ngày xưa, có một con thỏ rất vui tính thích nhảy nhót khắp nơi!"
Cấu hình: pitch_shift=1.5, slow=False, style=funny, language=vi.
Kết quả: Phát âm chính xác, giọng vui nhộn.


Tiếng Anh:
File: english.mp3
Text: "Hello, this is a fun audio!"
Cấu hình: pitch_shift=1.2, slow=False, style=funny, language=en.
Kết quả: Phát âm rõ, giọng sinh động.


Tiếng Pháp:
File: french.mp3
Text: "Il était une fois un petit lapin rigolo qui adorait sauter partout !"
Cấu hình: pitch_shift=1.5, slow=False, style=funny, language=fr.
Kết quả: Phát âm chuẩn, giọng vui nhộn.



Tạo video

File: test_video.mp4
Text: "This is a test video with audio narration."
Cấu hình: pitch_shift=1.0, slow=False, style=None, language=en.
Duration: 3.264s (trả về qua header X-Duration).
Kết quả: Video hiển thị văn bản trên nền đen với âm thanh rõ ràng, duration chính xác.

Repository
https://github.com/thienanle04/Software_Design-22KTPM2
Tác giả
Ngô Xuân Hiếu
