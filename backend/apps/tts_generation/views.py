import tempfile
import os
from django.http import FileResponse, JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.core.files import File
from gtts import gTTS
from pydub import AudioSegment
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny
from .models import Voice, GeneratedVoice

@method_decorator(csrf_exempt, name='dispatch')
@permission_classes([AllowAny])
class GenerateAudioView(View):
    def post(self, request):
        try:
            text = request.POST.get('text')
            language = request.POST.get('language', 'en')
            pitch_shift = float(request.POST.get('pitch_shift', 1.0))
            slow = request.POST.get('slow', 'False').lower() == 'true'

            if not text:
                return JsonResponse({'error': 'Text is required'}, status=400)

            # Create or get Voice object
            voice, _ = Voice.objects.get_or_create(
                provider='gTTS',
                language=language,
                voice_type='default'
            )

            # Create temporary file
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_file:
                temp_path = temp_file.name

            # Generate audio with gTTS
            tts = gTTS(text=text, lang=language, slow=slow)
            tts.save(temp_path)

            # Apply pitch shift with pydub
            if pitch_shift != 1.0:
                audio = AudioSegment.from_mp3(temp_path)
                new_rate = int(audio.frame_rate * pitch_shift)
                audio = audio._spawn(audio.raw_data, overrides={'frame_rate': new_rate})
                audio = audio.set_frame_rate(audio.frame_rate)
                audio.export(temp_path, format='mp3')

            # Save to GeneratedVoice
            generated_voice = GeneratedVoice.objects.create(
                voice=voice,
                text=text,
                pitch_shift=pitch_shift,
                speed=1.0 if not slow else 0.5
            )
            with open(temp_path, 'rb') as f:
                django_file = File(f, name=f'audio_{generated_voice.id}.mp3')
                generated_voice.audio_file = django_file
                generated_voice.save()

            # Send file response
            response = FileResponse(open(temp_path, 'rb'), content_type='audio/mpeg')
            response['Content-Disposition'] = 'attachment; filename="output_audio.mp3"'

            # Clean up temporary file after response
            def cleanup():
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

            response.close = cleanup
            return response

        except Exception as e:
            return JsonResponse({'error': f'Failed to send file: {str(e)}'}, status=500)